local expected_path, report_path, parser_runtime = unpack(arg)
assert(expected_path and report_path and parser_runtime,
  "Usage: nvim --clean --headless -l scripts/neovim-smoke.lua expected.json report.json parser-runtime")

local function read(path)
  local file = assert(io.open(path, "rb"))
  local bytes = file:read("*a")
  file:close()
  return bytes
end

local report = {
  success = false, assertions = 0, themes = {}, switches = {}, captures = {}, syntax = {},
  limitations = {
    "LSP highlight groups asserted only; no language server or semantic-token provider executed",
    "No Windows Terminal native runtime or visual validation",
  },
}

local function check(condition, message)
  report.assertions = report.assertions + 1
  if not condition then error(message, 2) end
end

local function equal(actual, expected, label)
  check(vim.deep_equal(actual, expected),
    label .. ": expected " .. vim.inspect(expected) .. ", got " .. vim.inspect(actual))
end

local function rgb(color)
  return tonumber(color:sub(2), 16)
end

local function native_style(style)
  local result = {}
  local cterm = {}
  for key, value in pairs(style) do
    if key == "fg" or key == "bg" or key == "sp" then
      result[key] = rgb(value)
    elseif value ~= false then
      result[key] = value
      if type(value) == "boolean" then cterm[key] = value end
    end
  end
  if next(cterm) then result.cterm = cterm end
  return result
end

local function resolved(theme, group)
  local style = assert(theme.highlights[group], "No expected highlight " .. group)
  if style.link then return resolved(theme, style.link) end
  return native_style(style)
end

local function highlight(group, links)
  return vim.api.nvim_get_hl(0, { name = group, link = links, create = false })
end

local function verify_theme(theme)
  equal(vim.g.colors_name, theme.id, "colors_name")
  equal(vim.o.background, "dark", "background")
  for group, style in pairs(theme.highlights) do
    equal(highlight(group, true), native_style(style), theme.id .. "/" .. group)
    equal(highlight(group, false), resolved(theme, group), theme.id .. "/" .. group .. " resolved")
  end
  for index, color in ipairs(theme.terminal) do
    equal(vim.g["terminal_color_" .. (index - 1)], color, theme.id .. "/ANSI " .. (index - 1))
  end
  for group, intent in pairs({
    ["@variable"] = "variable", ["@variable.member"] = "property", ["@property"] = "property",
    ["@string.regexp"] = "regexp", ["@string.documentation"] = "comment",
    jsonNull = "constant", javaScriptNull = "constant",
  }) do
    equal(highlight(group, false).fg, rgb(theme.intents[intent]), group .. " semantic intent")
  end
  check(highlight("@string.documentation", false).italic == true, "Doc strings must remain italic comments")
  check(theme.intents.property ~= theme.intents.variable, "Member/property and variable roles must differ")
end

