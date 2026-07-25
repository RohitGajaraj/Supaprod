import { describe, it, expect } from "bun:test";
import { providerLabel } from "./ModelSwitcher";

/**
 * Test for ModelSwitcher component and providerLabel utility.
 *
 * SCOPE: Unit tests for the providerLabel helper function which maps provider IDs
 * to human-friendly labels. This is used in the model dropdown to display provider names.
 *
 * RATIONALE: The provider map has 13 known entries plus a fallback title-case rule.
 * If the map is out of sync with supported providers or the fallback breaks,
 * users see garbled provider names in the model picker.
 */

describe("providerLabel (model provider display name)", () => {
  it("maps known provider IDs to friendly names", () => {
    expect(providerLabel("google")).toBe("Google");
    expect(providerLabel("openai")).toBe("OpenAI");
    expect(providerLabel("anthropic")).toBe("Anthropic");
    expect(providerLabel("deepseek")).toBe("DeepSeek");
    expect(providerLabel("xai")).toBe("xAI");
    expect(providerLabel("moonshot")).toBe("Moonshot");
    expect(providerLabel("qwen")).toBe("Qwen");
    expect(providerLabel("minimax")).toBe("MiniMax");
    expect(providerLabel("mistral")).toBe("Mistral");
    expect(providerLabel("groq")).toBe("Groq");
    expect(providerLabel("openrouter")).toBe("OpenRouter");
    expect(providerLabel("together")).toBe("Together");
    expect(providerLabel("ollama")).toBe("Ollama");
  });

  it("falls back to title-cased provider ID for unknown providers", () => {
    expect(providerLabel("unknown")).toBe("Unknown");
    expect(providerLabel("custom")).toBe("Custom");
    expect(providerLabel("abc")).toBe("Abc");
  });

  it("preserves case in known mappings (e.g., xAI, DeepSeek, OpenAI)", () => {
    // These are specifically cased in the known map, not auto-title-cased
    expect(providerLabel("xai")).toBe("xAI");
    expect(providerLabel("deepseek")).toBe("DeepSeek");
    expect(providerLabel("openai")).toBe("OpenAI");
    expect(providerLabel("openrouter")).toBe("OpenRouter");
    expect(providerLabel("minimax")).toBe("MiniMax");
  });

  it("handles empty string by returning empty title-cased result", () => {
    // Empty string: charAt(0) would throw if unchecked, but slice(1) of empty is empty
    expect(providerLabel("")).toBe("");
  });

  it("handles single-character provider ID", () => {
    expect(providerLabel("x")).toBe("X");
  });
});

/**
 * ADDITIONAL TEST SKELETONS FOR MODELSWITCHER COMPONENT
 *
 * These are component-level integration tests that require:
 * - QueryClientProvider wrapper
 * - Mock server functions (listApiKeys, listPlatformProviders)
 * - RTL render + interaction
 *
 * SKELETON 1: Renders model picker button with current selection
 * - Mock keys and platform providers
 * - Render ModelSwitcher with value="gpt-4"
 * - Assert: Button displays "GPT-4" or similar
 *
 * SKELETON 2: Opens popover on button click
 * - Render ModelSwitcher
 * - Click trigger button
 * - Assert: Popover content is visible
 * - Assert: Models are grouped by provider
 *
 * SKELETON 3: Calls onChange when model is selected
 * - Create mock onChange handler
 * - Render ModelSwitcher with onChange prop
 * - Click a model option
 * - Assert: onChange was called with the model ID
 *
 * SKELETON 4: Filters available models based on held API keys
 * - Mock listApiKeys to return only ["openai"]
 * - Render ModelSwitcher
 * - Assert: Only OpenAI models are available
 * - Assert: Other provider models show "add key" CTA
 *
 * SKELETON 5: Shows "Auto" option at top of popover
 * - Render ModelSwitcher
 * - Open popover
 * - Assert: "Auto" or capability-routing label is first option
 */
