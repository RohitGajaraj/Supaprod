/**
 * Browser-side encryption utilities for Impeccable live mode.
 * Encrypts sensitive session data before storing in localStorage.
 * Uses AES-256-GCM with WebCrypto API (available in all modern browsers).
 */
(function (root) {
  "use strict";

  async function createEncryptedStorage({ keyDerivationSalt }) {
    if (!root.crypto || !root.crypto.subtle) {
      console.warn(
        "[impeccable-crypto] WebCrypto not available; falling back to unencrypted storage",
      );
      return createPlaintextStorage();
    }

    // Derive a stable encryption key from the session owner + salt
    // This key is NOT stored; regenerated on every page load
    async function deriveKey(sessionId) {
      const material = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(sessionId + keyDerivationSalt),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"],
      );
      return crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          hash: "SHA-256",
          salt: new TextEncoder().encode(keyDerivationSalt),
          iterations: 100000,
        },
        material,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
      );
    }

    async function encrypt(sessionId, plaintext) {
      try {
        const key = await deriveKey(sessionId);
        const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

        const encrypted = await crypto.subtle.encrypt(
          { name: "AES-GCM", iv },
          key,
          new TextEncoder().encode(plaintext),
        );

        // Format: base64(iv || ciphertext)
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        return btoa(String.fromCharCode(...combined));
      } catch (e) {
        console.error("[impeccable-crypto] Encryption failed:", e.message);
        return null;
      }
    }

    async function decrypt(sessionId, ciphertext) {
      try {
        const key = await deriveKey(sessionId);
        const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);

        return new TextDecoder().decode(decrypted);
      } catch (e) {
        console.error("[impeccable-crypto] Decryption failed:", e.message);
        return null;
      }
    }

    return { encrypt, decrypt };
  }

  function createPlaintextStorage() {
    // Fallback for browsers without WebCrypto (extremely rare in 2026)
    return {
      encrypt: async (_, plaintext) => plaintext,
      decrypt: async (_, ciphertext) => ciphertext,
    };
  }

  root.__IMPECCABLE_CRYPTO__ = {
    createEncryptedStorage,
  };
})(typeof window !== "undefined" ? window : globalThis);
