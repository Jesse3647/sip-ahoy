import { useState } from "react";
import { ArrowDownToLine } from "lucide-react";
import { backup, csv, importBackup, type Data } from "../model";
import { download } from "../download";

/** Inputs for BackupForm. */
type BackupFormProps = {
  /** Complete current journal, used for export and replacement comparisons. */
  data: Data;
  /** Disables submission while the parent persists changes. */
  busy: boolean;
  /** Receives the previewed replacement journal only after the user chooses Replace. */
  onRestore: (d: Data) => void;
};

/** Exports the journal and previews validated JSON before requesting full replacement. */
export function BackupForm({ data, busy, onRestore }: BackupFormProps) {
  const [pending, setPending] = useState<Data | null>(null);
  const [errorMessage, setErr] = useState("");
  return (
    <div className="backup-form">
      <p>
        Keep a copy of your whole journal before changing devices. Backups
        include all sailings, travelers, menus, and logs.
      </p>
      <button
        className="button primary full"
        onClick={() =>
          download(
            backup(data),
            "application/json",
            "sipahoy-backup-" + new Date().toISOString().slice(0, 10) + ".json",
          )
        }
      >
        <ArrowDownToLine size={17} /> Export full JSON backup
      </button>
      <button
        className="button secondary full"
        onClick={() =>
          download(csv(data), "text/csv;charset=utf-8", "sipahoy-drinks.csv")
        }
      >
        <ArrowDownToLine size={17} /> Export drink log as CSV
      </button>
      <hr />
      <h3>Restore a journal</h3>
      <p className="footnote">
        JSON backups replace the complete journal on this device. Export your
        current journal first. CSV cannot be restored.
      </p>
      <input
        aria-label="Choose JSON backup"
        type="file"
        accept=".json,application/json"
        onChange={async (e) => {
          setPending(null);
          setErr("");
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            if (file.size > 5_000_000)
              throw new Error("Backup exceeds the 5 MB limit.");
            setPending(importBackup(await file.text()));
          } catch (e) {
            setErr((e as Error).message);
          }
        }}
      />
      {errorMessage && (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      )}
      {pending && (
        <div className="restore-preview">
          <strong>Backup ready to restore</strong>
          <p>
            {pending.sailings.length} sailings · {pending.travelers.length}{" "}
            travelers · {pending.entries.length} drinks
          </p>
          <p>
            This will replace {data.sailings.length} sailings and{" "}
            {data.entries.length} drinks currently saved.
          </p>
          <button
            className="button primary full"
            disabled={busy}
            onClick={() => onRestore(pending)}
          >
            Replace journal with this backup
          </button>
        </div>
      )}
      <p className="form-note">
        Stored privately in this browser. Clearing website data removes the
        journal. Nearby sharing is on the roadmap.
      </p>
    </div>
  );
}
