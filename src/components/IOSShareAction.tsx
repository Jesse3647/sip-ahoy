import { Share } from "lucide-react";
import type { useInstallApp } from "../useInstallApp";

/** Opens the native share sheet without promising an installation-only action. */
export function IOSShareAction({
  installation,
}: {
  installation: ReturnType<typeof useInstallApp>;
}) {
  if (!installation.canShare || installation.installed) return null;
  return (
    <button
      className="button primary"
      disabled={installation.shareStatus === "sharing"}
      onClick={installation.openShare}
    >
      <Share size={18} />
      {installation.shareStatus === "sharing" ? "Opening Share…" : "Open Share"}
    </button>
  );
}

export function IOSShareFeedback({
  installation,
}: {
  installation: ReturnType<typeof useInstallApp>;
}) {
  if (!installation.canShare || installation.installed) return null;
  return (
    <p
      className="install-note"
      role={installation.shareStatus === "error" ? "alert" : undefined}
    >
      {installation.shareStatus === "error"
        ? "Couldn’t open Share. Use Safari’s own Share button, then Add to Home Screen."
        : "If Add to Home Screen isn’t listed, use Safari’s own Share button instead."}
    </p>
  );
}
