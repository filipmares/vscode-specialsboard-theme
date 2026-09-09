const canvas = 'editor.background';
const words = text => text.split(/\s+/).filter(Boolean);

// Color IDs here are rendering contexts, not semantic-role names. Order is
// bottom to top. Each listed stack is resolved from the generated theme.
export function syntaxStates(colors, strict = true) {
  const states = [];
  const add = (name, backgrounds, minimum = 4.5) => {
    const missing = backgrounds.filter(id => !Object.hasOwn(colors, id));
    if (strict && missing.length) throw new Error(`Missing syntax rendering context: ${missing.join(', ')}`);
    if (!missing.length) states.push({ name, backgrounds, minimum });
  };
  add('editor/base', [canvas], 7);
  add('editor/current-line', [canvas, 'editor.lineHighlightBackground'], 7);
  const contexts = [
    ['editor', []],
    ['diff/added', ['diffEditor.insertedLineBackground', 'diffEditor.insertedTextBackground']],
    ['diff/removed', ['diffEditor.removedLineBackground', 'diffEditor.removedTextBackground']],
    ['merge/changed', ['mergeEditor.change.background', 'mergeEditor.change.word.background']],
    ['merge/current', ['merge.currentContentBackground']],
    ['merge/incoming', ['merge.incomingContentBackground']],
    ['merge/common', ['merge.commonContentBackground']],
    ['merge/current-header', ['merge.currentHeaderBackground']],
    ['merge/incoming-header', ['merge.incomingHeaderBackground']],
    ['merge/common-header', ['merge.commonHeaderBackground']],
    ['review/range', ['editorCommentsWidget.rangeBackground']],
    ['review/active-range', ['editorCommentsWidget.rangeActiveBackground']],
    ['inline/original', ['inlineEdit.originalBackground', 'inlineEdit.originalChangedLineBackground', 'inlineEdit.originalChangedTextBackground']],
    ['inline/modified', ['inlineEdit.modifiedBackground', 'inlineEdit.modifiedChangedLineBackground', 'inlineEdit.modifiedChangedTextBackground']],
    ['inline-chat/removed', ['inlineChatDiff.removed']],
    ['inline-chat/inserted', ['inlineChatDiff.inserted']],
    ['debug/stack-frame', ['editor.stackFrameHighlightBackground']],
    ['debug/focused-frame', ['editor.focusedStackFrameHighlightBackground']],
    ['test/error-line', ['testing.message.error.lineBackground']],
    ['test/info-line', ['testing.message.info.lineBackground']]
  ];
  const interactions = [
    ['none', []],
    ['selection', ['editor.selectionBackground']],
    ['inactive-selection', ['editor.inactiveSelectionBackground']],
    ['find-current', ['editor.findMatchBackground']],
    ['find-other', ['editor.findMatchHighlightBackground']],
    ['selection+find', ['editor.selectionBackground', 'editor.findMatchBackground']],
    ['find+selection', ['editor.findMatchBackground', 'editor.selectionBackground']],
    ['inactive+find', ['editor.inactiveSelectionBackground', 'editor.findMatchBackground']],
    ['selection+word', ['editor.selectionBackground', 'editor.wordHighlightBackground']],
    ['find+word', ['editor.findMatchBackground', 'editor.wordHighlightStrongBackground']]
  ];
  for (const [context, layers] of contexts) {
    for (const [interaction, overlays] of interactions) {
      add(`${context}/${interaction}`, [canvas, ...layers, 'editor.lineHighlightBackground', ...overlays]);
    }
  }
  const single = words(`
    editor.selectionHighlightBackground editor.wordHighlightBackground
    editor.wordHighlightStrongBackground editor.wordHighlightTextBackground
    editor.findRangeHighlightBackground editor.rangeHighlightBackground
    editor.hoverHighlightBackground editorBracketMatch.background
    diffEditor.insertedLineBackground diffEditor.removedLineBackground
    diffEditor.insertedTextBackground diffEditor.removedTextBackground
    inlineEdit.originalChangedLineBackground inlineEdit.modifiedChangedLineBackground
    inlineEdit.originalChangedTextBackground inlineEdit.modifiedChangedTextBackground
  `);
  for (const id of single) add(id, [canvas, id]);
  for (const base of words(`
    editorHoverWidget.background editorSuggestWidget.background editorSuggestWidget.selectedBackground
    editorWidget.background inlineChat.background peekViewEditor.background
    editorStickyScroll.background editorStickyScrollHover.background
    notebook.cellEditorBackground notebook.outputContainerBackgroundColor
    notebook.selectedCellBackground notebook.focusedCellBackground
    textCodeBlock.background textBlockQuote.background
  `)) {
    add(base, [base]);
    add(`${base}/selected`, [base, 'editor.selectionBackground']);
  }
  add('notebook/hover', ['notebook.cellEditorBackground', 'notebook.cellHoverBackground']);
  add('notebook/hover+selection', ['notebook.cellEditorBackground', 'notebook.cellHoverBackground', 'editor.selectionBackground']);
  add('search-editor/match', [canvas, 'searchEditor.findMatchBackground']);
  add('peek/match', ['peekViewEditor.background', 'peekViewEditor.matchHighlightBackground']);
  return states;
}

