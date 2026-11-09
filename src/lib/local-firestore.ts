import {
  listLocalRecords,
  readLocalRecord,
  writeLocalRecords,
  type LocalRecordWrite,
} from "@/lib/local-store";

export type DocumentReference = {
  readonly kind: "document";
  readonly collection: string;
  readonly id: string;
};
export type CollectionReference = { readonly kind: "collection"; readonly collection: string };
type QueryConstraint =
  { type: "orderBy"; field: string; direction: "asc" | "desc" } | { type: "limit"; count: number };
type QueryReference = {
  readonly kind: "query";
  readonly collection: string;
  readonly constraints: QueryConstraint[];
};

export const db = Object.freeze({ engine: "capitalfortune-local-sqlite" });
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}
export function doc(_database: typeof db, collectionName: string, id: string): DocumentReference {
  return { kind: "document", collection: collectionName, id };
}
export function collection(_database: typeof db, collectionName: string): CollectionReference {
  return { kind: "collection", collection: collectionName };
}
export function orderBy(field: string, direction: "asc" | "desc" = "asc"): QueryConstraint {
  return { type: "orderBy", field, direction };
}
export function limit(count: number): QueryConstraint {
  return { type: "limit", count: Math.max(0, Math.floor(count)) };
}
export function query(
  source: CollectionReference,
  ...constraints: QueryConstraint[]
): QueryReference {
  return { kind: "query", collection: source.collection, constraints };
}
function snapshot(id: string, value: unknown | null) {
  return { id, exists: () => value !== null, data: () => (value ?? {}) as Record<string, unknown> };
}
export async function getDoc(reference: DocumentReference) {
  return snapshot(reference.id, await readLocalRecord(reference.collection, reference.id));
}
export async function getDocs(source: CollectionReference | QueryReference) {
  const records = await listLocalRecords(source.collection);
  let filtered = records;
  if (source.kind === "query") {
    const sorter = source.constraints.find((constraint) => constraint.type === "orderBy");
    if (sorter?.type === "orderBy") {
      filtered = [...filtered].sort((left, right) => {
        const a = (left.value as Record<string, unknown>)[sorter.field];
        const b = (right.value as Record<string, unknown>)[sorter.field];
        const comparison =
          typeof a === "number" && typeof b === "number"
            ? a - b
            : String(a ?? "").localeCompare(String(b ?? ""));
        return sorter.direction === "desc" ? -comparison : comparison;
      });
    }
    const maximum = source.constraints.find((constraint) => constraint.type === "limit");
    if (maximum?.type === "limit") filtered = filtered.slice(0, maximum.count);
  }
  const docs = filtered.map((record) => snapshot(record.id, record.value));
  return { docs, size: docs.length, empty: docs.length === 0 };
}
export async function setDoc(
  reference: DocumentReference,
  value: Record<string, unknown>,
): Promise<void> {
  await writeLocalRecords([{ collection: reference.collection, id: reference.id, value }]);
}

type LocalTransaction = {
  get: (reference: DocumentReference) => Promise<ReturnType<typeof snapshot>>;
  set: (reference: DocumentReference, value: Record<string, unknown>) => void;
  delete: (reference: DocumentReference) => void;
};
let transactionQueue: Promise<void> = Promise.resolve();
export async function runTransaction<T>(
  _database: typeof db,
  callback: (transaction: LocalTransaction) => Promise<T>,
): Promise<T> {
  const previous = transactionQueue;
  let release = () => {};
  transactionQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    const writes: LocalRecordWrite[] = [];
    const transaction: LocalTransaction = {
      get: async (reference) => getDoc(reference),
      set: (reference, value) =>
        writes.push({ collection: reference.collection, id: reference.id, value }),
      delete: (reference) =>
        writes.push({ collection: reference.collection, id: reference.id, value: null }),
    };
    const result = await callback(transaction);
    await writeLocalRecords(writes);
    return result;
  } finally {
    release();
  }
}
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Local database error:", { message, operationType, path });
  throw new Error("Local save operation failed: " + message);
}
