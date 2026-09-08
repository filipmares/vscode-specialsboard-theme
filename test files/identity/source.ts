// A declaration is copper; the declared type is honey.
export interface Special {
  name: string;
  price: number;
}

export class Menu {
  constructor(private items: Special[]) {}

  format(item: Special, index = 2): string {
    const available = true;
    const label = `${item.name}: ${Math.round(item.price)}\n`;
    return available && index > 0 ? label : "sold out";
  }
}

const menu: Special = { name: "Soup", price: 12.5 };
console.log(menu.name, new Menu([menu]).format(menu));
