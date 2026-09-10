// Playwright MCP browser_run_code_unsafe input, not a standalone Node program.
// Open the isolated serve-web page and apply presentation/settings.json first.
async (activePage) => {
  const page = activePage.context().pages().find(p => p.url().startsWith('http://127.0.0.1:8765/'));
  if (!page) throw new Error('Open the isolated capture server on 127.0.0.1:8765 first');
  await page.setViewportSize({ width: 1440, height: 1000 });
  const darkScenes = [
    ['flagship-workbench', '#302e2c', 'menu.ts'],
    ['flagship-tsx', '#302e2c', 'board.tsx'],
    ['flagship-web', '#302e2c', 'menu.css'],
    ['classic-python', '#2b2b2b', 'regex.js'],
    ['contrast-systems', '#181715', 'menu.go'],
    ['flagship-content', '#302e2c', 'menu.jsonc'],
    ['contrast-review', '#181715', 'Menu review'],
    ['legacy-code', '#383939', 'menu.ts'],
    ['contrast-merge', '#181715', 'menu.result.json']
  ];
  const lightScenes = [
    ['light-workbench', '#fafafa', 'menu.ts'],
    ['light-web', '#fafafa', 'menu.css'],
    ['light-python', '#fafafa', 'regex.js'],
    ['light-content', '#fafafa', 'menu.jsonc']
  ];
  // Default to additive light captures; opt in explicitly to replace historical dark images.
  const captureDark = false;
  const scenes = captureDark ? [...lightScenes, ...darkScenes] : lightScenes;
  const results = [];
  for (const [scene, background, title] of scenes) {
    await page.keyboard.press('F1');
    await page.getByRole('textbox', { name: 'Type the name of a command to run.' }).fill('>Specials Board Capture: Choose Scene');
    await page.getByRole('option', { name: /^Specials Board Capture: Choose Scene/ }).waitFor();
    await page.keyboard.press('Enter');
    await page.getByRole('option', { name: scene, exact: true }).waitFor();
    await page.getByRole('option', { name: scene, exact: true }).click();
    await page.waitForFunction(({ background, title }) =>
      getComputedStyle(document.querySelector('.monaco-workbench'))
        .getPropertyValue('--vscode-editor-background').trim() === background
      && document.body.innerText.includes(title),
    { background, title });
    await page.waitForTimeout(1800);
    if (scene === 'flagship-workbench' || scene === 'light-workbench') {
      const sash = page.locator('.monaco-sash.horizontal:not(.disabled)').last();
      const box = await sash.boundingBox();
      if (!box) throw new Error('Terminal panel resize sash is not visible');
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, 736, { steps: 12 });
      await page.mouse.up();
    }
    await page.mouse.move(720, 15);
    await page.waitForTimeout(900);
    const text = await page.locator('body').innerText();
    if (/Restricted Mode|Unable to write into user settings|Sign in to GitHub/.test(text)) {
      throw new Error(`Unclean capture state: ${scene}`);
    }
    await page.screenshot({ path: `screenshots\\${scene}.png`, type: 'png', scale: 'css' });
    results.push({ scene, background, viewport: page.viewportSize() });
  }
  return results;
}
