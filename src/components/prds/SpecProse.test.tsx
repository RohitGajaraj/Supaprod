import { describe, expect, test, afterEach } from "bun:test";
import { render, cleanup, screen } from "@testing-library/react";
import { SpecProse } from "./SpecProse";
import type { Citation } from "@/components/product/CitationsCard";

/**
 * THE CITATIONS WERE THE POINT, SO THEY ARE WHAT IS PINNED.
 *
 * Until 2026-08-10 the spec body printed `[1]` as three literal characters. The
 * splitter that would have turned it into a chip had been written, unit-tested
 * and left with no consumers, and a renderer with a hover excerpt sat in another
 * folder unreachable from anywhere. Nothing failed, nothing typechecked wrong,
 * and the largest surface in the product rendered its own evidence as
 * punctuation for months.
 *
 * A unit test on the splitter would not have caught it and did not: the splitter
 * was green the whole time. What was missing is a test that the DOCUMENT renders
 * a citation, so that is what these are. The second suite is the more important
 * one: a marker with nothing behind it must never wear a chip's clothes.
 */

afterEach(cleanup);

const cite = (n: number, over: Partial<Citation> = {}): Citation => ({
  n,
  source_kind: "signal",
  source_id: `sig-${n}`,
  title: `Source ${n}`,
  snippet: `What source ${n} actually said.`,
  ...over,
});

describe("a marker the spec can answer for becomes a real citation", () => {
  test("renders a button, not the characters", () => {
    render(<SpecProse body="Checkout drops a fifth of users [1]." citations={[cite(1)]} />);
    const chip = screen.getByRole("button", { name: /\[1\]/ });
    expect(chip).toBeTruthy();
  });

  test("carries the source and its excerpt, so the evidence is one hover away", () => {
    render(<SpecProse body="A claim [1]." citations={[cite(1)]} />);
    expect(screen.getByText("Source 1")).toBeTruthy();
    expect(screen.getByText("What source 1 actually said.")).toBeTruthy();
  });

  test("every marker in a paragraph resolves, not just the first", () => {
    render(<SpecProse body="One [1] and two [2]." citations={[cite(1), cite(2)]} />);
    expect(screen.getByRole("button", { name: /\[1\]/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /\[2\]/ })).toBeTruthy();
  });

  test("markers inside list items and headings resolve too", () => {
    render(<SpecProse body={"## Why [1]\n\n- because [2]\n"} citations={[cite(1), cite(2)]} />);
    expect(screen.getByRole("button", { name: /\[1\]/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /\[2\]/ })).toBeTruthy();
  });

  test("says where the evidence came from, in words rather than in colour alone", () => {
    // A colour is not information to a screen reader, so the provenance carries
    // a sentence. `signal` is a row in this workspace's own record.
    render(<SpecProse body="A claim [1]." citations={[cite(1)]} />);
    expect(screen.getByText("From this workspace's own record.")).toBeTruthy();
  });

  test("a source kind this product cannot open is marked as borrowed, not as ours", () => {
    render(<SpecProse body="A claim [1]." citations={[cite(1, { source_kind: "benchmark" })]} />);
    expect(screen.getByText("A source of a kind this product cannot open for you.")).toBeTruthy();
  });
});

describe("a marker with nothing behind it never wears a chip's clothes", () => {
  test("an out-of-range marker stays plain text", () => {
    // Agent-written prose produces these: three sources cited, a [4] in the
    // body. A chip is a promise that pressing it shows you the evidence.
    render(<SpecProse body="An unsupported claim [4]." citations={[cite(1)]} />);
    expect(screen.queryByRole("button", { name: /\[4\]/ })).toBeNull();
    expect(screen.getByText("[4]")).toBeTruthy();
  });

  test("a spec carrying no citations at all renders every marker plainly", () => {
    render(<SpecProse body="A claim [1] and another [2]." citations={null} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByText("[1]")).toBeTruthy();
    expect(screen.getByText("[2]")).toBeTruthy();
  });
});

describe("the document still reads as a document", () => {
  test("prose with no markers is untouched", () => {
    render(<SpecProse body="Nothing is cited here at all." citations={[cite(1)]} />);
    expect(screen.getByText("Nothing is cited here at all.")).toBeTruthy();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  test("headings and lists still render as headings and lists", () => {
    render(<SpecProse body={"# Title\n\n## Goals\n\n- one\n- two\n"} citations={null} />);
    expect(screen.getByRole("heading", { level: 1, name: "Title" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Goals" })).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
