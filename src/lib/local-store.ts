import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";

export type LocalRecordWrite = { collection: string; id: string; value: unknown | null };
const DATABASE_NAME = "capital_fortune_local";
const sqlite = new SQLiteConnection(CapacitorSQLite);
let databasePromise: Promise<SQLiteDBConnection> | null = null;

function storageKey(collection: string, id: string) {
  return "capitalfortune:" + collection + ":" + id;
}

async function getNativeDatabase(): Promise<SQLiteDBConnection> {
  if (databasePromise) return databasePromise;
  databasePromise = (async () => {
    const consistency = await sqlite.checkConnectionsConsistency();
    const connection = await sqlite.isConnection(DATABASE_NAME, false);
    let database: SQLiteDBConnection;
    if (consistency.result && connection.result) {
      database = await sqlite.retrieveConnection(DATABASE_NAME, false);
    } else {
      if (connection.result) await sqlite.closeConnection(DATABASE_NAME, false);
      database = await sqlite.createConnection(DATABASE_NAME, false, "no-encryption", 1, false);
    }
    await database.open();
    await database.execute(
      "CREATE TABLE IF NOT EXISTS local_records (" +
        "collection_name TEXT NOT NULL, record_id TEXT NOT NULL, payload TEXT NOT NULL, " +
        "updated_at INTEGER NOT NULL, PRIMARY KEY (collection_name, record_id));" +
        "CREATE INDEX IF NOT EXISTS idx_local_records_collection ON local_records(collection_name);",
    );
    return database;
  })().catch((error) => {
    databasePromise = null;
    throw error;
  });
  return databasePromise;
}

export async function readLocalRecord<T = unknown>(
  collection: string,
  id: string,
): Promise<T | null> {
  if (!Capacitor.isNativePlatform()) {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(storageKey(collection, id));
    return raw === null ? null : (JSON.parse(raw) as T);
  }
  const database = await getNativeDatabase();
  const result = await database.query(
    "SELECT payload FROM local_records WHERE collection_name = ? AND record_id = ? LIMIT 1",
    [collection, id],
  );
  const raw = result.values?.[0]?.payload;
  return typeof raw === "string" ? (JSON.parse(raw) as T) : null;
}

export async function listLocalRecords<T = unknown>(
  collection: string,
): Promise<{ id: string; value: T }[]> {
  if (!Capacitor.isNativePlatform()) {
    if (typeof localStorage === "undefined") return [];
    const prefix = "capitalfortune:" + collection + ":";
    const records: { id: string; value: T }[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith(prefix)) continue;
      const raw = localStorage.getItem(key);
      if (raw !== null) records.push({ id: key.slice(prefix.length), value: JSON.parse(raw) as T });
    }
    return records;
  }
  const database = await getNativeDatabase();
  const result = await database.query(
    "SELECT record_id, payload FROM local_records WHERE collection_name = ?",
    [collection],
  );
  return (result.values ?? []).map((row) => ({
    id: String(row.record_id),
    value: JSON.parse(String(row.payload)) as T,
  }));
}

export async function writeLocalRecords(writes: LocalRecordWrite[]): Promise<void> {
  if (writes.length === 0) return;
  if (!Capacitor.isNativePlatform()) {
    if (typeof localStorage === "undefined")
      throw new Error("Local storage is unavailable in this runtime.");
    for (const write of writes) {
      const key = storageKey(write.collection, write.id);
      if (write.value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(write.value));
    }
    return;
  }
  const database = await getNativeDatabase();
  // Use the plugin's transaction API instead of issuing transaction-control SQL
  // through execute(), which may be wrapped by platform-specific execution logic.
  await database.beginTransaction();
  try {
    for (const write of writes) {
      if (write.value === null) {
        await database.run(
          "DELETE FROM local_records WHERE collection_name = ? AND record_id = ?",
          [write.collection, write.id],
        );
      } else {
        await database.run(
          "INSERT OR REPLACE INTO local_records (collection_name, record_id, payload, updated_at) VALUES (?, ?, ?, ?)",
          [write.collection, write.id, JSON.stringify(write.value), Date.now()],
        );
      }
    }
    await database.commitTransaction();
  } catch (error) {
    try {
      const transaction = await database.isTransactionActive();
      if (transaction.result) await database.rollbackTransaction();
    } catch {
      /* Keep original error. */
    }
    throw error;
  }
}

export function isNativeSqliteAvailable() {
  return Capacitor.isNativePlatform();
}