local function runtime_vocabulary(theme)
  local doc = read(vim.env.VIMRUNTIME .. "\\doc\\treesitter.txt")
  local vocabulary = {}
  for line in doc:gmatch("[^\r\n]+") do
    local capture = line:match("^(@[%w_.]+)%s+")
    if capture then vocabulary[capture] = true end
  end
  local capture_count, fallback_count = 0, 0
  local files = {
    json = "json", yaml = "yaml", toml = "toml", markdown = "markdown",
    diff = "diff", javaScript = "javascript",
  }
  local defined = {}
  for prefix, file in pairs(files) do
    defined[prefix] = {}
    local content = read(vim.env.VIMRUNTIME .. "\\syntax\\" .. file .. ".vim")
    for line in content:gmatch("[^\r\n]+") do
      if not line:match('^%s*"') then
        local group = line:match("syn%w*%s+%w+%s+([%w_]+)")
          or line:match("hi%w*%s+def%w*%s+link%s+([%w_]+)")
        if group then defined[prefix][group] = true end
      end
    end
  end
  for group in pairs(theme.highlights) do
    if group:sub(1, 1) == "@" and not group:match("^@lsp%.") then
      check(vocabulary[group], "Unknown non-LSP capture in installed treesitter.txt: " .. group)
      capture_count = capture_count + 1
    else
      for prefix in pairs(files) do
        if group:sub(1, #prefix) == prefix then
          check(defined[prefix][group], "No bundled syntax declaration for " .. group)
          fallback_count = fallback_count + 1
        end
      end
    end
  end
  report.vocabulary = { captures = capture_count, fallbackGroups = fallback_count,
    source = vim.env.VIMRUNTIME .. "\\doc\\treesitter.txt", sha256 = vim.fn.sha256(doc) }
end

local function buffer(lines)
  local buf = vim.api.nvim_create_buf(false, true)
  vim.api.nvim_set_current_buf(buf)
  vim.bo[buf].swapfile = false
  vim.api.nvim_buf_set_lines(buf, 0, -1, false, lines)
  return buf
end

local function point(lines, probe)
  local start = assert(lines[probe[1]]:find(probe[2], 1, true), "Missing fixture text: " .. probe[2])
  return probe[1] - 1, start - 1 + (probe.offset or 0)
end

local tree_fixtures = {
  {
    lang = "lua",
    lines = { "-- plain comment", "local obj = { member = 12 }", "local value = obj.member",
      'local pattern = string.match("abc", "%a+")', 'local text = "hello\\n"',
      "local function greet(param) return param end", "local nothing = nil",
      "--- documented function" },
    probes = {
      { 1, "plain", "comment" }, { 2, "obj", "variable" }, { 2, "member", "property" },
      { 2, "12", "number" }, { 3, "member", "variable.member" },
      { 4, "%a+", "string.regexp" }, { 5, "\\n", "string.escape" },
      { 6, "greet", "function" }, { 6, "param", "variable.parameter" },
      { 7, "nil", "constant.builtin" }, { 8, "documented", "comment.documentation" },
    },
  },
  {
    lang = "c",
    lines = { "#include <stdio.h>", "struct Sample { int member; };",
      "int greet(int param) {", "  struct Sample obj = { .member = 12 };",
      '  const char *text = "hello\\n";', "  // plain comment", "  return obj.member + param;", "}" },
    probes = {
      { 1, "#include", "keyword.import" }, { 2, "Sample", "type" },
      { 2, "member", "property" }, { 3, "greet", "function" },
      { 3, "param", "variable.parameter" }, { 4, "12", "number" },
      { 5, "\\n", "string.escape" }, { 6, "plain", "comment" },
      { 7, "member", "property" }, { 7, "return", "keyword.return" },
    },
  },
  {
    lang = "markdown",
    lines = { "# Heading", "", "> Quoted", "", "- [x] done", "", "**strong** and *emphasis*",
      "", "[label](https://example.invalid)", "", "```", "code", "```" },
    probes = {
      { 1, "Heading", "markup.heading.1" }, { 3, "Quoted", "markup.quote" },
      { 5, "[x]", "markup.list.checked" }, { 7, "strong", "markup.strong", lang = "markdown_inline" },
      { 7, "emphasis", "markup.italic", lang = "markdown_inline" },
      { 9, "label", "markup.link.label", lang = "markdown_inline" },
      { 9, "https", "markup.link.url", lang = "markdown_inline" }, { 12, "code", "markup.raw.block" },
    },
  },
  {
    lang = "vim",
    lines = { 'let pattern = "hello"', "s/ab\\+c/replacement/g" },
    probes = { { 2, "\\+", "string.regexp" }, { 2, "ab", "string.special" } },
  },
}

local function tree_sitter(theme)
  for _, fixture in ipairs(tree_fixtures) do
    local buf = buffer(fixture.lines)
    vim.treesitter.start(buf, fixture.lang)
    local parser = vim.treesitter.get_parser(buf, fixture.lang)
    parser:parse(true)
    vim.cmd("redraw")
    for _, probe in ipairs(fixture.probes) do
      local row, col = point(fixture.lines, probe)
      local captures = vim.treesitter.get_captures_at_pos(buf, row, col)
      local found = false
      for _, capture in ipairs(captures) do
        if capture.capture == probe[3] and capture.lang == (probe.lang or fixture.lang) then found = true end
      end
      local label = fixture.lang .. ":" .. probe[1] .. "/" .. probe[2]
      check(found, label .. " missing actual bundled capture @" .. probe[3] .. ": " .. vim.inspect(captures))
      local group = "@" .. probe[3]
      equal(highlight(group .. "." .. (probe.lang or fixture.lang), false),
        resolved(theme, group), label .. " language-qualified highlight")
      report.captures[#report.captures + 1] = {
        theme = theme.id, language = probe.lang or fixture.lang, line = probe[1],
        text = probe[2], capture = group, style = highlight(group, false),
      }
    end
    vim.treesitter.stop(buf)
    vim.api.nvim_buf_delete(buf, { force = true })
  end
end

local syntax_fixtures = {
  {
    ft = "json", lines = { '{"key": "value\\n", "empty": null, "count": 12, "enabled": true}' },
    probes = { { 1, "key", "jsonKeyword" }, { 1, "\\n", "jsonEscape" },
      { 1, "null", "jsonNull" }, { 1, "12", "jsonNumber", expected = "Number" } },
  },
  {
    ft = "yaml", lines = { 'key: "value\\n"', "flow: { member: 12 }", "quoted: 'it''s'" },
    probes = { { 1, "key", "yamlBlockMappingKey" }, { 1, "\\n", "yamlEscape" },
      { 2, "member", "yamlFlowMappingKey" }, { 3, "''", "yamlSingleEscape" } },
  },
  {
    ft = "toml", lines = { 'key = "value\\n"', '"quoted" = 12', "'literal' = true" },
    probes = { { 1, "key", "tomlKey" }, { 1, "\\n", "tomlEscape" },
      { 2, "quoted", "tomlKeyDq" }, { 3, "literal", "tomlKeySq" } },
  },
  {
    ft = "markdown",
    lines = { "# Heading", "", "**strong** and *emphasis* and `code`", "",
      "[label](https://example.invalid)", "", "- item", "", "> quote" },
    probes = { { 1, "Heading", "markdownH1" }, { 3, "strong", "markdownBold" },
      { 3, "emphasis", "markdownItalic" }, { 3, "code", "markdownCode" },
      { 5, "label", "markdownLinkText" }, { 5, "https", "markdownUrl" },
      { 7, "-", "markdownListMarker" }, { 9, ">", "markdownBlockquote" } },
  },
  {
    ft = "diff", lines = { "--- old.txt", "+++ new.txt", "@@ -1 +1 @@", "-removed", "+added" },
    probes = { { 3, "@@", "diffLine" }, { 4, "removed", "diffRemoved" }, { 5, "added", "diffAdded" } },
  },
  {
    ft = "javascript", lines = { "const pattern = /ab+c/g;", 'const text = "hello\\n";', "const nothing = null;" },
    probes = { { 1, "ab", "javaScriptRegexpString" }, { 2, "\\n", "javaScriptSpecial" },
      { 3, "null", "javaScriptNull" } },
  },
}

local function vim_syntax(theme)
  for _, fixture in ipairs(syntax_fixtures) do
    local buf = buffer(fixture.lines)
    vim.bo[buf].filetype = fixture.ft
    -- 0.12 enables bundled Markdown Tree-sitter on FileType; this pass
    -- deliberately tests the independent legacy-syntax fallback.
    vim.treesitter.stop(buf)
    vim.cmd("syntax enable")
    vim.bo[buf].syntax = fixture.ft
    vim.cmd("syntax sync fromstart")
    check(vim.treesitter.highlighter.active[buf] == nil, fixture.ft .. " fallback must not use Tree-sitter")
    for _, probe in ipairs(fixture.probes) do
      local row, col = point(fixture.lines, probe)
      local id = vim.fn.synID(row + 1, col + 1, 1)
      local name = vim.fn.synIDattr(id, "name")
      local target = vim.fn.synIDattr(vim.fn.synIDtrans(id), "name")
      local label = fixture.ft .. ":" .. probe[1] .. "/" .. probe[2]
      equal(name, probe[3], label .. " syntax group")
      equal(highlight(target, false), resolved(theme, probe.expected or probe[3]), label .. " synIDtrans style")
      report.syntax[#report.syntax + 1] = {
        theme = theme.id, filetype = fixture.ft, text = probe[2], group = name,
        translated = target, style = highlight(target, false),
      }
    end
    vim.api.nvim_buf_delete(buf, { force = true })
  end
end

local function main()
  local bytes = read(expected_path)
  local data = vim.json.decode(bytes)
  report.runId = data.runId
  report.expectedSha256 = vim.fn.sha256(bytes)
  report.startedAt = os.date("!%Y-%m-%dT%H:%M:%SZ")
  local version = vim.version()
  report.version = ("%d.%d.%d"):format(version.major, version.minor, version.patch)
  equal(report.version, data.version, "Pinned native version")
  check(not version.prerelease, "A stable native version is required")
  equal(data.schemaVersion, 1, "Expected schema")
  equal(#data.themes, 3, "Portable theme count")
  check(not vim.o.modeline and not vim.o.swapfile and not vim.o.undofile
    and not vim.o.backup and not vim.o.writebackup, "Unsafe persistence options")
  equal(vim.o.shadafile, "NONE", "No user ShaDa")
  check(not vim.o.exrc, "No directory-local configuration")
  for _, variable in ipairs({ "VIMINIT", "EXINIT", "NVIM", "LUA_PATH", "LUA_CPATH" }) do
    check(vim.env[variable] == nil, "Inherited environment variable: " .. variable)
  end
  vim.opt.runtimepath = { data.themeRuntime, vim.env.VIMRUNTIME, parser_runtime }
  vim.opt.packpath = {}
  report.runtimepath = vim.opt.runtimepath:get()
  report.isolation = {
    config = vim.fn.stdpath("config"), data = vim.fn.stdpath("data"),
    state = vim.fn.stdpath("state"), cache = vim.fn.stdpath("cache"),
    shadafile = vim.o.shadafile, packpath = vim.o.packpath,
  }
  runtime_vocabulary(data.themes[1])
  for _, theme in ipairs(data.themes) do
    equal(vim.fn.sha256(read(theme.path)), theme.sha256, theme.id .. " generated bytes")
    local chunk, err = loadfile(theme.path)
    check(chunk ~= nil, theme.id .. " loadfile: " .. tostring(err))
    local discovered = vim.api.nvim_get_runtime_file("colors/" .. theme.id .. ".lua", true)
    equal(#discovered, 1, theme.id .. " runtime discovery")
    equal(vim.fs.normalize(discovered[1]), vim.fs.normalize(theme.path), theme.id .. " discovered path")
    report.themes[#report.themes + 1] = { id = theme.id, sha256 = theme.sha256 }
    vim.cmd.colorscheme(theme.id)
    verify_theme(theme)
    tree_sitter(theme)
    vim_syntax(theme)
    verify_theme(theme)
  end
  -- All six orders, including both directions across every variant. Poisoning
  -- previously present styles makes replacement/clear regressions observable.
  for _, order in ipairs({ { 1, 2, 3 }, { 1, 3, 2 }, { 2, 1, 3 },
      { 2, 3, 1 }, { 3, 1, 2 }, { 3, 2, 1 } }) do
    for _, index in ipairs(order) do
      local theme = data.themes[index]
      for group in pairs(theme.highlights) do
        vim.api.nvim_set_hl(0, group, {
          fg = 0x010203, bg = 0x040506, sp = 0x070809,
          bold = true, italic = true, underline = true, strikethrough = true,
        })
      end
      for i = 0, 15 do vim.g["terminal_color_" .. i] = "#010203" end
      vim.cmd.colorscheme(theme.id)
      verify_theme(theme)
      report.switches[#report.switches + 1] = theme.id
    end
  end
  for _, theme in ipairs(data.themes) do
    equal(vim.fn.sha256(read(theme.path)), theme.sha256, theme.id .. " unchanged during smoke")
  end
  report.success = true
end

local ok, err = xpcall(main, debug.traceback)
if not ok then report.error = err end
report.finishedAt = os.date("!%Y-%m-%dT%H:%M:%SZ")
local file = assert(io.open(report_path, "wb"))
file:write(vim.json.encode(report), "\n")
file:close()
if not ok then
  io.stderr:write(err, "\n")
  vim.cmd("cquit 1")
end
print(("PASS Neovim %s: %d assertions"):format(report.version, report.assertions))
vim.cmd("qa!")
