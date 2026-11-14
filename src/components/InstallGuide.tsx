import { useState } from "react";
import { Check, Download, Smartphone } from "lucide-react";
import { type useInstallApp } from "../useInstallApp";
import { isIOS } from "../useInstallApp";

type Platform = "ios" | "android" | "desktop" | "safari";
function currentPlatform(): Platform {
  const ua = navigator.userAgent;
  if (isIOS()) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (
    /Macintosh/i.test(ua) &&
    /Safari/i.test(ua) &&
    !/Chrome|Chromium|Edg|OPR/i.test(ua)
  )
    return "safari";
  return "desktop";
}
const guides: Record<
  Platform,
  { steps: string[]; url: string; source: string }
> = {
  ios: {
    steps: [
      "Open SipAhoy in Safari on your iPhone or iPad.",
      "Open the Share menu. It may be inside the More menu (•••).",
      "Choose Add to Home Screen. If you see Open as Web App, turn it on, then tap Add.",
    ],
    url: "https://support.apple.com/guide/iphone/bookmark-a-website-iph42ab2f3a7/ios",
    source: "Apple’s installation guide",
  },
  android: {
    steps: [
      "Open SipAhoy in Chrome on your Android device.",
      "Open the browser’s More menu (⋮). Choose Install and create shortcut, then Install. Some versions call this Install app or Add to Home screen.",
      "Confirm the installation, then launch SipAhoy from your home screen or app list.",
    ],
    url: "https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DAndroid",
    source: "Chrome’s installation guide",
  },
  desktop: {
    steps: [
      "Open SipAhoy in Chrome on your computer.",
      "Select the install icon in the address bar, or open More (⋮) → Cast, save, and share → Install page as app.",
      "Confirm Install, then launch SipAhoy from your computer’s app launcher.",
    ],
    url: "https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DDesktop",
    source: "Chrome’s installation guide",
  },
  safari: {
    steps: [
      "Open SipAhoy in Safari on your Mac.",
      "Open File → Add to Dock, or choose Add to Dock from the Share menu.",
      "Choose Add, then open SipAhoy from your Dock.",
    ],
    url: "https://support.apple.com/104996",
    source: "Apple’s installation guide",
  },
};

/** Gives manual installation steps even when a browser does not offer a native install prompt. */
export function InstallGuide({
  installation,
}: {
  installation: ReturnType<typeof useInstallApp>;
}) {
  const [platform, setPlatform] = useState<Platform>(currentPlatform);
  const { installed, canPrompt, status, install } = installation;
  const guide = guides[platform];
  if (installed)
    return (
      <div className="install-guide">
        <div className="install-intro">
          <Check size={28} />
          <div>
            <h3>You’re all set</h3>
            <p>
              SipAhoy is installed. Open it from your home screen or app
              launcher.
            </p>
          </div>
        </div>
      </div>
    );
  return (
    <div className="install-guide">
      <div className="install-intro">
        <img
          src={`${import.meta.env.BASE_URL}icon-192.png`}
          alt=""
          width="64"
          height="64"
        />
        <div>
          <h3>Your journal, one tap away</h3>
          <p>
            Add SipAhoy to your home screen or app launcher. No app store
            needed.
          </p>
        </div>
      </div>
      {(canPrompt || status === "prompting") && (
        <button
          className="button primary full"
          disabled={status === "prompting"}
          onClick={install}
        >
          <Download size={18} />
          {status === "prompting" ? "Waiting for your browser…" : "Install now"}
        </button>
      )}
      {status === "accepted" && (
        <p className="install-feedback" role="status">
          Installation requested. Open SipAhoy from your home screen or app
          launcher when it finishes.
        </p>
      )}
      {status === "dismissed" && (
        <p className="install-feedback" role="status">
          No problem. You can install later using your browser’s menu.
        </p>
      )}
      {status === "error" && (
        <p className="install-feedback" role="alert">
          The browser couldn’t open the installer. Use the steps below instead.
        </p>
      )}
      <label className="field">
        <span>Installation instructions for</span>
        <select
          value={platform}
          onChange={(event) => setPlatform(event.target.value as Platform)}
        >
          <option value="ios">iPhone or iPad</option>
          <option value="android">Android</option>
          <option value="desktop">Computer · Chrome</option>
          <option value="safari">Mac · Safari</option>
        </select>
      </label>
      <ol className="install-steps">
        {guide.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="install-note">
        <Smartphone size={18} />
        Viewing this inside another app? Open this page in the browser listed
        above first.
      </p>
      <p className="install-note">
        Before your trip, open the installed app online once so its offline
        files can finish loading.
      </p>
      <a
        className="install-source"
        href={guide.url}
        target="_blank"
        rel="noreferrer"
      >
        {guide.source} ↗
      </a>
    </div>
  );
}
