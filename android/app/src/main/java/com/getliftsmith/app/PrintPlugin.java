package com.getliftsmith.app;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Prints a sheet the web layer drew (Print routine, src/lib/print.ts; docs/decisions/printable-plans.md). The app's
 * WebView ignores window.print(), so the page's HTML is loaded into a WebView of its own, off screen, and its print
 * adapter goes to Android's print service, whose window also offers Save as PDF. The WebView is kept until the job is
 * handed over, because the adapter draws from it. iOS counterpart: PrintPlugin in DelightPlugins.swift.
 */
@CapacitorPlugin(name = "Print")
public class PrintPlugin extends Plugin {

    /** The WebView being printed, held so it isn't collected before the print service has drawn it. */
    private WebView printing;

    @PluginMethod
    public void print(PluginCall call) {
        String html = call.getString("html");
        String name = call.getString("name", "Liftsmith");
        if (html == null || getActivity() == null) {
            call.reject("Nothing to print");
            return;
        }
        getActivity()
            .runOnUiThread(() -> {
                WebView view = new WebView(getActivity());
                view.getSettings().setJavaScriptEnabled(false);
                view.setWebViewClient(
                    new WebViewClient() {
                        @Override
                        public void onPageFinished(WebView v, String url) {
                            PrintManager manager = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                            if (manager == null) {
                                printing = null;
                                call.reject("Printing isn't available");
                                return;
                            }
                            PrintDocumentAdapter adapter = v.createPrintDocumentAdapter(name);
                            PrintAttributes attrs = new PrintAttributes.Builder().setColorMode(PrintAttributes.COLOR_MODE_COLOR).build();
                            manager.print(name, adapter, attrs);
                            call.resolve();
                        }
                    }
                );
                printing = view;
                view.loadDataWithBaseURL("https://www.getliftsmith.com/", html, "text/html", "utf-8", null);
            });
    }
}
