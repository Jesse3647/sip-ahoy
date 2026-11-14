import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { read, write } from "../src/storage";
import { demoData } from "../src/model";
describe("durable journal writes", () => {
  it("commits a complete validated journal and rejects stale writes", async () => {
    const initial = await read();
    expect(initial.revision).toBe(0);
    const data = demoData();
    const saved = await write(data, initial.revision);
    expect(saved.revision).toBe(1);
    expect((await read()).data).toEqual(data);
    await expect(write({ ...data, entries: [] }, 0)).rejects.toThrow(
      "Another tab",
    );
    expect((await read()).data.entries).toHaveLength(18);
  });
});
