import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Supabase Schema & Migration Specification", () => {
  const rootDir = path.resolve(__dirname, "..");
  const migrationPath = path.join(
    rootDir,
    "supabase/migrations/20261113000000_haven_schema.sql"
  );
  const seedPath = path.join(rootDir, "supabase/seed.sql");
  const envExamplePath = path.join(rootDir, ".env.example");
  const envPath = path.join(rootDir, ".env");

  const migrationSql = fs.readFileSync(migrationPath, "utf-8");

  describe("Migration File Structure", () => {
    it("migration file exists and is non-empty", () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
      expect(migrationSql.length).toBeGreaterThan(0);
    });

    it("enables required UUID extension", () => {
      expect(migrationSql).toMatch(/CREATE\s+EXTENSION\s+IF\s+NOT\s+EXISTS\s+"uuid-ossp"/i);
    });
  });

  describe("Table Definitions & Constraints", () => {
    it("defines games table with required columns and constraints", () => {
      expect(migrationSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.games\s*\(/i);
      expect(migrationSql).toMatch(/id\s+UUID\s+PRIMARY\s+KEY\s+DEFAULT\s+gen_random_uuid\(\)/i);
      expect(migrationSql).toMatch(/title\s+TEXT\s+NOT\s+NULL/i);
      expect(migrationSql).toMatch(/slug\s+TEXT\s+NOT\s+NULL\s+UNIQUE/i);
      expect(migrationSql).toMatch(/image_url\s+TEXT/i);
      expect(migrationSql).toMatch(/created_at\s+TIMESTAMPTZ\s+DEFAULT\s+now\(\)/i);
    });

    it("defines game_keys table with foreign key and status check constraints", () => {
      expect(migrationSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.game_keys\s*\(/i);
      expect(migrationSql).toMatch(
        /game_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.games\(id\)\s+ON\s+DELETE\s+CASCADE/i
      );
      expect(migrationSql).toMatch(/key_code\s+TEXT\s+NOT\s+NULL/i);
      expect(migrationSql).toMatch(
        /status\s+TEXT\s+NOT\s+NULL\s+DEFAULT\s+'available'\s+CHECK\s*\(\s*status\s+IN\s*\('available',\s*'assigned',\s*'redeemed'\)\)/i
      );
    });

    it("defines vouchers table with foreign keys and unique key pairing", () => {
      expect(migrationSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.vouchers\s*\(/i);
      expect(migrationSql).toMatch(
        /game_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.games\(id\)\s+ON\s+DELETE\s+RESTRICT/i
      );
      expect(migrationSql).toMatch(
        /key_id\s+UUID\s+NOT\s+NULL\s+UNIQUE\s+REFERENCES\s+public\.game_keys\(id\)\s+ON\s+DELETE\s+RESTRICT/i
      );
      expect(migrationSql).toMatch(/is_redeemed\s+BOOLEAN\s+NOT\s+NULL\s+DEFAULT\s+false/i);
      expect(migrationSql).toMatch(/redeemed_at\s+TIMESTAMPTZ/i);
    });

    it("defines performance indexes on foreign keys and lookup columns", () => {
      expect(migrationSql).toMatch(
        /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_game_keys_game_status\s+ON\s+public\.game_keys\s*\(game_id,\s*status\)/i
      );
      expect(migrationSql).toMatch(
        /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_vouchers_game_id\s+ON\s+public\.vouchers\s*\(game_id\)/i
      );
    });
  });

  describe("Row Level Security (RLS) Policies", () => {
    it("enables RLS on all three tables", () => {
      expect(migrationSql).toMatch(/ALTER\s+TABLE\s+public\.games\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i);
      expect(migrationSql).toMatch(
        /ALTER\s+TABLE\s+public\.game_keys\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i
      );
      expect(migrationSql).toMatch(
        /ALTER\s+TABLE\s+public\.vouchers\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i
      );
    });

    it("grants public read access to games", () => {
      expect(migrationSql).toMatch(
        /CREATE\s+POLICY\s+"Allow public read access to games"\s+ON\s+public\.games\s+FOR\s+SELECT\s+TO\s+public\s+USING\s*\(true\)/i
      );
    });

    it("grants public read access to vouchers status", () => {
      expect(migrationSql).toMatch(
        /CREATE\s+POLICY\s+"Allow public read access to voucher status"\s+ON\s+public\.vouchers\s+FOR\s+SELECT\s+TO\s+public\s+USING\s*\(true\)/i
      );
    });

    it("shields game_keys from public access and restricts to service_role", () => {
      expect(migrationSql).toMatch(
        /CREATE\s+POLICY\s+"Allow service role full access to keys"\s+ON\s+public\.game_keys\s+FOR\s+ALL\s+TO\s+service_role\s+USING\s*\(true\)/i
      );
      // Ensure there is NO policy granting public access to game_keys
      expect(migrationSql).not.toMatch(/CREATE\s+POLICY[^\n]+ON\s+public\.game_keys[^\n]+TO\s+public/i);
    });
  });

  describe("Atomic Redeem RPC Stored Procedure", () => {
    it("declares redeem_game_voucher function with SECURITY DEFINER and search_path", () => {
      expect(migrationSql).toMatch(
        /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.redeem_game_voucher\s*\(\s*p_voucher_id\s+UUID\s*\)\s*RETURNS\s+JSONB/i
      );
      expect(migrationSql).toMatch(/LANGUAGE\s+plpgsql/i);
      expect(migrationSql).toMatch(/SECURITY\s+DEFINER/i);
      expect(migrationSql).toMatch(/SET\s+search_path\s*=\s*public/i);
    });

    it("uses atomic UPDATE with conditional WHERE clause for single-use guarantee", () => {
      expect(migrationSql).toMatch(
        /UPDATE\s+public\.vouchers\s+SET\s+is_redeemed\s*=\s*true,\s*redeemed_at\s*=\s*now\(\)\s+WHERE\s+id\s*=\s*p_voucher_id\s+AND\s+is_redeemed\s*=\s*false\s+RETURNING/i
      );
    });

    it("handles ALREADY_REDEEMED and INVALID_VOUCHER error scenarios", () => {
      expect(migrationSql).toMatch(/'error',\s*'ALREADY_REDEEMED'/i);
      expect(migrationSql).toMatch(/'error',\s*'INVALID_VOUCHER'/i);
    });

    it("marks the matched key as redeemed and returns the secret key in the JSONB payload", () => {
      expect(migrationSql).toMatch(
        /UPDATE\s+public\.game_keys\s+SET\s+status\s*=\s*'redeemed'\s+WHERE\s+id\s*=\s*v_voucher\.key_id\s+RETURNING\s+key_code\s+INTO\s+v_key_code/i
      );
      expect(migrationSql).toMatch(/'key_code',\s*v_key_code/i);
      expect(migrationSql).toMatch(/'success',\s*true/i);
    });

    it("grants execute permissions on the RPC function", () => {
      expect(migrationSql).toMatch(
        /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.redeem_game_voucher\(UUID\)\s+TO\s+anon,\s*authenticated,\s*service_role/i
      );
    });
  });

  describe("Atomic Issue Voucher RPC Stored Procedure", () => {
    it("declares issue_game_voucher function with SECURITY DEFINER and search_path", () => {
      expect(migrationSql).toMatch(
        /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.issue_game_voucher\s*\(\s*p_game_id\s+UUID\s*\)\s*RETURNS\s+JSONB/i
      );
      expect(migrationSql).toMatch(/LANGUAGE\s+plpgsql/i);
      expect(migrationSql).toMatch(/SECURITY\s+DEFINER/i);
      expect(migrationSql).toMatch(/SET\s+search_path\s*=\s*public/i);
    });

    it("uses FOR UPDATE SKIP LOCKED to prevent concurrency races when selecting available key", () => {
      expect(migrationSql).toMatch(/FOR\s+UPDATE\s+SKIP\s+LOCKED/i);
    });

    it("atomically marks key as assigned and inserts voucher", () => {
      expect(migrationSql).toMatch(/UPDATE\s+public\.game_keys\s+SET\s+status\s*=\s*'assigned'/i);
      expect(migrationSql).toMatch(/INSERT\s+INTO\s+public\.vouchers\s*\(game_id,\s*key_id\)/i);
    });

    it("grants execute permissions on issue_game_voucher function", () => {
      expect(migrationSql).toMatch(
        /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.issue_game_voucher\(UUID\)\s+TO\s+anon,\s*authenticated,\s*service_role/i
      );
    });
  });

  describe("Seed Data & Environment Configuration", () => {
    it("seed.sql exists and contains valid inserts for games, game_keys, and vouchers", () => {
      expect(fs.existsSync(seedPath)).toBe(true);
      const seedSql = fs.readFileSync(seedPath, "utf-8");
      expect(seedSql).toMatch(/INSERT\s+INTO\s+public\.games/i);
      expect(seedSql).toMatch(/INSERT\s+INTO\s+public\.game_keys/i);
      expect(seedSql).toMatch(/INSERT\s+INTO\s+public\.vouchers/i);
      expect(seedSql).toMatch(/Celeste/i);
      expect(seedSql).toMatch(/Hollow Knight/i);
    });

    it(".env.example contains Supabase URL and publishable anon key", () => {
      expect(fs.existsSync(envExamplePath)).toBe(true);
      const envExample = fs.readFileSync(envExamplePath, "utf-8");
      expect(envExample).toMatch(/^VITE_SUPABASE_URL=https:\/\/sftajljdqjfmpaakekmi\.supabase\.co/m);
      expect(envExample).toMatch(/^VITE_SUPABASE_ANON_KEY=sb_publishable_vR130N8Tm5BM-lNy3pfl_Q_QUqh8f6x/m);
    });

    it(".env contains Supabase URL and publishable anon key", () => {
      expect(fs.existsSync(envPath)).toBe(true);
      const env = fs.readFileSync(envPath, "utf-8");
      expect(env).toMatch(/^VITE_SUPABASE_URL=https:\/\/sftajljdqjfmpaakekmi\.supabase\.co/m);
      expect(env).toMatch(/^VITE_SUPABASE_ANON_KEY=sb_publishable_vR130N8Tm5BM-lNy3pfl_Q_QUqh8f6x/m);
    });
  });
});