// Explicit host component contexts. Multiple backgrounds intentionally form a
// conservative envelope for a foreground reused across normal/hover/focus states.
const families = [
  [/^(titleBar|activityBar|activityBarTop|statusBar|statusBarItem)\./,
    words('activityBar.background sideBar.background statusBar.background statusBarItem.hoverBackground statusBarItem.activeBackground statusBarItem.prominentBackground')],
  [/^(commandCenter)\./, words('commandCenter.background commandCenter.activeBackground')],
  [/^(sideBar|sideBarTitle|sideBarSectionHeader)\./, words('sideBar.background sideBarSectionHeader.background')],
  [/^tab\./, words('tab.activeBackground tab.inactiveBackground tab.hoverBackground tab.unfocusedActiveBackground')],
  [/^(panel|panelTitle|panelSection|panelSectionHeader|editorGroup|editorGroupHeader)\./,
    words('panel.background panelSectionHeader.background editorGroupHeader.tabsBackground')],
  [/^(list|tree|quickInput|quickInputList|pickerGroup)\./,
    words('sideBar.background quickInput.background list.hoverBackground list.activeSelectionBackground list.inactiveSelectionBackground list.inactiveFocusBackground')],
  [/^(breadcrumb|breadcrumbPicker)\./, words('breadcrumb.background breadcrumbPicker.background')],
  [/^(input|inputOption|dropdown|checkbox|radio|settings|searchEditor)\./,
    words('input.background inputOption.activeBackground inputOption.hoverBackground dropdown.listBackground settings.focusedRowBackground')],
  [/^(menu|toolbar)\./, words('menu.background menu.selectionBackground toolbar.hoverBackground toolbar.activeBackground')],
  [/^button\./, words('button.background button.hoverBackground')],
  [/^(editorSuggestWidget|editorSuggestWidgetStatus|symbolIcon)\./,
    words('editorSuggestWidget.background editorSuggestWidget.selectedBackground')],
  [/^editorHoverWidget\./, words('editorHoverWidget.background editorHoverWidget.statusBarBackground')],
  [/^editorWidget\./, words('editorWidget.background')],
  [/^(editorInlayHint|editorGhostText)\./, words('editor.background editor.lineHighlightBackground')],
  [/^(gitDecoration|commentsView)\./,
    words('sideBar.background list.hoverBackground list.activeSelectionBackground list.inactiveSelectionBackground')],
  [/^(testing|debugIcon|debugTokenExpression|debugConsole|debugConsoleInputIcon|debugToolBar)\./,
    words('panel.background sideBar.background debugToolBar.background list.activeSelectionBackground')],
  [/^(notebook|notebookStatusErrorIcon|notebookStatusRunningIcon|notebookStatusSuccessIcon)\./,
    words('notebook.editorBackground notebook.cellEditorBackground notebook.selectedCellBackground notebook.focusedCellBackground')],
  [/^(notifications|notificationCenter|notificationCenterHeader|notificationToast|notificationsErrorIcon|notificationsInfoIcon|notificationsWarningIcon)\./,
    words('notifications.background notificationCenterHeader.background')],
  [/^peekViewResult\./, words('peekViewResult.background peekViewResult.selectionBackground')],
  [/^(peekViewTitle|peekViewTitleLabel|peekViewTitleDescription)\./, words('peekViewTitle.background')],
  [/^peekView/, words('peekViewEditor.background')],
  [/^(inlineChat|inlineChatInput|chat)\./, words('inlineChat.background inlineChatInput.background chat.requestBackground')],
  [/^inlineEdit\./, words('editor.background')],
  [/^(terminal|terminalCursor|terminalCommandDecoration)\./, words('terminal.background')],
  [/^(minimap|minimapGutter|minimapSlider|editorOverviewRuler)\./, words('minimap.background editorOverviewRuler.background')],
  [/^scrollbarSlider\./, words('editor.background sideBar.background editorSuggestWidget.background')],
  [/^(editor|editorLineNumber|editorCodeLens|editorCursor|editorError|editorWarning|editorInfo|editorHint|editorGutter|editorIndentGuide|editorBracket|editorLightBulb|editorUnnecessaryCode|editorWhitespace|editorRuler|editorLink|editorCommentsWidget|diffEditor|diffEditorGutter|diffEditorOverview|merge|mergeEditor|problemsErrorIcon|problemsWarningIcon|problemsInfoIcon|search|progressBar|sash|text|widget|editorStickyScroll)/,
    words('editor.background')],
  [/^(foreground|descriptionForeground|disabledForeground|errorForeground|focusBorder|contrastBorder|contrastActiveBorder|icon\.foreground)$/,
    words('editor.background sideBar.background editorWidget.background list.activeSelectionBackground')]
];

