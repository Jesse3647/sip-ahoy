import { useState } from "react";
import { Check } from "lucide-react";
import { uid, parseMoney, type Sailing, type Traveler } from "../model";
import {
  PackagePricingEditor,
  pricingDraft,
  parsePricingDraft,
} from "../PackagePricing";
import { Field } from "../components/ui";

/** Inputs for TravelerForm. */
type TravelerFormProps = {
  /** Record being edited; omit to create a new record. */
  existing?: Traveler;
  /** Most recently added traveler on this sailing; copies package settings, never identity or name. */
  defaults?: Traveler;
  /** Active trip, including its ship namespace and valid dates. */
  sailing: Sailing;
  /** Disables submission while the parent persists changes. */
  busy: boolean;
  /** Receives the form result; the parent validates the journal, persists it, and closes the dialog. */
  onSave: (t: Traveler) => void;
};

/** Edits one traveler or creates an independent copy of the previous traveler’s package settings. */
export function TravelerForm({
  existing,
  defaults,
  sailing,
  busy,
  onSave,
}: TravelerFormProps) {
  // Defaults seed package values only; name, ID, and avatar below belong to the new traveler.
  const template = existing ?? defaults;
  const [hasPackage, setHasPackage] = useState(template?.hasPackage ?? false);
  const [errorMessage, setErr] = useState("");
  const [pricing, setPricing] = useState(() => pricingDraft(template, sailing));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
          onSave({
            id: existing?.id ?? uid(),
            sailingId: sailing.id,
            name: String(formData.get("name")).trim(),
            color:
              existing?.color ??
              ["#dba18e", "#8ab3ad", "#ceb46e", "#a8abd0"][
                Math.floor(Math.random() * 4)
              ],
            hasPackage,
            dailyCostCents: null,
            packagePricing: hasPackage ? parsePricingDraft(pricing) : undefined,
            limitCents:
              hasPackage && formData.get("limit")
                ? parseMoney(String(formData.get("limit")))
                : null,
          });
        } catch (e) {
          setErr((e as Error).message);
        }
      }}
    >
      {errorMessage && (
        <p role="alert" className="form-error">
          {errorMessage}
        </p>
      )}
      {!existing && defaults && (
        <p className="form-note">
          Package settings copied from {defaults.name}. Edit them as needed.
        </p>
      )}
      <Field label="Traveler name">
        <input
          name="name"
          required
          maxLength={100}
          placeholder="What should we call you?"
          defaultValue={existing?.name}
        />
      </Field>
      <label className="check-field">
        <input
          type="checkbox"
          checked={hasPackage}
          onChange={(e) => setHasPackage(e.target.checked)}
        />
        <span>This traveler has a drink package</span>
      </label>
      {hasPackage && (
        <>
          <PackagePricingEditor
            value={pricing}
            onChange={setPricing}
            sailing={sailing}
          />
          <Field label="Maximum covered per drink · USD (optional)">
            <input
              name="limit"
              inputMode="decimal"
              placeholder="Blank = full eligible menu price"
              defaultValue={
                template?.limitCents == null
                  ? ""
                  : (template.limitCents / 100).toFixed(2)
              }
            />
          </Field>
          <p className="form-note">
            Editing package pricing updates comparisons, without changing the
            coverage or prices recorded on past drink logs.
          </p>
        </>
      )}
      <button className="button primary full" disabled={busy}>
        Save traveler <Check size={16} />
      </button>
    </form>
  );
}
