/**
 * Bottom-center toast pill. Speaks in the product voice: "Good call. The PR
 * is open." Auto-dismiss is the caller's job (about 3.5s).
 */
export interface ToastProps {
  /** moss = positive confirmation · neutral = everything else */
  tone?: "moss" | "neutral";
  children: React.ReactNode;
}
