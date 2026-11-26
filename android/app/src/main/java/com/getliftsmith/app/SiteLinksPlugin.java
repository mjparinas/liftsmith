package com.getliftsmith.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Website links tapped inside the app open in the browser (docs/decisions/programs.md "Android App Links").
 * The app claims most of www.getliftsmith.com as App Links (AndroidManifest.xml, src/lib/appLinks.ts), so a plain
 * ACTION_VIEW for "See this gym's page" or a gym's poster would come straight back to the app instead of showing the
 * page. A browser selector sends the link to the phone's browser; with no browser to pick, Android chooses as usual.
 * iOS: Universal Links are deferred (open-items.md), and Safari opens these links meanwhile.
 */
@CapacitorPlugin(name = "SiteLinks")
public class SiteLinksPlugin extends Plugin {

    static final String HOST = "www.getliftsmith.com";

    @Override
    public Boolean shouldOverrideLoad(Uri url) {
        if (url == null || !"https".equals(url.getScheme()) || !HOST.equals(url.getHost())) return null;
        Intent view = new Intent(Intent.ACTION_VIEW, url).addCategory(Intent.CATEGORY_BROWSABLE);
        Intent inBrowser = new Intent(view);
        inBrowser.setSelector(Intent.makeMainSelectorActivity(Intent.ACTION_MAIN, Intent.CATEGORY_APP_BROWSER));
        inBrowser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(inBrowser);
        } catch (ActivityNotFoundException e) {
            try {
                getContext().startActivity(view.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            } catch (ActivityNotFoundException ignored) {
                // Nothing on the phone opens web links.
            }
        }
        return true;
    }
}
