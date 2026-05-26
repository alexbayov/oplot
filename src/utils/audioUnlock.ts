export function initAudioUnlock(getContext: () => AudioContext | null): void {
  if (typeof document === "undefined") return;

  let unlocked = false;

  const handler = (): void => {
    if (unlocked) return;
    unlocked = true;

    document.removeEventListener("pointerdown", handler);
    document.removeEventListener("touchstart", handler);

    const ctx = getContext();
    if (ctx && ctx.state === "suspended") {
      void ctx.resume();
    }
  };

  document.addEventListener("pointerdown", handler);
  document.addEventListener("touchstart", handler);
}
