declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    section: { children?: unknown; "aria-label"?: string };
    h2: { children?: unknown };
    ul: { children?: unknown };
    li: { children?: unknown; key?: string; title?: string };
    strong: { children?: unknown };
  }
}
