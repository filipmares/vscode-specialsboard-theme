/** A small seasonal menu, with provider-backed TypeScript colors. */
export interface Special {
  readonly id: string;
  title: string;
  price: number;
  tags: readonly string[];
}

export const specials: Special[] = [
  { id: "soup", title: "Garden soup", price: 12.5, tags: ["vegan"] },
  { id: "salad", title: "Autumn salad", price: 10, tags: ["seasonal"] },
];

export function describe(item: Special, portions = 1): string {
  const total = item.price * portions;
  return `${item.title}: ${total.toFixed(2)}`;
}

const seasonal = specials.filter(item => item.tags.includes("seasonal"));
for (const item of seasonal) {
  console.log(describe(item, 2));
}
