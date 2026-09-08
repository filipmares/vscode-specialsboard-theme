// Methods are terracotta, even when supplied by the platform.
export function format(item, count = 3) {
  const label = `${item.name}: ${count}\n`;
  return typeof item === "object" ? label : "missing";
}

const menu = { name: "Soup", available: true, price: 12.5 };
console.log(format(menu), Math.PI);
document.querySelector(".special").textContent = menu.name;
