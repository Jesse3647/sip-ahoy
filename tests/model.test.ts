import { describe, it, expect } from "vitest";
import {
  backup,
  csv,
  dataSchema,
  demoData,
  days,
  importBackup,
  parseMoney,
  travelerStats,
} from "../src/model";
describe("journal calculations and restore integrity", () => {
  it("keeps money in cents and rejects invalid prices", () => {
    expect(parseMoney("14.29")).toBe(1429);
    for (const v of ["-1", "1.999", "abc", "Infinity", "1e3", ""])
      expect(() => parseMoney(v)).toThrow();
  });
  it("counts inclusive dates over month and DST boundaries", () => {
    const d = demoData();
    expect(
      days({ ...d.sailings[0], start: "2026-03-07", end: "2026-03-10" }),
    ).toBe(4);
  });
  it("compares only the traveler and sailing, without inventing unknown costs", () => {
    const d = demoData(),
      s = d.sailings[0],
      t = d.travelers[0],
      stats = travelerStats(t, s, d.entries);
    expect(stats.count).toBe(9);
    expect(stats.cost).toBe(45500);
    expect(stats.net).toBe(stats.covered - 45500);
    expect(stats.outOfPocket).toBe(0);
    expect(
      travelerStats({ ...t, dailyCostCents: null }, s, d.entries).net,
    ).toBeNull();
    const other = travelerStats(d.travelers[1], s, d.entries);
    expect(other.cost).toBeNull();
    expect(other.outOfPocket).toBe(other.retail);
  });
  it("round-trips complete JSON backups", () => {
    const d = demoData();
    expect(importBackup(backup(d))).toEqual(d);
  });
  it("rejects broken references, impossible dates, duplicate IDs, and overcoverage", () => {
    for (const change of [
      (d: ReturnType<typeof demoData>) => {
        d.entries[0].travelerId = "missing";
      },
      (d: ReturnType<typeof demoData>) => {
        d.sailings[0].start = "2026-02-30";
      },
      (d: ReturnType<typeof demoData>) => {
        d.entries.push(d.entries[0]);
      },
      (d: ReturnType<typeof demoData>) => {
        d.entries[0].coveredCents = d.entries[0].priceCents + 1;
      },
      (d: ReturnType<typeof demoData>) => {
        d.entries[0].sailingDate = "2000-01-01";
      },
    ]) {
      const d = demoData();
      change(d);
      expect(dataSchema.safeParse(d).success).toBe(false);
      expect(() => importBackup(backup(d))).toThrow();
    }
  });
  it("rejects unsupported versions and large backups", () => {
    const b = JSON.parse(backup(demoData()));
    b.version = 99;
    expect(() => importBackup(JSON.stringify(b))).toThrow();
    expect(() => importBackup("x".repeat(5_000_001))).toThrow();
  });
  it("exports a backdated drink day separately from its automatic logging timestamp", () => {
    const d = demoData();
    d.entries = [
      {
        ...d.entries[0],
        sailingDate: "2026-11-13",
        time: "2026-11-14T15:07:00.000Z",
      },
    ];
    expect(csv(d)).toContain('"Drink date","Time (UTC)"');
    expect(csv(d)).toContain('"2026-11-13","2026-11-14T15:07:00.000Z"');
  });
  it("quotes CSV and neutralizes spreadsheet formulas", () => {
    const d = demoData();
    d.entries[0].notes = '=HYPERLINK("evil")';
    expect(csv(d)).toContain('"\'=HYPERLINK(""evil"")"');
  });
});
