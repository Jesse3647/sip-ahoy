import { Plus, Trash2 } from "lucide-react";
import {
  days,
  money,
  packageBreakdown,
  pricingForTraveler,
  uid,
  parseMoney,
  type PackagePricing,
  type Sailing,
  type Traveler,
} from "./model";

/** Editable bundled-extra fields; amounts remain strings until parsing. */
type ExtraDraft = {
  /** Stable identity used when editing or removing this extra. */
  id: string;
  /** Editable name of the non-drink inclusion. */
  label: string;
  /** Whole-trip USD text; blank means unknown. */
  amount: string;
  /** Evidence type for this value. */
  source: "receipt" | "estimate";
};
/** Form representation: empty monetary text means unknown, never an implicit zero. */
export type PricingDraft = {
  /** Daily or whole-trip interpretation of amount. */
  basis: "day" | "trip";
  /** Entered USD text; blank means the base price is unknown. */
  amount: string;
  /** Days actually charged, kept as text while editing. */
  billedDays: string;
  /** How gratuities relate to the entered price. */
  gratuityMode: PackagePricing["gratuityMode"];
  /** Percentage text, such as 18.00, converted to basis points on save. */
  rate: string;
  /** Whole-trip gratuity text when using an exact amount. */
  gratuityAmount: string;
  /** Whole-trip additional fees; blank means no added fees. */
  fees: string;
  /** Independent editable copies of the bundle’s non-drink inclusions. */
  extras: ExtraDraft[];
};
/** Formats cents or basis points as decimal input text, preserving unknown values as blank. */
const amountText = (n: number | null) =>
  n === null ? "" : (n / 100).toFixed(2);
/** Creates an independent editable copy; new packages suggest sailing nights as billed days. */
export function pricingDraft(
  traveler: Traveler | undefined,
  sailing: Sailing,
): PricingDraft {
  const pricing = traveler?.hasPackage
    ? pricingForTraveler(traveler, sailing)
    : {
        basis: "day" as const,
        amountCents: null,
        billedDays: Math.max(1, days(sailing) - 1),
        gratuityMode: "unknown" as const,
        gratuityRateBps: 1800,
        gratuityCents: null,
        otherFeesCents: 0,
        extras: [],
      };
  return {
    basis: pricing.basis,
    amount: amountText(pricing.amountCents),
    billedDays: String(pricing.billedDays),
    gratuityMode: pricing.gratuityMode,
    rate: amountText(pricing.gratuityRateBps),
    gratuityAmount: amountText(pricing.gratuityCents),
    fees: pricing.otherFeesCents ? amountText(pricing.otherFeesCents) : "",
    extras: pricing.extras.map((x) => ({
      id: x.id,
      label: x.label,
      amount: amountText(x.amountCents),
      source: x.source,
    })),
  };
}
/** Parses form text into stored units and rejects invalid billing, gratuities, or excess deductions. */
export function parsePricingDraft(draft: PricingDraft): PackagePricing {
  const billedDays = Number(draft.billedDays);
  if (
    draft.basis === "day" &&
    (!Number.isInteger(billedDays) || billedDays < 1 || billedDays > 3650)
  )
    throw new Error("Enter the number of days actually charged (1–3650).");
  // Two decimal places scale percentages to basis points exactly as dollars scale to cents.
  const rate = draft.gratuityMode === "percent" ? parseMoney(draft.rate) : 1800;
  if (rate > 10000)
    throw new Error("Gratuity percentage must be between 0 and 100.");
  const pricing: PackagePricing = {
    basis: draft.basis,
    amountCents: draft.amount.trim() ? parseMoney(draft.amount) : null,
    billedDays: draft.basis === "day" ? billedDays : 1,
    gratuityMode: draft.gratuityMode,
    gratuityRateBps: rate,
    gratuityCents:
      draft.gratuityMode === "fixed" && draft.gratuityAmount.trim()
        ? parseMoney(draft.gratuityAmount)
        : null,
    otherFeesCents: draft.fees.trim() ? parseMoney(draft.fees) : 0,
    extras: draft.extras.map((x) => {
      if (!x.label.trim()) throw new Error("Give each bundled extra a name.");
      return {
        id: x.id,
        label: x.label.trim(),
        amountCents: x.amount.trim() ? parseMoney(x.amount) : null,
        source: x.source,
      };
    }),
  };
  const breakdown = packageBreakdown(pricing);
  if (breakdown.total !== null && breakdown.knownDeductions > breakdown.total)
    throw new Error("Bundled extras cannot exceed the total package cost.");
  return pricing;
}
/** Inputs for MoneyField. */
type MoneyFieldProps = {
  /** Accessible field label. */
  label: string;
  /** Editable decimal string, with an empty string for unknown. */
  value: string;
  /** Receives raw text; parsing happens at the pricing boundary. */
  onChange: (s: string) => void;
  /** Guidance displayed while the amount is empty. */
  placeholder?: string;
};

