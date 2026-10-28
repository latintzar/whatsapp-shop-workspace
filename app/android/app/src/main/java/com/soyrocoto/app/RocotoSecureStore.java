package com.soyrocoto.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.io.IOException;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/** Small encrypted store for session and short-lived authentication state. */
final class RocotoSecureStore {
    private static final String STORE = "rocoto-secure-v1";
    private static final String KEY = "rocoto-secure-v1-key";
    private static final String SEP = ".";

    static String read(Context context, String name) throws GeneralSecurityException {
        String encoded = prefs(context).getString(name, null);
        if (encoded == null) return null;
        String[] parts = encoded.split("\\.", -1);
        if (parts.length != 2) {
            throw new GeneralSecurityException("Protected authentication state is malformed.");
        }
        try {
            byte[] iv = Base64.decode(parts[0], Base64.NO_WRAP);
            byte[] ciphertext = Base64.decode(parts[1], Base64.NO_WRAP);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, iv));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException error) {
            throw new GeneralSecurityException("Protected authentication state is malformed.", error);
        }
    }

    static void write(Context context, String name, String value) throws GeneralSecurityException {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key());
        String encoded = Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP) + SEP
            + Base64.encodeToString(cipher.doFinal(value.getBytes(StandardCharsets.UTF_8)), Base64.NO_WRAP);
        if (!prefs(context).edit().putString(name, encoded).commit()) {
            throw new GeneralSecurityException("Could not save protected authentication state.");
        }
    }

    static void remove(Context context, String name) throws GeneralSecurityException {
        if (!prefs(context).edit().remove(name).commit()) {
            throw new GeneralSecurityException("Could not clear protected authentication state.");
        }
    }

    /** Explicit recovery only: discard encrypted session material and its AndroidKeyStore key. */
    static void reset(Context context, String... names) throws GeneralSecurityException {
        SharedPreferences.Editor editor = prefs(context).edit();
        for (String name : names) editor.remove(name);
        if (!editor.commit()) throw new GeneralSecurityException("Could not clear protected authentication state.");
        KeyStore keys = openKeyStore();
        if (keys.containsAlias(KEY)) keys.deleteEntry(KEY);
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(STORE, Context.MODE_PRIVATE);
    }

    private static SecretKey key() throws GeneralSecurityException {
        KeyStore keys = openKeyStore();
        KeyStore.Entry entry = keys.getEntry(KEY, null);
        if (entry instanceof KeyStore.SecretKeyEntry) {
            return ((KeyStore.SecretKeyEntry) entry).getSecretKey();
        }
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(KEY,
            KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .build());
        return generator.generateKey();
    }

    private static KeyStore openKeyStore() throws GeneralSecurityException {
        KeyStore keys = KeyStore.getInstance("AndroidKeyStore");
        try {
            keys.load(null);
        } catch (IOException error) {
            throw new GeneralSecurityException("Could not open protected key storage.", error);
        }
        return keys;
    }

    private RocotoSecureStore() {}
}
