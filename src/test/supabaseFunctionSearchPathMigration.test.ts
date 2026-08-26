import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('remaining function search-path hardening migration', () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      'supabase/migrations/20260826153100_fix_remaining_function_search_paths.sql'
    ),
    'utf8'
  ).toLocaleLowerCase();

  it('uses identity arguments and a fixed safe path for every named legacy helper', () => {
    expect(sql).toContain('pg_get_function_identity_arguments');
    expect(sql).toContain('alter function %i.%i(%s) set search_path = pg_catalog, public');
    expect(sql).toContain("'handle_new_user'");
    expect(sql).toContain("'generate_secure_token'");
    expect(sql).toContain("'gift_card_face_value_from_label'");
  });
});
