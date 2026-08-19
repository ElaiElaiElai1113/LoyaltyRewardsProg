import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import {
  REQUIRED_CONFIRMATION,
  SOURCE_PROJECT_REF,
  TARGET_PROJECT_REF,
} from "./migrate-rewards-storage.mjs";

export const AUTH_COPY_KEYS = Object.freeze([
  "site_url",
  "uri_allow_list",
  "disable_signup",
  "jwt_exp",
  "mailer_autoconfirm",
  "mailer_allow_unverified_email_sign_ins",
  "mailer_secure_email_change_enabled",
  "mailer_otp_exp",
  "mailer_otp_length",
  "rate_limit_email_sent",
  "password_min_length",
  "external_email_enabled",
  "external_phone_enabled",
  "external_anonymous_users_enabled",
]);

function requiredEnvironment(name, environment = process.env) {
  const value = String(environment[name] ?? "").trim();
  if (!value)
    throw new Error(`Missing required configuration environment: ${name}.`);
  return value;
}

export function buildSafeAuthPatch(sourceConfig) {
  return Object.fromEntries(
    AUTH_COPY_KEYS.filter(
      (key) =>
        Object.hasOwn(sourceConfig, key) &&
        sourceConfig[key] !== null &&
        sourceConfig[key] !== undefined,
    ).map((key) => [key, sourceConfig[key]]),
  );
}

async function managementRequest(token, path, options = {}) {
  const response = await fetch(`https://api.supabase.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok)
    throw new Error(
      `Supabase Management API request failed with ${response.status}.`,
    );
  if (response.status === 204) return null;
  return response.json();
}

export async function syncRewardsSupabaseConfig(environment = process.env) {
  const sourceToken = requiredEnvironment(
    "SOURCE_SUPABASE_ACCESS_TOKEN",
    environment,
  );
  const targetToken = requiredEnvironment(
    "TARGET_SUPABASE_ACCESS_TOKEN",
    environment,
  );
  const confirmation = requiredEnvironment(
    "MIGRATION_CONFIRMATION",
    environment,
  );
  if (confirmation !== REQUIRED_CONFIRMATION)
    throw new Error("The exact Rewards clone confirmation was not supplied.");
  if (sourceToken === targetToken)
    throw new Error(
      "Source and target Management API tokens must be different.",
    );

  const sourceAuth = await managementRequest(
    sourceToken,
    `/projects/${SOURCE_PROJECT_REF}/config/auth`,
  );
  const patch = buildSafeAuthPatch(sourceAuth);
  if (Object.keys(patch).length !== AUTH_COPY_KEYS.length) {
    const missing = AUTH_COPY_KEYS.filter((key) => !Object.hasOwn(patch, key));
    throw new Error(
      `The source Auth configuration is missing approved fields: ${missing.join(", ")}.`,
    );
  }

  await managementRequest(
    targetToken,
    `/projects/${TARGET_PROJECT_REF}/config/auth`,
    {
      method: "PATCH",
      body: JSON.stringify(patch),
    },
  );
  const targetAuth = await managementRequest(
    targetToken,
    `/projects/${TARGET_PROJECT_REF}/config/auth`,
  );
  const mismatches = AUTH_COPY_KEYS.filter(
    (key) => JSON.stringify(targetAuth[key]) !== JSON.stringify(patch[key]),
  );
  if (mismatches.length)
    throw new Error(
      `Auth configuration verification failed for: ${mismatches.join(", ")}.`,
    );

  const report = {
    passed: true,
    sourceProjectRef: SOURCE_PROJECT_REF,
    targetProjectRef: TARGET_PROJECT_REF,
    copiedAuthFields: AUTH_COPY_KEYS,
    deliberatelyExcluded: [
      "SMTP credentials",
      "OAuth provider secrets",
      "JWT secrets",
      "API keys",
    ],
  };
  const reportPath = String(environment.CONFIG_REPORT_PATH ?? "").trim();
  if (reportPath)
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

async function runCli() {
  try {
    const report = await syncRewardsSupabaseConfig();
    console.log(JSON.stringify(report));
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Supabase configuration sync failed.",
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await runCli();
