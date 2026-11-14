import { describe, expect, it } from "vitest";
import { characterFor, characterIds, sailorReaction } from "../src/characters";
import {
  backup,
  dataSchema,
  demoData,
  importBackup,
  type Entry,
} from "../src/model";

describe("sailor characters and live cosmetic reactions", () => {
  const now = Date.parse("2026-11-15T02:00:00Z");
  const data = demoData();
  const sailor = data.travelers[0];
  const entry = (
    hours = 0,
    category: Entry["category"] = "Cocktail",
  ): Entry => ({
    ...data.entries[0],
    travelerId: sailor.id,
    sailingId: sailor.sailingId,
    sailingDate: "2026-11-14",
    category,
    time: new Date(now - hours * 3600000).toISOString(),
  });
  it("stays ready without recent drinks and counts only this sailor and sailing", () => {
    expect(sailorReaction(sailor, [], now)).toEqual({
      mood: "ready",
      total: 0,
      alcohol: 0,
    });
    expect(
      sailorReaction(
        sailor,
        [
          entry(),
          { ...entry(), travelerId: "other" },
          { ...entry(), sailingId: "other" },
        ],
        now,
      ),
    ).toEqual({ mood: "cheerful", total: 1, alcohol: 1 });
    expect(sailorReaction(sailor, [entry(7)], now).mood).toBe("ready");
    expect(sailorReaction(sailor, [entry(0, "Water")], now).mood).toBe(
      "cheerful",
    );
  });
  it("uses a continuously rolling window across midnight, excludes future logs and expires exactly at six hours", () => {
    const logs = [
      entry(5.999),
      entry(6),
      entry(6.001),
      entry(-1),
      { ...entry(1), sailingDate: "2026-11-15" },
    ];
    expect(sailorReaction(sailor, logs, now)).toEqual({
      mood: "cheerful",
      total: 2,
      alcohol: 2,
    });
    expect(sailorReaction(sailor, [entry(5.999)], now + 4000).mood).toBe(
      "ready",
    );
    expect(
      sailorReaction(
        sailor,
        [{ ...entry(), time: "2026-11-14T21:00:00-05:00" }],
        now,
      ).total,
    ).toBe(1);
  });
  it("uses three for merry and six for woozy, with one point removed per recent water", () => {
    const logs = Array.from({ length: 6 }, (_, i) => ({
      ...entry(i / 2),
      id: String(i),
    }));
    expect(sailorReaction(sailor, logs.slice(0, 2), now).mood).toBe("cheerful");
    expect(sailorReaction(sailor, logs.slice(0, 3), now).mood).toBe("merry");
    expect(sailorReaction(sailor, logs.slice(0, 5), now).mood).toBe("merry");
    expect(sailorReaction(sailor, logs, now).mood).toBe("water");
    const water = entry(0, "Water");
    expect(sailorReaction(sailor, [...logs, water], now)).toEqual({
      mood: "merry",
      total: 7,
      alcohol: 6,
    });
    expect(
      sailorReaction(sailor, [...logs, ...Array(9).fill(water)], now).mood,
    ).toBe("cheerful");
    expect(
      sailorReaction(sailor, [...logs, { ...water, time: entry(6).time }], now)
        .mood,
    ).toBe("water");
    for (const category of [
      "Coffee",
      "Mocktail",
      "Soft drink",
      "Tea",
      "Juice",
      "Smoothie",
      "Other",
    ] as const) {
      expect(
        sailorReaction(sailor, [...logs, entry(0, category)], now).mood,
      ).toBe("water");
    }
  });
  it("recomputes after edits/deletion and as water and alcohol expire independently", () => {
    const logs = Array.from({ length: 6 }, () => entry(0));
    expect(
      sailorReaction(sailor, [...logs, entry(5.5, "Water")], now).mood,
    ).toBe("merry");
    expect(
      sailorReaction(sailor, [...logs, entry(5.5, "Water")], now + 3600000)
        .mood,
    ).toBe("water");
    expect(sailorReaction(sailor, logs.slice(1), now).mood).toBe("merry");
    expect(
      sailorReaction(sailor, [...logs.slice(1), entry(0, "Mocktail")], now)
        .mood,
    ).toBe("merry");
    expect(sailorReaction(sailor, logs, now + 6 * 3600000).mood).toBe("ready");
  });
  it("preserves every assignment in version-six backups and accepts earlier journals", () => {
    for (const characterId of characterIds) {
      const data = demoData();
      data.travelers[0].characterId = characterId;
      const text = backup(data);
      expect(JSON.parse(text).version).toBe(6);
      expect(importBackup(text).travelers[0].characterId).toBe(characterId);
    }
    const old = demoData();
    old.travelers.forEach((t) => delete t.characterId);
    for (const version of [1, 2, 3, 4, 5]) {
      const restored = importBackup(
        JSON.stringify({ app: "SipAhoy", version, exportedAt: "", data: old }),
      );
      expect(restored.travelers[0].characterId).toBeUndefined();
      expect(characterFor(restored.travelers[0])).toBe(
        characterFor(old.travelers[0]),
      );
    }
    expect(characterIds).toContain(characterFor(old.travelers[0]));
    expect(old.travelers[0].characterId).toBeUndefined();
  });
  it("rejects unknown character IDs instead of silently losing an assignment", () => {
    const data = demoData();
    const invalid = {
      ...data,
      travelers: data.travelers.map((t) => ({ ...t, characterId: "unknown" })),
    };
    expect(dataSchema.safeParse(invalid).success).toBe(false);
  });
});
