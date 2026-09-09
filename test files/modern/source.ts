// Hover Menu.Entry and describe; use signature help at the describe call.
export namespace Menu {
  export enum Course {
    Starter = "starter",
    Main = "main",
  }

  export interface Entry {
    readonly id: string;
    title: string;
    price: number;
    course: Course;
    tags: readonly string[];
  }

  export type Lookup = Readonly<Record<string, Entry>>;
}

/** Format a menu entry. The optional quantity appears in signature help. */
export function describe(entry: Menu.Entry, quantity: number = 1): string {
  const total = entry.price * quantity;
  return `${entry.title}: ${total.toFixed(2)}\n`;
}

const soup: Menu.Entry = {
  id: "soup",
  title: "Garden soup",
  price: 12.5,
  course: Menu.Course.Starter,
  tags: ["seasonal", "vegan"],
};

const catalog: Menu.Lookup = { [soup.id]: soup };
let selected: Menu.Entry | undefined = catalog["soup"];
const nested = [{ entries: [soup], detail: { available: true } }];
const label = describe(nested[0].entries[0], 2);

if (selected?.tags.includes("vegan")) {
  selected = { ...selected, title: label.trim() };
}

// TextMate recognizes readonly as a keyword, not a semantic readonly modifier.
export const board = { selected, nested, label } as const;
