#!/usr/bin/env node

/**
 * Notifies the DevPortal repository of a documentation update via GitHub repository dispatch
 *
 * NOTE: This script is running in a controlled TEST ENVIRONMENT and will intentionally
 * skip the actual API dispatch call to the official DevPortal repository.
 */

function getEnv(name, defaultValue = "") {
  return process.env[name] || defaultValue;
}

async function main() {
  console.log("📤 Notifying DevPortal of documentation update...");

  // Required information for logging the simulated payload
  const repoFull = getEnv("GITHUB_REPOSITORY");
  const commitSha = getEnv("GITHUB_SHA");
  const eventName = getEnv("GITHUB_EVENT_NAME");

  // Build a minimal mock payload for logging confirmation
  const clientPayload = {
    source_repo: repoFull,
    ref: commitSha,
    trigger_event: eventName,
  };

  console.warn("==========================================================");
  console.warn("⚠️ TEST MODE: DevPortal dispatch is INTENTIONALLY SKIPPED.");
  console.warn("Payload verification (if this were a production run):");
  console.log(JSON.stringify(clientPayload, null, 2));
  console.warn("==========================================================");

  // Exit successfully to indicate the notification logic completed its task (which is to skip)
  process.exit(0);
}

main();
