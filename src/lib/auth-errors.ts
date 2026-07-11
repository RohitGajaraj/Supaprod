// Human, specific, ui-voice auth error copy: the security-aware translation
// layer between raw provider errors (Supabase / Lovable auth) and what the user
// reads. Never surface a raw error dump on an auth surface: it looks broken,
// leaks internals, and reads as untrustworthy on the first/last screen a user
// sees. Pure + tested; the auth MECHANISM is untouched by this file.
//
// Security note: the "signin" mapping is deliberately neutral about whether an
// email exists (Supabase returns one generic "Invalid login credentials" for
// both a wrong password and an unknown email, and we keep it that way). Signup
// and invite inherently reveal some state (you cannot create a duplicate, an
// invite is email-bound), which is the industry-standard tradeoff.

export type AuthContext =
  "signin" | "signup" | "reset-request" | "reset-update" | "invite" | "oauth";

function extractMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const m = (error as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "";
}

function has(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

function defaultFor(context: AuthContext): string {
  switch (context) {
    case "signin":
      return "Couldn't sign you in. Try again in a moment.";
    case "signup":
      return "Couldn't create your account. Try again in a moment.";
    case "reset-request":
      return "Couldn't send the reset link. Try again in a moment.";
    case "reset-update":
      return "Couldn't update your password. Try again in a moment.";
    case "invite":
      return "This invitation could not be accepted. Ask for a fresh link.";
    case "oauth":
      return "Google sign-in didn't work. Try again.";
  }
}

/**
 * Translate a raw auth error into a clear, human, ui-voice message.
 * Case-insensitive substring match on the provider message, ordered specific
 * to general; falls back to a calm per-context default (never the raw dump).
 */
export function authErrorMessage(error: unknown, context: AuthContext = "signin"): string {
  const raw = extractMessage(error).toLowerCase();

  if (has(raw, ["invalid login credentials", "invalid credentials", "invalid email or password"])) {
    return "That email or password isn't right. Try again.";
  }

  if (has(raw, ["email not confirmed", "not confirmed", "confirm your email"])) {
    return "Confirm your email first. Check your inbox for the link we sent.";
  }

  if (
    has(raw, [
      "user already registered",
      "already registered",
      "already been registered",
      "user already exists",
    ])
  ) {
    // Signup deliberately reveals duplicates (see the header security note:
    // you cannot create a duplicate account, so this is the industry-standard
    // tradeoff). A generic retry message here is a dead end: the user retries
    // forever and is never told to sign in. Every other context stays neutral.
    return context === "signup"
      ? "An account already uses this email. Sign in instead."
      : defaultFor(context);
  }

  if (has(raw, ["password should be at least", "password is too short", "at least 6"])) {
    return "Password must be at least 6 characters.";
  }

  if (has(raw, ["should be different", "same as the old", "different from the old"])) {
    return "Choose a password you haven't used before.";
  }

  if (
    has(raw, [
      "rate limit",
      "too many requests",
      "too many",
      "for security purposes",
      "you can only request this after",
      "email rate limit",
    ])
  ) {
    return "Too many tries. Wait a moment, then try again.";
  }

  if (has(raw, ["has expired", "expired", "otp_expired", "invalid or has expired"])) {
    return context === "invite"
      ? "This invitation link has expired or was already used. Ask for a fresh one."
      : "This link has expired. Request a new one.";
  }

  if (
    has(raw, [
      "invalid token",
      "token not found",
      "no associated user",
      "invalid or missing",
      "not found",
    ])
  ) {
    return context === "invite"
      ? "This invitation link isn't valid. Ask your workspace admin to resend it."
      : "This link isn't valid. Request a new one.";
  }

  if (has(raw, ["email address is invalid", "invalid email", "unable to validate email"])) {
    return "That email doesn't look right. Check it and try again.";
  }

  if (
    has(raw, [
      "failed to fetch",
      "networkerror",
      "network error",
      "load failed",
      "timeout",
      "timed out",
    ])
  ) {
    return "Couldn't reach the server. Check your connection and try again.";
  }

  if (has(raw, ["signups not allowed", "signup is disabled", "signups disabled"])) {
    return "New sign-ups are closed right now.";
  }

  return defaultFor(context);
}
