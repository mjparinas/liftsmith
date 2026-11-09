// Stryker's Vitest runner (10.0.0) filters a mutant's tests by name, joining suite and test names
// with a space. Vitest 5 matches names as "suite > test", so the filter matches nothing and every
// mutant "survives" with 0 tests run. This runner keeps the per-test coverage but runs each covering
// test file whole. Drop it once @stryker-mutator/vitest-runner supports Vitest 5.
//
// It also counts a test file that fails to load as a failure. A mutant in module-level code (such as
// the trophy list) can crash the import; Vitest then reports a file error with no tests, which the
// stock runner reads as "survived".
import { declareFactoryPlugin, PluginKind } from "@stryker-mutator/api/plugin";
import { DryRunStatus, determineHitLimitReached, TestStatus, toMutantRunResult } from "@stryker-mutator/api/test-runner";
import { strykerPlugins as vitestPlugins } from "@stryker-mutator/vitest-runner";

const vitestFactory = vitestPlugins.find((plugin) => plugin.name === "vitest").factory;

function createRunner(injector) {
  const runner = injector.injectFunction(vitestFactory);
  runner.mutantRun = async (options) => {
    runner.ctx.provide("mode", "mutant");
    runner.ctx.provide("hitLimit", options.hitLimit);
    runner.ctx.provide("mutantActivation", options.mutantActivation);
    runner.ctx.provide("activeMutant", options.activeMutant.id);
    const testFiles = options.testFilter && [...new Set(options.testFilter.map((id) => id.split("#")[0]))];
    const result = await runner.run({ testFiles, relatedFiles: [options.sandboxFileName] });
    const timeOut = determineHitLimitReached(runner.readHitCount(), options.hitLimit);
    return toMutantRunResult(timeOut ?? withLoadErrors(result, runner.ctx.state.getFiles()));
  };
  return runner;
}
createRunner.inject = ["$injector"];

function withLoadErrors(result, files) {
  if (result.status !== DryRunStatus.Complete || result.tests.some((t) => t.status === TestStatus.Failed)) return result;
  const broken = files.filter((f) => f.result?.state === "fail" && f.result.errors?.length);
  if (!broken.length) return result;
  const failures = broken.map((f) => ({
    id: `${f.filepath}#(file failed to load)`,
    name: `${f.name} (file failed to load)`,
    status: TestStatus.Failed,
    failureMessage: f.result.errors[0].message ?? "Test file failed to load",
    timeSpentMs: 0,
  }));
  return { ...result, tests: [...result.tests, ...failures] };
}

export const strykerPlugins = [declareFactoryPlugin(PluginKind.TestRunner, "vitest5", createRunner)];
