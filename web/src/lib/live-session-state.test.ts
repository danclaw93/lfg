import { describe, expect, test } from "bun:test";

import {
  mergeSessionListSeeds,
  type LiveMessage,
  type SessionSeedInput,
} from "./live-session-state";

describe("live session list seeds", () => {
  test("updates a seed-only session when the list payload advances to an assistant reply", () => {
    const sid = "session-1";
    const initial: SessionSeedInput = {
      sessionId: sid,
      lastUserText: "fix the UI",
      last: { role: "user", kind: "text", text: "fix the UI", ts: 100 },
      lastActivityAt: 100,
    };
    const replied: SessionSeedInput = {
      ...initial,
      last: { role: "assistant", kind: "text", text: "I found the display bug.", ts: 200 },
      lastActivityAt: 200,
    };

    const first = mergeSessionListSeeds({}, [initial]);
    const next = mergeSessionListSeeds(first, [replied]);

    expect(next[sid]).toHaveLength(1);
    expect(next[sid][0]).toMatchObject({
      role: "assistant",
      kind: "text",
      text: "I found the display bug.",
      seed: true,
    });
  });

  test("does not overwrite real streamed messages with list seeds", () => {
    const sid = "session-1";
    const streamed: LiveMessage = {
      id: "real-1",
      role: "assistant",
      kind: "text",
      text: "streamed transcript wins",
      ts: 150,
    };
    const session: SessionSeedInput = {
      sessionId: sid,
      last: { role: "assistant", kind: "text", text: "list summary", ts: 200 },
      lastActivityAt: 200,
    };

    const next = mergeSessionListSeeds({ [sid]: [streamed] }, [session]);

    expect(next[sid]).toEqual([streamed]);
  });
});
