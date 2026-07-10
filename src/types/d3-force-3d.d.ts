// Ambient types for d3-force-3d (MIT). The upstream package ships no types and
// no @types/d3-force-3d exists on npm, so this mirrors the d3-force API with the
// third (z) dimension added. It covers only the force builders the knowledge
// universe renderer uses: forceSimulation(nodes, numDimensions), forceLink,
// forceManyBody, forceCenter, forceCollide. The runtime API is identical to
// d3-force; the only additions are z / vz / fz on nodes and a numDimensions arg.
declare module "d3-force-3d" {
  export interface SimulationNodeDatum {
    index?: number;
    x?: number;
    y?: number;
    z?: number;
    vx?: number;
    vy?: number;
    vz?: number;
    fx?: number | null;
    fy?: number | null;
    fz?: number | null;
  }

  export interface SimulationLinkDatum<NodeDatum extends SimulationNodeDatum> {
    source: NodeDatum | string | number;
    target: NodeDatum | string | number;
    index?: number;
  }

  export interface Force<NodeDatum extends SimulationNodeDatum, LinkDatum> {
    (alpha: number): void;
    initialize?(nodes: NodeDatum[], random?: () => number): void;
  }

  export interface ForceLink<
    NodeDatum extends SimulationNodeDatum,
    LinkDatum extends SimulationLinkDatum<NodeDatum>,
  > extends Force<NodeDatum, LinkDatum> {
    links(): LinkDatum[];
    links(links: LinkDatum[]): this;
    id(id: (node: NodeDatum, i: number, nodes: NodeDatum[]) => string | number): this;
    distance(): (link: LinkDatum, i: number, links: LinkDatum[]) => number;
    distance(distance: number | ((link: LinkDatum, i: number, links: LinkDatum[]) => number)): this;
    strength(): (link: LinkDatum, i: number, links: LinkDatum[]) => number;
    strength(strength: number | ((link: LinkDatum, i: number, links: LinkDatum[]) => number)): this;
    iterations(iterations: number): this;
  }

  export interface ForceManyBody<NodeDatum extends SimulationNodeDatum> extends Force<
    NodeDatum,
    undefined
  > {
    strength(strength: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)): this;
    theta(theta: number): this;
    distanceMin(distance: number): this;
    distanceMax(distance: number): this;
  }

  export interface ForceCenter<NodeDatum extends SimulationNodeDatum> extends Force<
    NodeDatum,
    undefined
  > {
    x(x: number): this;
    y(y: number): this;
    z(z: number): this;
    strength(strength: number): this;
  }

  export interface ForceCollide<NodeDatum extends SimulationNodeDatum> extends Force<
    NodeDatum,
    undefined
  > {
    radius(radius: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)): this;
    strength(strength: number): this;
    iterations(iterations: number): this;
  }

  export interface Simulation<
    NodeDatum extends SimulationNodeDatum,
    LinkDatum extends SimulationLinkDatum<NodeDatum> | undefined,
  > {
    tick(iterations?: number): this;
    restart(): this;
    stop(): this;
    nodes(): NodeDatum[];
    nodes(nodes: NodeDatum[]): this;
    alpha(): number;
    alpha(alpha: number): this;
    alphaMin(): number;
    alphaMin(min: number): this;
    alphaDecay(): number;
    alphaDecay(decay: number): this;
    alphaTarget(): number;
    alphaTarget(target: number): this;
    velocityDecay(): number;
    velocityDecay(decay: number): this;
    force(name: string): Force<NodeDatum, LinkDatum> | undefined;
    force(name: string, force: Force<NodeDatum, LinkDatum> | null): this;
    find(x: number, y: number, z: number, radius?: number): NodeDatum | undefined;
    on(
      typenames: string,
      listener: ((this: Simulation<NodeDatum, LinkDatum>) => void) | null,
    ): this;
    on(typenames: string): ((this: Simulation<NodeDatum, LinkDatum>) => void) | undefined;
  }

  export function forceSimulation<NodeDatum extends SimulationNodeDatum>(
    nodes?: NodeDatum[],
    numDimensions?: number,
  ): Simulation<NodeDatum, undefined>;

  export function forceLink<
    NodeDatum extends SimulationNodeDatum,
    LinkDatum extends SimulationLinkDatum<NodeDatum>,
  >(links?: LinkDatum[]): ForceLink<NodeDatum, LinkDatum>;

  export function forceManyBody<NodeDatum extends SimulationNodeDatum>(): ForceManyBody<NodeDatum>;

  export function forceCenter<NodeDatum extends SimulationNodeDatum>(
    x?: number,
    y?: number,
    z?: number,
  ): ForceCenter<NodeDatum>;

  export function forceCollide<NodeDatum extends SimulationNodeDatum>(
    radius?: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number),
  ): ForceCollide<NodeDatum>;

  export function forceX<NodeDatum extends SimulationNodeDatum>(
    x?: number,
  ): Force<NodeDatum, undefined>;
  export function forceY<NodeDatum extends SimulationNodeDatum>(
    y?: number,
  ): Force<NodeDatum, undefined>;
  export function forceZ<NodeDatum extends SimulationNodeDatum>(
    z?: number,
  ): Force<NodeDatum, undefined>;
}
