import { useEffect, useRef, useState } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
const displayModes = [
  "standalone",
  "minimal-ui",
  "fullscreen",
  "window-controls-overlay",
];
const inAppWindow = () =>
  (navigator as Navigator & { standalone?: boolean }).standalone === true ||
  displayModes.some(
    (mode) => window.matchMedia(`(display-mode: ${mode})`).matches,
  );

/** Captures a one-use browser install prompt; never treats an ordinary tab as proof of installation. */
export function useInstallApp() {
  const [installed, setInstalled] = useState(inAppWindow);
  const [promptEvent, setPromptEvent] = useState<InstallPrompt | null>(null);
  const [status, setStatus] = useState<
    "idle" | "prompting" | "accepted" | "dismissed" | "error"
  >("idle");
  const installing = useRef(false);
  const installationObserved = useRef(false);
  useEffect(() => {
    const modes = displayModes.map((mode) =>
      window.matchMedia(`(display-mode: ${mode})`),
    );
    const update = () =>
      setInstalled(installationObserved.current || inAppWindow());
    const ready = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPrompt);
      setStatus("idle");
    };
    const complete = () => {
      installationObserved.current = true;
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", ready);
    window.addEventListener("appinstalled", complete);
    modes.forEach((mode) => mode.addEventListener("change", update));
    return () => {
      window.removeEventListener("beforeinstallprompt", ready);
      window.removeEventListener("appinstalled", complete);
      modes.forEach((mode) => mode.removeEventListener("change", update));
    };
  }, []);
  const install = async () => {
    if (!promptEvent || installed || installing.current) return;
    installing.current = true;
    setStatus("prompting");
    // A captured prompt cannot be reused, even after the user dismisses it.
    setPromptEvent(null);
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      setStatus(choice.outcome);
    } catch {
      setStatus("error");
    } finally {
      installing.current = false;
    }
  };
  return { installed, canPrompt: !!promptEvent, status, install };
}
