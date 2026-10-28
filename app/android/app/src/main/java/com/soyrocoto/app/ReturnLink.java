package com.soyrocoto.app;

import java.net.URI;
import java.net.URISyntaxException;

/** Untrusted links are navigation signals; the app redeems an auth callback with its held verifier. */
final class ReturnLink {
    private static final String CODE = "(?i:[234A56B789CDEFGHJKMNPQRSTUVWXYZ]{6})";
    private static final String ATTEMPT = "[A-Za-z0-9_-]{20,128}";
    private static final String AUTH_CODE = "[A-Za-z0-9_-]{43}";

    static boolean accepts(String raw) {
        if (raw == null || raw.length() > 256) return false;
        try {
            URI uri = new URI(raw);
            if (uri.getRawUserInfo() != null || uri.getPort() != -1 || uri.getRawFragment() != null) return false;
            String path = uri.getRawPath();
            if ("https".equals(uri.getScheme()) && "shop.example.invalid".equals(uri.getHost())
                && "/bodega-app/auth".equals(path)) {
                String query = uri.getRawQuery();
                return query != null && query.matches("(?:attempt=" + ATTEMPT + "&code=" + AUTH_CODE
                    + "|code=" + AUTH_CODE + "&attempt=" + ATTEMPT + ")");
            }
            if ("https".equals(uri.getScheme()) && "shop.example.invalid".equals(uri.getHost())
                && "/bodega-app/".equals(path) && uri.getRawQuery() != null) {
                return uri.getRawQuery().matches("lista=" + CODE);
            }
            if (uri.getRawQuery() == null) {
                if ("rocoto".equals(uri.getScheme()) && "waitlist".equals(uri.getHost())) {
                    return path != null && path.matches("/" + CODE);
                }
                if ("https".equals(uri.getScheme()) && "shop.example.invalid".equals(uri.getHost())) {
                    return path != null && path.matches("/bodega-app/waitlist/" + CODE);
                }
            }
            if (!"rocoto".equals(uri.getScheme()) || !"return".equals(uri.getHost())) return false;
            if (path != null && !path.isEmpty() && !"/".equals(path)) return false;
            return uri.getRawQuery() == null;
        } catch (URISyntaxException ignored) {
            return false;
        }
    }

    /** The one local entry the app may hand to the browser for the Meta approval. */
    static boolean acceptsMetaEntry(String raw) {
        if (raw == null || raw.length() > 512) return false;
        try {
            URI uri = new URI(raw);
            if (!"https".equals(uri.getScheme()) || !"shop.example.invalid".equals(uri.getHost())
                || uri.getRawUserInfo() != null || uri.getPort() != -1
                || !"/bodega-pay-later/".equals(uri.getRawPath()) || !"/start/connect".equals(uri.getRawFragment())) return false;
            String query = uri.getRawQuery();
            return query != null && query.matches("lang=(?:en|es)&mobile=" + ATTEMPT);
        } catch (URISyntaxException ignored) {
            return false;
        }
    }

    private ReturnLink() {}
}
