import { describe, it, expect } from "vitest";
import {
  backup,
  demoData,
  dataSchema,
  importBackup,
  packageBreakdown,
  packagePricingSchema,
  pricingForTraveler,
  travelerStats,
  type PackagePricing,
} from "../src/model";
import { parsePricingDraft, pricingDraft } from "../src/PackagePricing";
const base = (): PackagePricing => ({
  basis: "day",
  amountCents: 8000,
  billedDays: 6,
  gratuityMode: "included",
  gratuityRateBps: 1800,
  gratuityCents: null,
  otherFeesCents: 0,
  extras: [],
});
describe("package and bundle accounting", () => {
  it("uses billed days, without adding gratuities already included", () => {
    const b = packageBreakdown(base());
    expect(b.base).toBe(48000);
    expect(b.total).toBe(48000);
    expect(b.gratuities).toBe(0);
    expect(b.drinkCost).toBe(48000);
  });
  it("gives daily and whole-trip entries the same total and rounds percentages to cents", () => {
    const day = packageBreakdown({ ...base(), gratuityMode: "percent" });
    expect(day.gratuities).toBe(8640);
    expect(day.total).toBe(56640);
    expect(
      packageBreakdown({
        ...base(),
        basis: "trip",
        amountCents: 48000,
        gratuityMode: "percent",
        billedDays: 99,
      }).total,
    ).toBe(day.total);
    expect(
      packageBreakdown({
        ...base(),
        basis: "trip",
        amountCents: 1001,
        gratuityMode: "percent",
      }).total,
    ).toBe(1181);
  });
  it("applies exact whole-trip gratuities and fees, then subtracts only assigned extra values", () => {
    const p = {
      ...base(),
      basis: "trip" as const,
      amountCents: 60000,
      gratuityMode: "fixed" as const,
      gratuityCents: 6000,
      otherFeesCents: 1500,
      extras: [
        {
          id: "beach",
          label: "Beach Club admission",
          amountCents: 10000,
          source: "estimate" as const,
        },
        {
          id: "wifi",
          label: "Wi-Fi",
          amountCents: 5000,
          source: "receipt" as const,
        },
      ],
    };
    const b = packageBreakdown(p);
    expect(b.total).toBe(67500);
    expect(b.deductions).toBe(15000);
    expect(b.drinkCost).toBe(52500);
    expect(b.estimated).toBe(true);
    const d = demoData();
    const t = { ...d.travelers[0], packagePricing: p };
    const stats = travelerStats(t, d.sailings[0], d.entries);
    expect(stats.cost).toBe(52500);
    expect(stats.net).toBe(stats.covered - 52500);
  });
  it("keeps unknown price, gratuities, or extra allocations unknown instead of claiming savings", () => {
    for (const p of [
      { ...base(), amountCents: null },
      { ...base(), gratuityMode: "unknown" as const },
      { ...base(), gratuityMode: "fixed" as const, gratuityCents: null },
      {
        ...base(),
        extras: [
          {
            id: "beach",
            label: "Admission",
            amountCents: null,
            source: "estimate" as const,
          },
        ],
      },
    ]) {
      const d = demoData();
      expect(packageBreakdown(p).drinkCost).toBeNull();
      expect(
        travelerStats(
          { ...d.travelers[0], packagePricing: p },
          d.sailings[0],
          d.entries,
        ).net,
      ).toBeNull();
    }
  });
  it("permits a genuine zero cost and rejects deductions exceeding the bundle total", () => {
    const zero = {
      ...base(),
      extras: [
        {
          id: "extra",
          label: "Non-drink portion",
          amountCents: 48000,
          source: "receipt" as const,
        },
      ],
    };
    expect(packageBreakdown(zero).drinkCost).toBe(0);
    const d = demoData();
    d.travelers[0].packagePricing = {
      ...zero,
      extras: [{ ...zero.extras[0], amountCents: 48001 }],
    };
    expect(dataSchema.safeParse(d).success).toBe(false);
    expect(
      packagePricingSchema.safeParse({ ...base(), gratuityRateBps: 10001 })
        .success,
    ).toBe(false);
  });
  it("preserves legacy daily totals and reads version-one backups without changing logged coverage", () => {
    const d = demoData();
    expect(pricingForTraveler(d.travelers[0], d.sailings[0]).billedDays).toBe(
      7,
    );
    expect(travelerStats(d.travelers[0], d.sailings[0], d.entries).cost).toBe(
      45500,
    );
    const legacy = {
      app: "SipAhoy",
      version: 1,
      exportedAt: new Date().toISOString(),
      data: d,
    };
    expect(importBackup(JSON.stringify(legacy))).toEqual(d);
    expect(pricingDraft(d.travelers[0], d.sailings[0]).gratuityMode).toBe(
      "included",
    );
  });
  it("round-trips new pricing in version-five backups and retains unknown extras", () => {
    const d = demoData();
    d.travelers[0].packagePricing = {
      ...base(),
      extras: [
        {
          id: "beach",
          label: "Admission",
          amountCents: null,
          source: "estimate",
        },
      ],
    };
    const text = backup(d);
    expect(JSON.parse(text).version).toBe(6);
    expect(importBackup(text)).toEqual(d);
  });
  it("validates user input and does not confuse exact gratuities with daily amounts", () => {
    const s = demoData().sailings[0],
      draft = pricingDraft(undefined, s);
    expect(draft.gratuityMode).toBe("unknown");
    expect(
      parsePricingDraft({
        ...draft,
        amount: "80",
        billedDays: "6",
        gratuityMode: "fixed",
        gratuityAmount: "90",
      }).gratuityCents,
    ).toBe(9000);
    for (const change of [
      { billedDays: "0" },
      { billedDays: "1.5" },
      { gratuityMode: "percent" as const, rate: "101" },
      { amount: "-1" },
      {
        extras: [
          { id: "empty", label: "", amount: "10", source: "estimate" as const },
        ],
      },
    ])
      expect(() => parsePricingDraft({ ...draft, ...change })).toThrow();
  });
});
