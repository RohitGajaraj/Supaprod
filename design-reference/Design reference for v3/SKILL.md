---
name: cadence-design
description: Use this skill to generate well-branded interfaces and assets for Cadence (Obsidian v3 design language), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, then read handoff/DESIGN-OBSIDIAN.md (the design contract) and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Hard laws to obey in every output: colors only from the role colors and named ramps (never invent a hex); ember only for things that need a human; plain-words buttons with consequence in helper text; the humanized-output law (no em/en dashes, no AI-cliche words, no exclamation marks, no emoji); the restraint budget (90% neutral, one ember CTA, max one aurora card, max one shimmer, max two pencil annotations); grayscale test before shipping.
