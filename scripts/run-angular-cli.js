#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");

const RETIREMENT_DATE = "2026-06-19";
const LEGACY_PROVIDER_FLAG = "--openssl-legacy-provider";
const rawArgs = process.argv.slice(2);
const withoutLegacyProvider = rawArgs.includes("--without-legacy-provider");
const cliArgs = rawArgs.filter((arg) => arg !== "--without-legacy-provider");
const env = { ...process.env };

if (!withoutLegacyProvider) {
  const nodeOptions = (env.NODE_OPTIONS || "")
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (!nodeOptions.includes(LEGACY_PROVIDER_FLAG)) {
    nodeOptions.push(LEGACY_PROVIDER_FLAG);
  }

  env.NODE_OPTIONS = nodeOptions.join(" ");

  if (!env.JULI_SUPPRESS_OPENSSL_WARNING) {
    process.stderr.write(
      `[juli] Using OpenSSL legacy provider for Angular 12/Webpack compatibility. Retirement target: ${RETIREMENT_DATE}.\n`
    );
  }
}

const cliPath = path.resolve(__dirname, "../node_modules/@angular/cli/bin/ng");
const result = spawnSync(process.execPath, [cliPath, ...cliArgs], {
  stdio: "inherit",
  env,
});

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
