import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";

const fakeDocument = () => {
  const handlers = new Map<string, Set<(e: unknown) => void>>();
  return {
    addEventListener: (type: string, handler: (e: unknown) => void) => {
      const set = handlers.get(type) ?? new Set();
      set.add(handler);
      handlers.set(type, set);
    },
    removeEventListener: (type: string, handler: (e: unknown) => void) => {
      handlers.get(type)?.delete(handler);
    },
    dispatch: (type: string, event?: unknown) => {
      handlers.get(type)?.forEach((h) => h(event));
    },
  };
};

describe("audioUnlock", () => {
  let doc: ReturnType<typeof fakeDocument>;

  beforeEach(() => {
    doc = fakeDocument();
    vi.stubGlobal("document", doc);
    vi.stubGlobal("PointerEvent", class {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("first gesture resumes suspended AudioContext", async () => {
    const mockCtx = { state: "suspended", resume: vi.fn() } as unknown as AudioContext;
    const getContext = vi.fn().mockReturnValue(mockCtx);

    const { initAudioUnlock } = await import("../../utils/audioUnlock");
    initAudioUnlock(getContext);

    expect(getContext).not.toHaveBeenCalled();

    doc.dispatch("pointerdown");
    expect(getContext).toHaveBeenCalledTimes(1);
    expect(mockCtx.resume).toHaveBeenCalledTimes(1);
  });

  test("second gesture is no-op (idempotent)", async () => {
    const mockCtx = { state: "suspended", resume: vi.fn() } as unknown as AudioContext;
    const getContext = vi.fn().mockReturnValue(mockCtx);

    const { initAudioUnlock } = await import("../../utils/audioUnlock");
    initAudioUnlock(getContext);

    doc.dispatch("pointerdown");
    expect(mockCtx.resume).toHaveBeenCalledTimes(1);

    doc.dispatch("pointerdown");
    expect(mockCtx.resume).toHaveBeenCalledTimes(1);
  });

  test("does not resume running AudioContext", async () => {
    const mockCtx = { state: "running", resume: vi.fn() } as unknown as AudioContext;
    const getContext = vi.fn().mockReturnValue(mockCtx);

    const { initAudioUnlock } = await import("../../utils/audioUnlock");
    initAudioUnlock(getContext);

    doc.dispatch("pointerdown");
    expect(mockCtx.resume).not.toHaveBeenCalled();
  });
});
