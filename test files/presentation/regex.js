// Regex is purple; a quoted pattern is a string.
const record = /^(?<name>[A-Z]\w+)\s+(?<price>\d+)$/u;
const escaped = /a\/b\\c\t\n/;
const quoted = "\\b[A-Z]\\w+";

export function parse(value) {
  const match = record.exec(value);
  return match?.groups ?? null;
}

export function isSeasonal(value) {
  return /soup|salad/i.test(value);
}

console.log(parse("Soup 25"), isSeasonal("Salad"));
