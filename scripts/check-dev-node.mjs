// Dev-server preflight: supabase-js needs the native WebSocket that shipped
// in Node 22. On older Node every server function fails with
// "Native WebSocket not found" and the whole app renders empty states,
// which reads as "the database is not connected". Fail loudly instead.
const major = Number(process.versions.node.split(".")[0]);
if (major < 22) {
  console.error(
    `\n  bun run dev needs Node 22+ (you are on ${process.versions.node}).\n` +
      `  Node 20.20.2 is only for \`bun run build\`.\n` +
      `  Fix: open a fresh terminal (default Node) or run: nvm use default\n`,
  );
  process.exit(1);
}
