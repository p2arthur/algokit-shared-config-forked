const fs = require("fs");
const path = require("path");

const actionDir = __dirname;
const workspaceDir = process.cwd();

const configPath = path.join(actionDir, "typedoc.base.json");
const finalConfigPath = path.join(workspaceDir, "typedoc.base.json");

try {
  if (fs.existsSync(finalConfigPath)) {
    console.log("ℹ️  User provided config file found.");
    console.log("   Skipping dynamic generation to respect project settings.");
    process.exit(0);
  }
  if (!fs.existsSync(configPath)) {
    console.error(`Docs config not found at: ${configPath}`);
    process.exit(1);
  }

  const config = require(configPath);

  fs.writeFileSync(finalConfigPath, JSON.stringify(config, null, 2));
  console.log(`✅ Generated config file at: ${finalConfigPath}`);
} catch (error) {
  console.error("❌ Error generating config:", error);
  process.exit(1);
}