const exempt = {
  disabledForeground: 'Disabled controls are excluded; enabled placeholders and secondary labels are tested.',
  'testing.iconSkipped': 'Skipped is a labeled non-running state, not an enabled control.',
  'debugIcon.breakpointDisabledForeground': 'Disabled breakpoint; native state icon is retained.',
  'widget.shadow': 'Decorative shadow, not the identifying boundary.',
  'scrollbar.shadow': 'Decorative shadow, not the scrollbar thumb.',
  'editorStickyScroll.shadow': 'Decorative shadow; explicit border is tested.',
  'inlineChat.shadow': 'Decorative shadow; explicit border is tested.',
  'editorUnnecessaryCode.opacity': 'Alpha is text opacity, not a background; tested separately.',
  'editorWhitespace.foreground': 'Optional whitespace decoration; not syntax text.',
  'editorRuler.foreground': 'Optional column ruler, not a control boundary.',
  'tree.inactiveIndentGuidesStroke': 'Optional inactive tree guide.',
  'editorIndentGuide.background1': 'Optional inactive indentation guide.',
  'diffEditor.diagonalFill': 'Decorative absent-region hatch; diff labels/gutters supply meaning.',
  'tab.activeBorder': 'Canvas-colored seam; tab.activeBorderTop is the identifying active-state indicator.',
  'editorCursor.background': 'Cursor cell background, paired with the cursor foreground separately.',
  'terminalCursor.background': 'Cursor cell background, paired with the cursor foreground separately.'
};

