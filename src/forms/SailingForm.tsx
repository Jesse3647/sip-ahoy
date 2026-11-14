import { useState } from "react";
import { ShipArtwork, ShipArtworkCredit } from "../components/ShipArtwork";
import { ArrowRight } from "lucide-react";
import { uid, type Sailing } from "../model";
import { royalCaribbeanShips } from "../ships";
import { Field } from "../components/ui";

/** Inputs for SailingForm. */
type SailingFormProps = {
  /** Record being edited; omit to create a new record. */
  existing?: Sailing;
  /** Disables submission while the parent persists changes. */
  busy: boolean;
  /** Receives the form result; the parent validates the journal, persists it, and closes the dialog. */
  onSave: (s: Sailing) => void;
};

/** Creates or edits a trip while keeping an existing ship/catalog association fixed. */
export function SailingForm({ existing, busy, onSave }: SailingFormProps) {
  const [ship, setShip] = useState(existing?.ship ?? "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSave({
          id: existing?.id ?? uid(),
          shipId: existing?.shipId ?? uid(),
          name: String(formData.get("name")).trim(),
          ship: existing?.ship ?? String(formData.get("ship")).trim(),
          start: String(formData.get("start")),
          end: String(formData.get("end")),
          currency: "USD",
        });
      }}
    >
      <Field label="Sailing name">
        <input
          name="name"
          placeholder="Caribbean sailing"
          defaultValue={existing?.name}
          required
          maxLength={100}
        />
      </Field>
      <Field label="Ship">
        <select
          name="ship"
          value={ship}
          onChange={(event) => setShip(event.target.value)}
          required
          disabled={!!existing}
        >
          <option value="" disabled>
            Select your ship
          </option>
          {existing &&
            !royalCaribbeanShips.some((ship) => ship === existing.ship) && (
              <option value={existing.ship}>
                {existing.ship} (saved sailing)
              </option>
            )}
          {royalCaribbeanShips.map((ship) => (
            <option key={ship} value={ship}>
              {ship}
            </option>
          ))}
        </select>
      </Field>
      {ship && (
        <div className="sailing-ship-preview">
          <ShipArtwork ship={ship} />
          <ShipArtworkCredit />
        </div>
      )}
      {existing && (
        <p className="footnote">
          Create a new sailing for a different ship. Menus are shared across
          sailings on the same ship.
        </p>
      )}
      <div className="form-grid">
        <Field label="First day">
          <input
            type="date"
            name="start"
            required
            defaultValue={existing?.start}
          />
        </Field>
        <Field label="Last day (inclusive)">
          <input type="date" name="end" required defaultValue={existing?.end} />
        </Field>
      </div>
      <p className="form-note">
        New ships start with an editable example menu. A ship’s menus are shared
        across its sailings. Amounts are in USD.
      </p>
      <button className="button primary full" disabled={busy}>
        {busy ? "Saving…" : existing ? "Save sailing" : "Create sailing"}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
