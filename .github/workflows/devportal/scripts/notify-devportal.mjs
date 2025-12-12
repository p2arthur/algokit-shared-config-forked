#!/usr/bin/env node

/**
 * Notifies the DevPortal repository of a documentation update via GitHub repository dispatch
 * Usage: node notify-devportal.js
 *
 * Required environment variables:
 * - GITHUB_REPOSITORY: Full repository name (owner/repo)
 * - GITHUB_REPOSITORY_OWNER: Repository owner
 * - GITHUB_REPOSITORY_NAME: Repository name
 * - GITHUB_SHA: Commit SHA
 * - GITHUB_EVENT_NAME: Event type (release, pull_request, etc.)
 * - DEVPORTAL_DISPATCH_TOKEN: GitHub token for repository dispatch
 *
 * Optional environment variables:
 * - GITHUB_EVENT_RELEASE_TAG_NAME: Release tag name (for release events)
 * - GITHUB_EVENT_RELEASE_NAME: Release name (for release events)
 * - GITHUB_EVENT_RELEASE_HTML_URL: Release URL (for release events)
 * - GITHUB_EVENT_RELEASE_CREATED_AT: Release creation timestamp
 * - GITHUB_EVENT_HEAD_COMMIT_URL: Commit URL
 * - GITHUB_EVENT_HEAD_COMMIT_TIMESTAMP: Commit timestamp
 * - GITHUB_EVENT_INPUTS_REASON: Manual trigger reason
 * - GITHUB_SERVER_URL: GitHub server URL (defaults to https://github.com)
 * - DEVPORTAL_REPO: DevPortal repository (defaults to algorandfoundation/devportal)
 * - DOCS_BRANCH: Documentation branch (defaults to docs-dist)
 */

/**
 * Makes a GitHub repository dispatch API call
 * @param {Object} params
 * @returns {Promise<{success: boolean, statusCode: number, error?: string}>}
 */
async function notifyDevPortal(params) {
  const { dispatchRepo, token, eventType, clientPayload } = params;

  const url = `https://api.github.com/repos/${dispatchRepo}/dispatches`;
  const payload = {
    event_type: eventType,
    client_payload: clientPayload,
  };

  console.log("📤 Sending dispatch to:", url);
  console.log("Payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `token ${token}`,
        "User-Agent": `${params.repoName}-docs`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const statusCode = response.status;

    if (statusCode === 204) {
      return { success: true, statusCode };
    }

    let errorBody = "";
    try {
      errorBody = await response.text();
    } catch {
      // Ignore errors reading response body
    }

    return {
      success: false,
      statusCode,
      error: errorBody,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: 0,
      error: error.message,
    };
  }
}

/**
 * Gets an environment variable or returns a default value
 */
function getEnv(name, defaultValue = "") {
  return process.env[name] || defaultValue;
}

/**
 * Main function
 */
async function main() {
  console.log("📤 Notifying DevPortal of documentation update...");

  // Required environment variables
  const repoFull = getEnv("GITHUB_REPOSITORY");
  const repoOwner = getEnv("GITHUB_REPOSITORY_OWNER");
  const repoName = getEnv("GITHUB_REPOSITORY_NAME");
  const commitSha = getEnv("GITHUB_SHA");
  const eventName = getEnv("GITHUB_EVENT_NAME");
  const token = getEnv("DEVPORTAL_DISPATCH_TOKEN");

  // Optional environment variables with defaults
  const dispatchRepo = getEnv("DEVPORTAL_REPO", "algorandfoundation/devportal");
  const docsBranch = getEnv("DOCS_BRANCH", "docs-dist");
  const serverUrl = getEnv("GITHUB_SERVER_URL", "https://github.com");

  // Validate required variables
  if (!repoFull || !repoOwner || !repoName || !commitSha || !eventName) {
    console.error("❌ Missing required environment variables");
    console.error(
      "Required: GITHUB_REPOSITORY, GITHUB_REPOSITORY_OWNER, GITHUB_REPOSITORY_NAME, GITHUB_SHA, GITHUB_EVENT_NAME"
    );
    process.exit(1);
  }

  if (!token) {
    console.error("⚠️ DEVPORTAL_DISPATCH_TOKEN is not set");
    console.error("Skipping DevPortal notification");
    process.exit(0);
  }

  // Determine version and trigger info based on event type
  let version, triggerEvent, triggerReason, commitUrl, timestamp;

  if (eventName === "release") {
    const tagName = getEnv("GITHUB_EVENT_RELEASE_TAG_NAME");
    const releaseName = getEnv("GITHUB_EVENT_RELEASE_NAME");
    const releaseUrl = getEnv("GITHUB_EVENT_RELEASE_HTML_URL");

    if (!tagName) {
      console.error("❌ Release event missing tag name");
      process.exit(1);
    }

    // Strip leading 'v' if present, handle double 'vv' case
    version = tagName.startsWith("v") ? tagName.substring(1) : tagName;
    version = `v${version}`;

    triggerEvent = "release";
    triggerReason = `Release ${tagName}: ${releaseName || "N/A"}`;
    commitUrl = releaseUrl || `${serverUrl}/${repoFull}/commit/${commitSha}`;
    timestamp = getEnv(
      "GITHUB_EVENT_RELEASE_CREATED_AT",
      new Date().toISOString()
    );
  } else {
    version = "latest";
    triggerEvent = "manual";
    triggerReason = getEnv(
      "GITHUB_EVENT_INPUTS_REASON",
      "Manual documentation update"
    );
    commitUrl = getEnv(
      "GITHUB_EVENT_HEAD_COMMIT_URL",
      `${serverUrl}/${repoFull}/commit/${commitSha}`
    );
    timestamp = getEnv(
      "GITHUB_EVENT_HEAD_COMMIT_TIMESTAMP",
      new Date().toISOString()
    );
  }

  console.log("Repository:", repoFull);
  console.log("Version:", version);
  console.log("Trigger:", triggerEvent);
  console.log("Dispatch repository:", dispatchRepo);
  console.log("Docs branch:", docsBranch);

  // Build client payload
  const clientPayload = {
    source_repo: repoFull,
    source_owner: repoOwner,
    source_name: repoName,
    ref: commitSha,
    branch: docsBranch,
    version: version,
    trigger_event: triggerEvent,
    trigger_reason: triggerReason,
    commit_url: commitUrl,
    timestamp: timestamp,
  };

  // Make the API call
  const result = await notifyDevPortal({
    dispatchRepo,
    token,
    eventType: "docs_updated",
    clientPayload,
    repoName,
  });

  // Handle result
  if (result.success) {
    console.log("✅ DevPortal notification sent successfully");
    process.exit(0);
  }

  // Handle errors
  const statusCode = result.statusCode;

  if (statusCode === 404) {
    console.error("❌ DevPortal repository not found or token lacks access");
    console.error(`Repository: ${dispatchRepo}`);
    process.exit(1);
  }

  if (statusCode === 401 || statusCode === 403) {
    console.error("❌ Authentication failed. Check DEVPORTAL_DISPATCH_TOKEN");
    console.error(
      "Token must have repo scope and access to the target repository"
    );
    process.exit(1);
  }

  console.error(`⚠️ Unexpected response: HTTP ${statusCode}`);
  if (result.error) {
    console.error("Error details:", result.error);
  }
  process.exit(1);
}

main();
