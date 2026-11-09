import { beforeEach, describe, expect, it } from "vitest";
import {
  collection, db, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, setDoc,
} from "@/lib/local-firestore";

describe("local SQLite document adapter", () => {
  beforeEach(() => localStorage.clear());

  it("persists and reads a local record", async () => {
    const reference = doc(db, "player_states", "device-1");
    await setDoc(reference, { version: 1, balance: 125 });
    const saved = await getDoc(reference);
    expect(saved.exists()).toBe(true);
    expect(saved.data()).toEqual({ version: 1, balance: 125 });
  });

  it("commits multi-record transactions and abandons failed transactions", async () => {
    const player = doc(db, "player_states", "device-1");
    const ledger = doc(db, "ledger", "entry-1");
    await setDoc(player, { balance: 100 });
    await runTransaction(db, async (transaction) => {
      const current = await transaction.get(player);
      const state = current.data() as { balance: number };
      transaction.set(player, { balance: state.balance - 25 });
      transaction.set(ledger, { amount: 25, createdAt: 100 });
    });
    expect((await getDoc(player)).data()).toEqual({ balance: 75 });
    expect((await getDoc(ledger)).exists()).toBe(true);
    await expect(runTransaction(db, async (transaction) => {
      transaction.set(player, { balance: 0 });
      throw new Error("abort");
    })).rejects.toThrow("abort");
    expect((await getDoc(player)).data()).toEqual({ balance: 75 });
  });

  it("orders and limits local collection queries", async () => {
    await setDoc(doc(db, "ledger", "a"), { amount: 10 });
    await setDoc(doc(db, "ledger", "b"), { amount: 50 });
    await setDoc(doc(db, "ledger", "c"), { amount: 30 });
    const result = await getDocs(query(collection(db, "ledger"), orderBy("amount", "desc"), limit(2)));
    expect(result.docs.map((entry) => (entry.data() as { amount: number }).amount)).toEqual([50, 30]);
  });
});
