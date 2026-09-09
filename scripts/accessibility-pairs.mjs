// Selected from identity/modern fixtures before tuning Contrast. These are
// different semantic families, not an all-pairs or color-only comprehension claim.
export const adjacentPairs = [
  ['keyword', 'variable', 'let selected; declaration and binding'],
  ['keyword', 'type', 'interface Special; declaration and named type'],
  ['keyword', 'function', 'function label; declaration and callable'],
  ['type', 'variable', 'Special item; annotation and binding'],
  ['function', 'variable', 'label(item); call and argument'],
  ['function', 'number', 'label(2); call and literal'],
  ['property', 'string', 'name: "Soup"; key and quoted value'],
  ['property', 'number', 'price: 12.5; key and numeric value'],
  ['tag', 'attribute', '<section aria-label>; tag and attribute'],
  ['string', 'number', '["Soup", 2]; adjacent data literals'],
  ['string', 'regexp', 'quoted pattern versus regex literal'],
  ['regexp', 'escape', '/soup\\d/; regex body and escape']
];
export const differentiationFloor = 0.05;