/** Edits decimal text without coercing a blank amount to zero. */
function MoneyField({
  label,
  value,
  onChange,
  placeholder = "Leave blank if unknown",
}: MoneyFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
/** Inputs for PricingBreakdown. */
type PricingBreakdownProps = {
  /** Calculated cents and completeness information from packageBreakdown. */
  pricing: ReturnType<typeof packageBreakdown>;
  /** Uses a smaller layout inside traveler summary cards. */
  compact?: boolean;
};

/** Displays full paid cost separately from drink-only comparison cost, preserving unknown values. */
export function PricingBreakdown({
  pricing,
  compact = false,
}: PricingBreakdownProps) {
  const breakdown = pricing;
  const show = (n: number | null) => (n === null ? "Not yet known" : money(n));
  return (
    <div
      className={"pricing-breakdown " + (compact ? "compact" : "")}
      aria-label="Package cost breakdown"
    >
      <dl>
        <div>
          <dt>Entered package price</dt>
          <dd>{show(breakdown.base)}</dd>
        </div>
        <div>
          <dt>Added gratuities</dt>
          <dd>{show(breakdown.gratuities)}</dd>
        </div>
        {breakdown.otherFees > 0 && (
          <div>
            <dt>Other taxes / fees</dt>
            <dd>{money(breakdown.otherFees)}</dd>
          </div>
        )}
        <div>
          <dt>Full package / bundle total</dt>
          <dd>{show(breakdown.total)}</dd>
        </div>
        {(breakdown.deductions !== 0 ||
          breakdown.incompleteReason === "Bundled extra value not entered") && (
          <div>
            <dt>
              Less non-drink extras{breakdown.estimated ? " (estimated)" : ""}
            </dt>
            <dd>
              {breakdown.deductions === null
                ? "Not yet known"
                : `−${money(breakdown.deductions)}`}
            </dd>
          </div>
        )}
        <div className="drink-cost-total">
          <dt>
            Drink-only comparison cost{breakdown.estimated ? " (estimate)" : ""}
          </dt>
          <dd>{show(breakdown.drinkCost)}</dd>
        </div>
      </dl>
      {breakdown.incompleteReason && (
        <p className="footnote">
          {breakdown.incompleteReason}. Break-even stays unavailable until the
          breakdown is complete.
        </p>
      )}
    </div>
  );
}
/** Inputs for PackagePricingEditor. */
type PackagePricingEditorProps = {
  /** Current editable pricing draft, including incomplete values. */
  value: PricingDraft;
  /** Receives an immutable replacement draft after each edit. */
  onChange: (v: PricingDraft) => void;
  /** Trip used to explain suggested versus actually billed days. */
  sailing: Sailing;
};

/** Maintains editable pricing strings and previews calculations without saving the journal. */
export function PackagePricingEditor({
  value: draft,
  onChange,
  sailing,
}: PackagePricingEditorProps) {
  // Replace drafts and extras immutably so copied traveler settings never share editable state.
  const patch = (changes: Partial<PricingDraft>) =>
    onChange({ ...draft, ...changes });
  const extra = (id: string, changes: Partial<ExtraDraft>) =>
    patch({
      extras: draft.extras.map((x) => (x.id === id ? { ...x, ...changes } : x)),
    });
  let result: ReturnType<typeof packageBreakdown> | null = null;
  let problem = "";
  try {
    result = packageBreakdown(parsePricingDraft(draft));
  } catch (e) {
    problem = (e as Error).message;
  }
  return (
    <section className="pricing-editor" aria-label="Package pricing">
      <h3 className="form-subtitle">1. What did you pay?</h3>
      <p className="footnote">
        Amounts are for this traveler only. Use your booking confirmation or
        receipt.
      </p>
      <label className="field">
        <span>Price entered as</span>
        <select
          value={draft.basis}
          onChange={(e) =>
            patch({ basis: e.target.value as PricingDraft["basis"] })
          }
        >
          <option value="day">Per day</option>
          <option value="trip">Whole trip</option>
        </select>
      </label>
      <div className="form-grid">
        <MoneyField
          label={
            draft.basis === "day"
              ? "Package cost per day · USD (optional)"
              : "Package cost for whole trip · USD (optional)"
          }
          value={draft.amount}
          onChange={(amount) => patch({ amount })}
        />
        {draft.basis === "day" && (
          <label className="field">
            <span>Days charged</span>
            <input
              type="number"
              min={1}
              max={3650}
              step={1}
              required
              value={draft.billedDays}
              onChange={(e) => patch({ billedDays: e.target.value })}
            />
          </label>
        )}
      </div>
      {draft.basis === "day" && (
        <p className="footnote">
          Check the billed days on your confirmation. This sailing spans{" "}
          {days(sailing)} calendar dates; the last morning may not be charged.
        </p>
      )}
      <h3 className="form-subtitle">2. Gratuities & fees</h3>
      <label className="field">
        <span>Gratuities in this price?</span>
        <select
          value={draft.gratuityMode}
          onChange={(e) =>
            patch({
              gratuityMode: e.target.value as PricingDraft["gratuityMode"],
            })
          }
        >
          <option value="unknown">Not sure yet</option>
          <option value="included">Already included — do not add again</option>
          <option value="percent">Not included — add a percentage</option>
          <option value="fixed">Not included — enter exact total</option>
        </select>
      </label>
      {draft.gratuityMode === "percent" && (
        <>
          <MoneyField
            label="Gratuity percentage"
            value={draft.rate}
            onChange={(rate) => patch({ rate })}
            placeholder="e.g. 18"
          />
          <p className="footnote">
            Applied to the full entered package price before deductions. If your
            bundle uses a different fee basis, enter the exact gratuity total
            instead.
          </p>
        </>
      )}
      {draft.gratuityMode === "fixed" && (
        <MoneyField
          label="Gratuity total for whole trip · USD"
          value={draft.gratuityAmount}
          onChange={(gratuityAmount) => patch({ gratuityAmount })}
        />
      )}
      <MoneyField
        label="Other taxes / fees for whole trip · USD (optional)"
        value={draft.fees}
        onChange={(fees) => patch({ fees })}
        placeholder="Only charges not already included"
      />
      <h3 className="form-subtitle">3. Does the bundle include extras?</h3>
      <p className="footnote">
        Subtract the amount you assign to admission or other non-drink benefits.
        These are whole-trip deductions for this traveler, after gratuities and
        fees.
      </p>
      <div className="extra-shortcuts">
        <button
          type="button"
          className="button secondary"
          disabled={draft.extras.length >= 20}
          onClick={() =>
            patch({
              extras: [
                ...draft.extras,
                {
                  id: uid(),
                  label: "Beach Club admission",
                  amount: "",
                  source: "estimate",
                },
              ],
            })
          }
        >
          <Plus size={14} /> Beach Club admission
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={draft.extras.length >= 20}
          onClick={() =>
            patch({
              extras: [
                ...draft.extras,
                { id: uid(), label: "", amount: "", source: "estimate" },
              ],
            })
          }
        >
          <Plus size={14} /> Other extra
        </button>
      </div>
      {draft.extras.map((x, i) => (
        <div className="bundle-extra" key={x.id}>
          <div className="extra-heading">
            <strong>Bundled extra {i + 1}</strong>
            <button
              type="button"
              className="icon-btn danger"
              aria-label={`Remove bundled extra ${i + 1}`}
              onClick={() =>
                patch({ extras: draft.extras.filter((e) => e.id !== x.id) })
              }
            >
              <Trash2 size={15} />
            </button>
          </div>
          <label className="field">
            <span>Extra {i + 1} name</span>
            <input
              required
              maxLength={100}
              value={x.label}
              onChange={(e) => extra(x.id, { label: e.target.value })}
            />
          </label>
          <MoneyField
            label={`Extra ${i + 1} non-drink value · USD`}
            value={x.amount}
            onChange={(amount) => extra(x.id, { amount })}
          />
          <label className="field">
            <span>Extra {i + 1} value source</span>
            <select
              value={x.source}
              onChange={(e) =>
                extra(x.id, { source: e.target.value as ExtraDraft["source"] })
              }
            >
              <option value="estimate">My estimate / allocated value</option>
              <option value="receipt">Itemized on my receipt</option>
            </select>
          </label>
        </div>
      ))}
      {draft.extras.length > 0 && (
        <p className="form-note">
          Beach Club passes can include drinks, food, and admission. Do not
          subtract the full open-bar pass price and also count its drinks here.
          Allocate only the non-drink portion; leave it blank if you do not know
          it yet.
        </p>
      )}
      <h3 className="form-subtitle">Your comparison</h3>
      {result ? (
        <PricingBreakdown pricing={result} />
      ) : (
        <p className="form-error" role="status">
          {problem}
        </p>
      )}
      <p className="footnote">
        The full amount paid is kept separately. Deductions are your allocation,
        not a refund or a verified standalone admission price. Menu values
        compare drinks only; package gratuities are a cost, with no assumed
        per-drink gratuity savings.
      </p>
    </section>
  );
}
