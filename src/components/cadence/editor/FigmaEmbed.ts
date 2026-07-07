import { Node, mergeAttributes } from "@tiptap/core";

export function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    // Validate protocol to prevent javascript:, data:, etc.
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return url;
    }
    if (u.hostname.includes("figma.com") && !u.pathname.startsWith("/embed")) {
      return `https://www.figma.com/embed?embed_host=cadence&url=${encodeURIComponent(url)}`;
    }
    return url;
  } catch {
    return url;
  }
}

export const FigmaEmbed = Node.create({
  name: "figmaEmbed",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-figma-embed]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const src = toEmbedUrl((HTMLAttributes.src as string) ?? "");
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-figma-embed": "true",
        class: "my-4 rounded-xl border border-border/60 overflow-hidden bg-secondary/20",
      }),
      [
        "iframe",
        {
          src,
          sandbox: "allow-same-origin",
          allowfullscreen: "true",
          style: "width:100%;height:480px;border:0;display:block;",
        },
      ],
    ];
  },

  addCommands() {
    return {
      setFigmaEmbed:
        (attrs: { src: string }) =>
        ({ commands }: { commands: { insertContent: (c: unknown) => boolean } }) =>
          commands.insertContent({ type: this.name, attrs }),
    } as never;
  },
});
