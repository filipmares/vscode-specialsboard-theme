// A regex is purple; a quoted pattern is still a string.
const record = /^(?<name>[A-Z]\w+)\s+(?<price>\d{2,4})(?:\.\d+)?$/giu;
const escaped = /a\/b\\c\t\n/;
const quoted = "\\b[A-Z]\\w+";
const message = `Soup\n${quoted}`;
export function matches(value) {
  return record.test(value) && /soup|bread/i.test(value);
}
