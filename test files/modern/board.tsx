import { describe, Menu } from "./source";

// Local JSX declarations make this a dependency-free fixture with jsx: preserve.
declare global {
  namespace JSX {
    interface Element {}
    interface IntrinsicElements {
      section: { children?: unknown; "aria-label"?: string };
      h2: { children?: unknown };
      ul: { children?: unknown };
      li: { children?: unknown; key?: string; title?: string };
      strong: { children?: unknown };
    }
  }
}

interface BoardProps {
  readonly entries: readonly Menu.Entry[];
  heading?: string;
}

/** Hover Board or invoke signature help on describe inside the JSX expression. */
export function Board({ entries, heading = "Today's specials" }: BoardProps): JSX.Element {
  return (
    <section aria-label={heading}>
      <h2>{heading}</h2>
      <ul>
        {entries.map((entry) => (
          <li key={entry.id} title={describe(entry, 1)}>
            <strong>{entry.title}</strong>
            {" - "}
            {entry.price.toFixed(2)}
          </li>
        ))}
      </ul>
    </section>
  );
}
