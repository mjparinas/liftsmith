"use client";

// Piper Amy (en_US-amy-low) for the voice coach: the ONNX model and phonemizer live under /piper/
// (scripts/piper.mjs copies them into the app). Pro-only; voice.ts falls back to system TTS on any
// failure. Amy is English only.
import type { InferenceSession, Tensor } from "onnxruntime-web";

export const AMY_VOICE_ID = "en_US-amy-low";
export const PIPER_BASE = "/piper";

type PhonemizeFactory = (opts: {
  print: (data: string) => void;
  printErr: (message: string) => void;
  locateFile: (url: string) => string;
}) => Promise<{ callMain: (args: string[]) => void }>;

type OrtModule = typeof import("onnxruntime-web");

interface ModelConfig {
  audio: { sample_rate: number };
  espeak: { voice: string };
  inference: { noise_scale: number; length_scale: number; noise_w: number };
  speaker_id_map: Record<string, number>;
}

let ort: OrtModule | null = null;
let session: InferenceSession | null = null;
let modelConfig: ModelConfig | null = null;
let createPhonemize: PhonemizeFactory | null = null;
let initPromise: Promise<void> | null = null;
let broken = false;
let audioEl: HTMLAudioElement | null = null;

/** True until Piper fails once this session; then the coach stays on system TTS. */
export function amyUsable(): boolean {
  return !broken && typeof window !== "undefined";
}

export function amyWarm(): void {
  if (!amyUsable() || initPromise) return;
  void ensureReady().catch(() => {
    broken = true;
  });
}

async function ensureReady(): Promise<void> {
  if (session && modelConfig && createPhonemize) return;
  if (broken) throw new Error("amy broken");
  if (!initPromise) {
    initPromise = (async () => {
      const ortMod = await import("onnxruntime-web");
      ort = ortMod;
      if (ort.env?.wasm) {
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.wasmPaths = `${PIPER_BASE}/onnx/`;
      }
      if (ort.env && "allowLocalModels" in ort.env) (ort.env as { allowLocalModels?: boolean }).allowLocalModels = false;

      const ph = (await import(/* webpackIgnore: true */ `${PIPER_BASE}/phonemize/piper_phonemize.mjs`)) as {
        createPiperPhonemize: PhonemizeFactory;
      };
      createPhonemize = ph.createPiperPhonemize;

      const cfgRes = await fetch(`${PIPER_BASE}/voices/${AMY_VOICE_ID}.onnx.json`);
      if (!cfgRes.ok) throw new Error("amy config missing");
      modelConfig = (await cfgRes.json()) as ModelConfig;

      const modelRes = await fetch(`${PIPER_BASE}/voices/${AMY_VOICE_ID}.onnx`);
      if (!modelRes.ok) throw new Error("amy model missing");
      const buf = await modelRes.arrayBuffer();
      session = await ort.InferenceSession.create(buf, { executionProviders: ["wasm"] });
    })().catch((e) => {
      broken = true;
      initPromise = null;
      throw e;
    });
  }
  await initPromise;
}

function pcm2wav(pcm: Float32Array, channels: number, sampleRate: number): ArrayBuffer {
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + pcm.length * bytesPerSample);
  const view = new DataView(buffer);
  const writeStr = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + pcm.length * bytesPerSample, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, pcm.length * bytesPerSample, true);
  let p = 44;
  for (let i = 0; i < pcm.length; i++, p += 2) {
    const v = Math.max(-1, Math.min(1, pcm[i]!));
    view.setInt16(p, v < 0 ? v * 0x8000 : v * 0x7fff, true);
  }
  return buffer;
}

async function phonemeIds(text: string): Promise<number[]> {
  if (!createPhonemize || !modelConfig) throw new Error("amy not ready");
  const input = JSON.stringify([{ text: text.trim() }]);
  return new Promise((resolve, reject) => {
    void createPhonemize!({
      print: (data) => {
        try {
          resolve((JSON.parse(data) as { phoneme_ids: number[] }).phoneme_ids);
        } catch (e) {
          reject(e);
        }
      },
      printErr: (message) => reject(new Error(message)),
      locateFile: (url) => {
        if (url.endsWith(".wasm")) return `${PIPER_BASE}/phonemize/piper_phonemize.wasm`;
        if (url.endsWith(".data")) return `${PIPER_BASE}/phonemize/piper_phonemize.data`;
        return url;
      },
    }).then((mod) => {
      mod.callMain(["-l", modelConfig!.espeak.voice, "--input", input, "--espeak_data", "/espeak-ng-data"]);
    }, reject);
  });
}

async function synthesize(text: string): Promise<Blob> {
  await ensureReady();
  if (!ort || !session || !modelConfig) throw new Error("amy not ready");
  const ids = await phonemeIds(text);
  if (!ids.length) throw new Error("amy empty phonemes");
  const feeds: Record<string, Tensor> = {
    input: new ort.Tensor("int64", ids, [1, ids.length]),
    input_lengths: new ort.Tensor("int64", [ids.length], [1]),
    scales: new ort.Tensor(
      "float32",
      [modelConfig.inference.noise_scale, modelConfig.inference.length_scale, modelConfig.inference.noise_w],
      [3],
    ),
  };
  if (Object.keys(modelConfig.speaker_id_map).length) {
    feeds.sid = new ort.Tensor("int64", [0], [1]);
  }
  const out = await session.run(feeds);
  const pcm = out.output?.data as Float32Array | undefined;
  if (!pcm) throw new Error("amy no audio");
  return new Blob([pcm2wav(pcm, 1, modelConfig.audio.sample_rate)], { type: "audio/wav" });
}

function playBlob(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (audioEl) {
        audioEl.pause();
        URL.revokeObjectURL(audioEl.src);
      }
      const url = URL.createObjectURL(blob);
      const el = new Audio(url);
      audioEl = el;
      el.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      el.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("amy play failed"));
      };
      void el.play().catch(reject);
    } catch (e) {
      reject(e);
    }
  });
}

/** Speak with Amy. Returns false when Piper fails so the caller can use system TTS. */
export async function speakAmy(text: string, timeoutMs = 12_000): Promise<boolean> {
  if (!text.trim() || !amyUsable()) return false;
  try {
    const blob = await Promise.race([
      synthesize(text),
      new Promise<Blob>((_, rej) => setTimeout(() => rej(new Error("amy timeout")), timeoutMs)),
    ]);
    await playBlob(blob);
    return true;
  } catch {
    broken = true;
    return false;
  }
}

export function stopAmy(): void {
  if (!audioEl) return;
  audioEl.pause();
  URL.revokeObjectURL(audioEl.src);
  audioEl = null;
}
