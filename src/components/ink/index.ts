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

// Overlay components
export {
  Modal,
  ModalPortal,
  ModalOverlay,
  ModalTrigger,
  ModalClose,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalBody,
} from "./Modal";

// Status / Category components
export { Badge, badgeVariants } from "./Badge";

// Tab navigation
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";

// Dropdowns / Selection
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from "./Select";

// Loading states
export { Spinner } from "./Spinner";

// TODO: Additional components coming in Phase 2c
// - Dropdown (Radix DropdownMenu wrapper)
// - AgentActivityTimeline (Geist Mono signature element)
// - CodeSurface (Monaco editor wrapper)
// - PreviewPanel (syntax-highlighted output)
// - Checkbox / Radio (Radix wrapper)
// - Tooltip (Radix Tooltip wrapper)
// - Avatar / Initials
// - Pagination
