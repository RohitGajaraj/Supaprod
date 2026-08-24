/**
 * The 3D graph's per-frame buffers must be shared with the GPU, not copied.
 *
 * WHY THIS TEST EXISTS. On 2026-08-03 the Brain's Universe view drew every node
 * and not one edge, while the Flat view drew the same graph correctly and the
 * node hover card read "3 links, from 3". The data, the projection and the
 * layout were all fine. The cause was one constructor:
 *
 *   three/src/core/BufferAttribute.js
 *     class Float32BufferAttribute extends BufferAttribute {
 *       constructor(array, itemSize, normalized) {
 *         super(new Float32Array(array), itemSize, normalized);   // COPIES
 *
 * The canvas kept `edgePosRef.current`, wrote every endpoint into it each frame,
 * then set `needsUpdate` on the attribute wrapping the COPY. The GPU's buffer
 * stayed all zeros, so every line segment was a degenerate point at the origin.
 * Invisible, with no error, on the default view of the company brain.
 *
 * The trap is that the two class names differ by one word and the wrong one is
 * the more obvious choice, so a reader cannot see the bug. That is exactly what
 * a test is for.
 */
import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as THREE from "three";

const SOURCE = readFileSync(join(import.meta.dir, "GraphUniverseCanvas.tsx"), "utf8");

describe("three.js buffer aliasing, the trap itself", () => {
  test("Float32BufferAttribute copies its input array", () => {
    // Pinned against the library so an upgrade that changes this behaviour is
    // reported here rather than by a graph quietly rendering again or not.
    const arr = new Float32Array([1, 2, 3]);
    const attr = new THREE.Float32BufferAttribute(arr, 3);
    expect(attr.array).not.toBe(arr);
  });

  test("BufferAttribute takes the array by reference", () => {
    const arr = new Float32Array([1, 2, 3]);
    const attr = new THREE.BufferAttribute(arr, 3);
    expect(attr.array).toBe(arr);

    // The property the frame loop depends on: writing through the ref is visible
    // to the attribute the renderer uploads.
    arr[0] = 42;
    expect((attr.array as Float32Array)[0]).toBe(42);
  });
});

describe("the Universe canvas edge buffers", () => {
  test("binds the per-frame edge arrays by reference", () => {
    // Both must be plain BufferAttribute. If either is switched back to the
    // Float32 subclass, the edges silently stop rendering again.
    expect(SOURCE).toContain("new THREE.BufferAttribute(edgePosRef.current, 3)");
    expect(SOURCE).toContain("new THREE.BufferAttribute(edgeColorRef.current, 3)");
    expect(SOURCE).not.toContain("Float32BufferAttribute(edgePosRef.current");
    expect(SOURCE).not.toContain("Float32BufferAttribute(edgeColorRef.current");
  });

  test("marks them as rewritten every frame", () => {
    // Not correctness, but the driver hint that matches how they are used.
    expect(SOURCE).toContain("setUsage(THREE.DynamicDrawUsage)");
  });

  test("does not use additive blending for the edges", () => {
    // Additive only reads on a dark ground; on the light theme it pushes every
    // thread toward white and the graph loses its links entirely.
    const edgeMat = SOURCE.slice(SOURCE.indexOf("const edgeMat"), SOURCE.indexOf("const lines"));
    expect(edgeMat).toContain("NormalBlending");
    expect(edgeMat).not.toContain("AdditiveBlending");
  });

  test("fades a dim thread toward the ground colour, not toward black", () => {
    // multiplyScalar darkens, which reads as "dimmer" only when the ground is
    // dark. On the light theme it made a dim thread darker, so LOUDER, than a
    // lit one. Lerping to the ground is identical on dark and correct on light.
    expect(SOURCE).toContain("lerp(chrome.ground");
    // The ground token was rekeyed to Meridian on 2026-08-25; the property the
    // test guards is that the fade target is the recess the wrapper paints.
    expect(SOURCE).toContain('read("--mrd-sink"');
  });
});
