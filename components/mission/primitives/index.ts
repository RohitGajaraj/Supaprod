// Mission Control comprehension primitives (design-language-spec section 6).
// Every Mission Control surface is assembled from these; none may be
// re-implemented locally. Vocabulary + draw helper: src/lib/mission-vocabulary.ts.

export { SurfaceHeader, AgentChip } from "./SurfaceHeader";
export type { SurfaceHeaderProps, SurfaceHeaderState } from "./SurfaceHeader";
export { PulseLine } from "./PulseLine";
export type {
  PulseLineProps,
  PulseLineActiveProps,
  PulseLineIdleProps,
  PulseLineState,
} from "./PulseLine";
export { GateChip, Kbd } from "./GateChip";
export type { GateChipProps, GateChipPillProps, GateChipCardProps, GateReceipt } from "./GateChip";
export { ReceiptLine, ReceiptCount } from "./ReceiptLine";
export type { ReceiptLineProps } from "./ReceiptLine";
export { NextLine } from "./NextLine";
export type { NextLineProps, JourneyDoor } from "./NextLine";
export { WarmSlot, selectWarmSlot } from "./WarmSlot";
export type { WarmSlotProps, WarmSlotLine, WarmSlotKind } from "./WarmSlot";
