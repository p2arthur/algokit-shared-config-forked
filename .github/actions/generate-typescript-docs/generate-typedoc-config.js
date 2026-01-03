const fs = require("fs");
const path = require("path");

const actionDir = __dirname;
const workspaceDir = process.cwd();

const htmlConfigPath = path.join(actionDir, "typedoc.html.json");
const mdConfigPath = path.join(actionDir, "typedoc.markdown.json");
const finalHtmlConfigPath = path.join(workspaceDir, "typedoc.html.json");
const finalMarkdownConfigPath = path.join(
  workspaceDir,
  "typedoc.markdown.json"
);

try {
  if (
    fs.existsSync(finalHtmlConfigPath) &&
    fs.existsSync(finalMarkdownConfigPath)
  ) {
    console.log("ℹ️  User provided config files found.");
    console.log("   Skipping dynamic generation to respect project settings.");
    process.exit(0);
  }
  if (!fs.existsSync(htmlConfigPath)) {
    console.error(`HTML Docs config not found at: ${htmlConfigPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(mdConfigPath)) {
    console.error(`Markdown Docs config not found at: ${mdConfigPath}`);
    process.exit(1);
  }
  const htmlConfig = require(htmlConfigPath);
  const mdConfig = require(mdConfigPath);

  fs.writeFileSync(finalHtmlConfigPath, JSON.stringify(htmlConfig, null, 2));
  fs.writeFileSync(finalMarkdownConfigPath, JSON.stringify(mdConfig, null, 2));
  console.log(`✅ Generated config files at: ${finalConfigPath}`);
} catch (error) {
  console.error("❌ Error generating config:", error);
  process.exit(1);
}
