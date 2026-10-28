package com.soyrocoto.app;

import static org.junit.Assert.*;
import org.junit.Test;

public class ReturnLinkTest {
    @Test public void acceptsOnlyBoundedOpaqueReturnSignals() {
        assertTrue(ReturnLink.accepts("rocoto://return"));
        assertTrue(ReturnLink.accepts("rocoto://return/"));
        assertTrue(ReturnLink.accepts("rocoto://waitlist/ABC234"));
        assertTrue(ReturnLink.accepts("rocoto://waitlist/abc234"));
        assertTrue(ReturnLink.accepts("https://shop.example.invalid/bodega-app/waitlist/ABC234"));
        assertTrue(ReturnLink.accepts("https://shop.example.invalid/bodega-app/?lista=ABC234"));
        for (String url : new String[] {
            "https://example.com", "rocoto://return.evil", "rocoto://user@return",
            "rocoto://return:123", "rocoto://return/path", "rocoto://return#secret",
            "rocoto://return?code=provider-code", "rocoto://return?phone=15551234567",
            "rocoto://return?runId=123e4567-e89b-42d3-a456-426614174000",
            "rocoto://return?state=Abcdefghijklmnopqrstuvwxyz_123456789",
            "rocoto://return?state=123", "rocoto://return?runId=invalid",
            "rocoto://return?state=abcdefghijklmnopqrstuvwxyz&state=abcdefghijklmnopqrstuvwxyz",
            "rocoto://return?state=abcdefghijklmnopqrstuvwxyz&token=secret",
            "rocoto://return?state=%61bcdefghijklmnopqrstuvwxyz",
            "rocoto://waitlist/ABC234?token=secret",
            "rocoto://waitlist/INVALID", "rocoto://waitlist/ABC234/extra",
            "https://shop.example.invalid/bodega-pay-later/?lista=ABC234",
            "https://shop.example.invalid.evil/bodega-app/waitlist/ABC234",
            "https://shop.example.invalid/bodega-app/waitlist/ABC234#secret",
            "https://shop.example.invalid/bodega-app/?lista=ABC234&token=secret",
            "https://shop.example.invalid/bodega-app/?lista=ABC234&lista=ABC234",
            "rocoto://return?state=" + "a".repeat(300)
        }) assertFalse(url, ReturnLink.accepts(url));
        assertFalse(ReturnLink.accepts(null));
    }

    @Test public void acceptsOnlyTheBoundHttpsAuthCallback() {
        String attempt = "a".repeat(32);
        String code = "b".repeat(43);
        String origin = "https://shop.example.invalid/bodega-app/auth";
        assertTrue(ReturnLink.accepts(origin + "?attempt=" + attempt + "&code=" + code));
        assertTrue(ReturnLink.accepts(origin + "?code=" + code + "&attempt=" + attempt));
        for (String url : new String[] {
            "rocoto://auth?attempt=" + attempt + "&code=" + code,
            origin, origin + "/?attempt=" + attempt + "&code=" + code,
            origin + "?attempt=" + attempt + "&code=" + code + "&code=" + code,
            origin + "?attempt=" + attempt + "&code=" + code + "&state=x",
            origin + "?attempt=" + "a".repeat(19) + "&code=" + code,
            origin + "?attempt=" + attempt + "&code=" + "b".repeat(42),
            origin + "?attempt=" + attempt + "&code=" + code + "#fragment",
            "https://user@shop.example.invalid/bodega-app/auth?attempt=" + attempt + "&code=" + code,
            "https://shop.example.invalid:443/bodega-app/auth?attempt=" + attempt + "&code=" + code,
            origin + "?attempt=%61" + attempt.substring(1) + "&code=" + code
        }) assertFalse(url, ReturnLink.accepts(url));
    }

    @Test public void acceptsOnlyTheFixedMetaHandoffEntry() {
        String attempt = "a".repeat(32);
        String entry = "https://shop.example.invalid/bodega-pay-later/?lang=en&mobile=" + attempt + "#/start/connect";
        assertTrue(ReturnLink.acceptsMetaEntry(entry));
        assertTrue(ReturnLink.acceptsMetaEntry(entry.replace("lang=en", "lang=es")));
        for (String url : new String[] {
            entry.replace("#/start/connect", "#/start/business"),
            entry.replace("bodega-pay-later", "bodega-app"),
            entry.replace("shop.example.invalid", "shop.example.invalid.evil"),
            entry.replace("?lang=en&mobile=", "?mobile=" + attempt + "&lang=en&mobile="),
            entry.replace("https://", "http://")
        }) assertFalse(url, ReturnLink.acceptsMetaEntry(url));
    }
}