function overrides(id) {
  const exact = {
    'button.secondaryForeground': words('button.secondaryBackground button.secondaryHoverBackground'),
    'button.separator': words('button.background'),
    'button.border': words('editor.background sideBar.background editorWidget.background'),
    'badge.foreground': words('badge.background'),
    'activityBarBadge.foreground': words('activityBarBadge.background'),
    'editorSuggestWidgetStatus.foreground': words('editorSuggestWidget.background'),
    'editor.inlineValuesForeground': words('editor.inlineValuesBackground'),
    'editorInlayHint.foreground': words('editorInlayHint.background'),
    'editorInlayHint.typeForeground': words('editorInlayHint.typeBackground'),
    'editorInlayHint.parameterForeground': words('editorInlayHint.parameterBackground'),
    'chat.slashCommandForeground': words('chat.slashCommandBackground'),
    'chat.avatarForeground': words('chat.avatarBackground'),
    'testing.message.error.badgeForeground': words('testing.message.error.badgeBackground'),
    'testing.message.error.badgeBorder': words('testing.message.error.badgeBackground editor.background'),
    'statusBarItem.remoteForeground': words('statusBarItem.remoteBackground')
  };
  if (exact[id]) return exact[id];
  const validation = id.match(/^inputValidation\.(error|warning|info)(Foreground|Border)$/);
  if (validation) return [`inputValidation.${validation[1]}Background`, ...(validation[2] === 'Border' ? ['input.background'] : [])];
  const status = id.match(/^statusBarItem\.(error|warning)Foreground$/);
  if (status) return [`statusBarItem.${status[1]}Background`];
  const gutter = id.match(/^inlineEdit\.gutterIndicator\.(primary|secondary|successful)(Foreground|Border)$/);
  if (gutter) return gutter[2] === 'Foreground' ? [`inlineEdit.gutterIndicator.${gutter[1]}Background`] : ['editor.background'];
  if (/^editorGhostText\./.test(id)) return ['editor.background'];
  return undefined;
}

export function workbenchCases(colors) {
  const records = [];
  const excluded = [];
  const text = id => /foreground$/i.test(id) || /^debugTokenExpression\./.test(id)
    || /^terminal\.ansi/.test(id);
  const graphical = id => /border|outline|stroke|indicator|highlight|separator|runAction|icon|cursor|decoration|gutter|Overview|BracketPairGuide\.active|progressBar|scrollbarSlider|minimapSlider/i.test(id);
  for (const id of Object.keys(colors).sort()) {
    const reason = exempt[id] ?? (/^editorBracketPairGuide\.background/.test(id) ? 'Optional inactive bracket guide.' : undefined);
    if (reason) { excluded.push({ id, reason }); continue; }
    // Fills are exercised with their actual foregrounds and syntax stacks; a
    // translucent selection fill is not claimed to have 3:1 against the canvas.
    const isFill = /^(inlineChatDiff\.(inserted|removed))$/.test(id)
      || /background(Color)?$/i.test(id) && !/^(editorGutter\.(added|deleted|modified)Background|terminalCommandDecoration\.|scrollbarSlider\.|minimapSlider\.|progressBar\.)/i.test(id);
    if (isFill || /Background[1-6]$/.test(id) || id === 'menu.separatorBackground') {
      excluded.push({ id, reason: 'Background layer; assessed with foregrounds, boundaries or syntax, not as a standalone indicator.' });
      continue;
    }
    let backgrounds = overrides(id) ?? families.find(([pattern]) => pattern.test(id))?.[1];
    if (!backgrounds) throw new Error(`No reviewed rendering context for ${id}`);
    const indicator = graphical(id) && !/gitDecoration|debugConsole|debugTokenExpression|editorCodeLens|editorLineNumber|editorInlayHint|editorGhostText\.foreground|editorSuggestWidget.*highlight|editorHoverWidget.highlight|list.*[hH]ighlight|testing\.message\.info\.decorationForeground|textLink|chat\.editedFile/i.test(id);
    if (!text(id) && !indicator && !graphical(id)) throw new Error(`Unclassified theme color: ${id}`);
    if (backgrounds.includes('editor.lineHighlightBackground')) backgrounds = backgrounds.filter(bg => bg !== 'editor.lineHighlightBackground');
    for (const background of backgrounds) {
      if (!Object.hasOwn(colors, background)) continue;
      const primary = /^(foreground|editor\.foreground|sideBar\.foreground|input\.foreground|menu\.(foreground|selectionForeground)|list\.(activeSelectionForeground|inactiveSelectionForeground|focusForeground|hoverForeground)|editorSuggestWidget\.(foreground|selectedForeground)|editorHoverWidget\.foreground|terminal\.foreground|notifications\.foreground|button\.(foreground|secondaryForeground))$/.test(id);
      records.push({
        name: `ui/${id}@${background}`, foreground: id, backgrounds: [background],
        minimum: indicator ? 3 : primary ? 7 : 4.5,
        kind: indicator ? 'indicator' : 'text'
      });
    }
  }
  return { records, excluded };
}
