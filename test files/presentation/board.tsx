import { describe, Special, specials } from "./menu";

interface BoardProps {
  readonly entries: readonly Special[];
  heading?: string;
}

/** Named types, properties, tags and expressions keep distinct roles. */
export function Board({
  entries,
  heading = "Today's specials",
}: BoardProps): JSX.Element {
  return (
    <section aria-label={heading}>
      <h2>{heading}</h2>
      <ul>
        {entries.map(item => (
          <li key={item.id} title={describe(item)}>
            <strong>{item.title}</strong>
            {" - "}
            {item.price.toFixed(2)}
          </li>
        ))}
      </ul>
    </section>
  );
}

export const example = <Board entries={specials} />;
