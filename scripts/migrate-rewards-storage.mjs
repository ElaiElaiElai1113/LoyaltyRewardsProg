import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { createClient } from "@supabase/supabase-js";

export const SOURCE_PROJECT_REF = "retfuxpfstatpdsunkgj";
export const TARGET_PROJECT_REF = "bftuvmywtmpflizsomim";
export const REQUIRED_CONFIRMATION = `CLONE_REWARDS_TO_${TARGET_PROJECT_REF.toUpperCase()}`;

function requiredEnvironment(name, environment = process.env) {
  const value = String(environment[name] ?? "").trim();
  if (!value)
    throw new Error(`Missing required migration environment: ${name}.`);
  return value;
}

function projectRefFromUrl(value) {
  const hostname = new URL(value).hostname;
  const match = hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
  return match?.[1] ?? null;
}

export function validateMigrationEnvironment(environment = process.env) {
  const sourceUrl = requiredEnvironment("SOURCE_SUPABASE_URL", environment);
  const targetUrl = requiredEnvironment("TARGET_SUPABASE_URL", environment);
  const sourceKey = requiredEnvironment("SOURCE_SERVICE_ROLE_KEY", environment);
  const targetKey = requiredEnvironment("TARGET_SERVICE_ROLE_KEY", environment);
  const confirmation = requiredEnvironment(
    "MIGRATION_CONFIRMATION",
    environment,
  );

  if (projectRefFromUrl(sourceUrl) !== SOURCE_PROJECT_REF) {
    throw new Error("The Storage source is not the approved Rewards project.");
  }
  if (projectRefFromUrl(targetUrl) !== TARGET_PROJECT_REF) {
    throw new Error(
      "The Storage target is not the approved new Rewards project.",
    );
  }
  if (sourceUrl === targetUrl || sourceKey === targetKey) {
    throw new Error(
      "The Storage source and target must be different projects.",
    );
  }
  if (confirmation !== REQUIRED_CONFIRMATION) {
    throw new Error("The exact Rewards clone confirmation was not supplied.");
  }

  return { sourceUrl, targetUrl, sourceKey, targetKey };
}

function storageClient(url, key) {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function normalizeCacheControl(metadata) {
  const value = metadata?.cacheControl ?? metadata?.cache_control;
  if (!value) return "3600";
  return String(value).replace(/^max-age=/i, "");
}

async function listLevel(client, bucketId, prefix, output) {
  const limit = 100;
  let offset = 0;

  while (true) {
    const { data, error } = await client.storage.from(bucketId).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error)
      throw new Error(`Unable to enumerate Storage bucket ${bucketId}.`);

    const entries = data ?? [];
    for (const entry of entries) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id) output.push({ ...entry, fullPath });
      else await listLevel(client, bucketId, fullPath, output);
    }

    if (entries.length < limit) break;
    offset += limit;
  }
}

export async function listStorageObjects(client, bucketId) {
  const objects = [];
  await listLevel(client, bucketId, "", objects);
  return objects;
}

async function sha256(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return {
    bytes,
    digest: createHash("sha256").update(bytes).digest("hex"),
  };
}

async function synchronizeBucket(source, target, bucket) {
  const sourceObjects = await listStorageObjects(source, bucket.id);
  let copiedBytes = 0;

  for (const [index, object] of sourceObjects.entries()) {
    const sourceDownload = await source.storage
      .from(bucket.id)
      .download(object.fullPath);
    if (sourceDownload.error || !sourceDownload.data) {
      throw new Error(
        `Unable to download Storage object ${index + 1} from bucket ${bucket.id}.`,
      );
    }
    const sourceHash = await sha256(sourceDownload.data);

    const upload = await target.storage
      .from(bucket.id)
      .upload(object.fullPath, sourceHash.bytes, {
        upsert: true,
        contentType: object.metadata?.mimetype ?? object.metadata?.contentType,
        cacheControl: normalizeCacheControl(object.metadata),
      });
    if (upload.error) {
      throw new Error(
        `Unable to upload Storage object ${index + 1} to bucket ${bucket.id}.`,
      );
    }

    const targetDownload = await target.storage
      .from(bucket.id)
      .download(object.fullPath);
    if (targetDownload.error || !targetDownload.data) {
      throw new Error(
        `Unable to verify Storage object ${index + 1} in bucket ${bucket.id}.`,
      );
    }
    const targetHash = await sha256(targetDownload.data);
    if (
      targetHash.digest !== sourceHash.digest ||
      targetHash.bytes.byteLength !== sourceHash.bytes.byteLength
    ) {
      throw new Error(
        `Storage object ${index + 1} failed byte-for-byte verification in bucket ${bucket.id}.`,
      );
    }
    copiedBytes += sourceHash.bytes.byteLength;
  }

  return { objects: sourceObjects.length, bytes: copiedBytes };
}

export async function migrateRewardsStorage(environment = process.env) {
  const { sourceUrl, targetUrl, sourceKey, targetKey } =
    validateMigrationEnvironment(environment);
  const source = storageClient(sourceUrl, sourceKey);
  const target = storageClient(targetUrl, targetKey);

  const [sourceBucketsResult, targetBucketsResult] = await Promise.all([
    source.storage.listBuckets(),
    target.storage.listBuckets(),
  ]);
  if (sourceBucketsResult.error)
    throw new Error("Unable to list source Storage buckets.");
  if (targetBucketsResult.error)
    throw new Error("Unable to list target Storage buckets.");

  const sourceBuckets = sourceBucketsResult.data ?? [];
  const targetBuckets = new Map(
    (targetBucketsResult.data ?? []).map((bucket) => [bucket.id, bucket]),
  );
  let objectCount = 0;
  let byteCount = 0;

  for (const bucket of sourceBuckets) {
    const options = {
      public: Boolean(bucket.public),
      fileSizeLimit: bucket.file_size_limit ?? undefined,
      allowedMimeTypes: bucket.allowed_mime_types ?? undefined,
    };
    const configurationResult = targetBuckets.has(bucket.id)
      ? await target.storage.updateBucket(bucket.id, options)
      : await target.storage.createBucket(bucket.id, options);
    if (configurationResult.error) {
      throw new Error(`Unable to synchronize Storage bucket ${bucket.id}.`);
    }

    const result = await synchronizeBucket(source, target, bucket);
    objectCount += result.objects;
    byteCount += result.bytes;
  }

  const report = {
    passed: true,
    sourceProjectRef: SOURCE_PROJECT_REF,
    targetProjectRef: TARGET_PROJECT_REF,
    buckets: sourceBuckets.length,
    objects: objectCount,
    bytes: byteCount,
    verification: "sha256-byte-for-byte",
  };
  const reportPath = String(environment.MIGRATION_REPORT_PATH ?? "").trim();
  if (reportPath)
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

async function runCli() {
  try {
    const report = await migrateRewardsStorage();
    console.log(JSON.stringify(report));
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Storage migration failed.",
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await runCli();
