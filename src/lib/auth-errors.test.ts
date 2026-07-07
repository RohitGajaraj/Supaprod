import { describe, it, expect } from "bun:test";
import { authErrorMessage, type AuthContext } from "./auth-errors";

// auth_surfaces pass: the humanizer is the only thing standing between a raw
// Supabase/Lovable error and the first/last screen a user sees. Lock the
// mappings, the neutral (non-enumerating) sign-in message, the never-a-raw-dump
// fallback, and the zero-AI-tells rule (no em/en dashes).

describe("authErrorMessage", () => {
  it("maps invalid credentials to a neutral message (no email enumeration)", () => {
    const msg = authErrorMessage(new Error("Invalid login credentials"), "signin");
    expect(msg).toBe("That email or password isn't right. Try again.");
    // Must not hint whether the email or the password specifically was wrong.
    expect(msg.toLowerCase()).not.toContain("no account");
    expect(msg.toLowerCase()).not.toContain("does not exist");
  });

  it("maps an unconfirmed email", () => {
    expect(authErrorMessage({ message: "Email not confirmed" }, "signin")).toContain(
      "Confirm your email",
    );
  });

  it("maps already-registered on signup", () => {
    expect(authErrorMessage("User already registered", "signup")).toContain(
      "already uses this email",
    );
  });

  it("maps the short-password error", () => {
    expect(
      authErrorMessage(new Error("Password should be at least 6 characters"), "signup"),
    ).toBe("Password must be at least 6 characters.");
  });

  it("maps rate limiting", () => {
    expect(authErrorMessage(new Error("email rate limit exceeded"), "reset-request")).toContain(
      "Too many tries",
    );
    expect(
      authErrorMessage(
        new Error("For security purposes, you can only request this after 55 seconds"),
        "reset-request",
      ),
    ).toContain("Too many tries");
  });

  it("maps an expired reset link", () => {
    expect(authErrorMessage(new Error("Token has expired"), "reset-update")).toContain("expired");
  });

  it("maps an expired invite distinctly from a generic link", () => {
    const invite = authErrorMessage(new Error("Token has expired or is invalid"), "invite");
    expect(invite).toContain("invitation");
  });

  it("maps an invalid invite token", () => {
    expect(authErrorMessage(new Error("Invalid token"), "invite")).toContain("invitation");
  });

  it("maps a network failure", () => {
    expect(authErrorMessage(new TypeError("Failed to fetch"), "signin")).toContain("connection");
  });

  it("falls back to a calm per-context default, never the raw dump", () => {
    const raw = "pg: duplicate key value violates unique constraint profiles_pkey";
    const msg = authErrorMessage(new Error(raw), "signup");
    expect(msg).not.toContain("constraint");
    expect(msg).not.toContain("pg:");
    expect(msg).toBe("Couldn't create your account. Try again in a moment.");
  });

  it("handles null / undefined / empty errors without throwing", () => {
    expect(authErrorMessage(null, "signin")).toBe("Couldn't sign you in. Try again in a moment.");
    expect(authErrorMessage(undefined, "oauth")).toBe("Google sign-in didn't work. Try again.");
    expect(authErrorMessage({}, "invite")).toContain("invitation");
  });

  it("contains no em or en dashes in any mapped message (zero AI tells)", () => {
    const contexts: AuthContext[] = [
      "signin",
      "signup",
      "reset-request",
      "reset-update",
      "invite",
      "oauth",
    ];
    const samples = [
      "Invalid login credentials",
      "Email not confirmed",
      "User already registered",
      "Password should be at least 6 characters",
      "email rate limit exceeded",
      "Token has expired",
      "Invalid token",
      "Failed to fetch",
      "something entirely unknown happened",
    ];
    for (const c of contexts) {
      for (const s of samples) {
        const m = authErrorMessage(new Error(s), c);
        expect(m.includes("\u2014") || m.includes("\u2013")).toBe(false);
      }
    }
  });
});
