import assert from "node:assert/strict";
import test from "node:test";

import {
  REQUIRED_CONFIRMATION,
  validateMigrationEnvironment,
} from "./migrate-rewards-storage.mjs";
import {
  AUTH_COPY_KEYS,
  buildSafeAuthPatch,
} from "./sync-rewards-supabase-config.mjs";

const validEnvironment = {
  SOURCE_SUPABASE_URL: "https://retfuxpfstatpdsunkgj.supabase.co",
  TARGET_SUPABASE_URL: "https://bftuvmywtmpflizsomim.supabase.co",
  SOURCE_SERVICE_ROLE_KEY: "source-key",
  TARGET_SERVICE_ROLE_KEY: "target-key",
  MIGRATION_CONFIRMATION: REQUIRED_CONFIRMATION,
};

test("accepts only the approved source, target, and exact confirmation", () => {
  assert.doesNotThrow(() => validateMigrationEnvironment(validEnvironment));
  assert.throws(
    () =>
      validateMigrationEnvironment({
        ...validEnvironment,
        TARGET_SUPABASE_URL: "https://wrong.supabase.co",
      }),
    /approved new Rewards project/,
  );
  assert.throws(
    () =>
      validateMigrationEnvironment({
        ...validEnvironment,
        MIGRATION_CONFIRMATION: "yes",
      }),
    /exact Rewards clone confirmation/,
  );
});

test("rejects a same-project Storage migration", () => {
  assert.throws(
    () =>
      validateMigrationEnvironment({
        ...validEnvironment,
        TARGET_SERVICE_ROLE_KEY: "source-key",
      }),
    /must be different projects/,
  );
});

test("copies only approved non-secret Auth configuration fields", () => {
  const source = Object.fromEntries(
    AUTH_COPY_KEYS.map((key, index) => [
      key,
      index % 2 ? `value-${index}` : index,
    ]),
  );
  source.smtp_pass = "must-not-copy";
  source.external_google_secret = "must-not-copy";
  source.jwt_secret = "must-not-copy";

  const patch = buildSafeAuthPatch(source);
  assert.deepEqual(Object.keys(patch), AUTH_COPY_KEYS);
  assert.equal(patch.smtp_pass, undefined);
  assert.equal(patch.external_google_secret, undefined);
  assert.equal(patch.jwt_secret, undefined);
});
