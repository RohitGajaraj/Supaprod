/**
 * Ink — Supaprod's Tempo v5 design system component library.
 *
 * All components resolve their colors from --ds-* CSS custom properties,
 * which adapt to dark (default) and light themes via [data-theme='light'].
 * No hardcoded hex values in component code.
 *
 * Responsive breakpoints: 320px (mobile), 768px (tablet), 1280px (desktop).
 * Typography: Geist Sans (all UI) / Geist Mono (code) / Geist Pixel (brand only).
 * Focus management: ember ring via --ds-focus-ring, never outline: none.
 * Motion: respects prefers-reduced-motion and data-motion="off".
 *
 * Composition: built with Radix UI for accessibility + Tailwind v4 for styling.
 */

// Core interactive components
export { Button, buttonVariants } from "./Button";
export { Input, Textarea } from "./Input";

// Surface components
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./Card";

// TODO: Additional components coming in Phase 2b
// - Modal (Radix Dialog wrapper)
// - Tabs (Radix Tabs wrapper)
// - Dropdown (Radix DropdownMenu wrapper)
// - Badge / Status chips
// - AgentActivityTimeline (Geist Mono signature element)
// - CodeSurface (Monaco editor wrapper)
// - PreviewPanel (syntax-highlighted output)
// - Select (Radix Select wrapper)
// - Checkbox / Radio (Radix wrapper)
// - Tooltip (Radix Tooltip wrapper)
