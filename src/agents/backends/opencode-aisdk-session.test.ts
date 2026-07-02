import { describe, expect, test } from "bun:test";

import { classifyOpencodeStreamError } from "./opencode-aisdk-session.ts";

describe("classifyOpencodeStreamError", () => {
  test("classifies interactive question events separately", () => {
    expect(classifyOpencodeStreamError(new Error("question.asked is not yet mapped"))).toBe("question");
  });

  test("classifies auth, access, and invalid-model errors as fatal", () => {
    expect(classifyOpencodeStreamError(Object.assign(new Error("Unauthorized"), { statusCode: 401 }))).toBe("fatal");
    expect(classifyOpencodeStreamError(Object.assign(new Error("forbidden"), { statusCode: 403 }))).toBe("fatal");
    expect(classifyOpencodeStreamError(new Error("No such model: openai/nope"))).toBe("fatal");
    expect(
      classifyOpencodeStreamError({
        message: "provider rejected request",
        data: { errorType: "NoSuchModelError" },
      }),
    ).toBe("fatal");
  });

  test("classifies retryable provider failures as recoverable", () => {
    expect(classifyOpencodeStreamError(Object.assign(new Error("timeout"), { isRetryable: true }))).toBe(
      "recoverable",
    );
    expect(classifyOpencodeStreamError(Object.assign(new Error("rate limited"), { statusCode: 429 }))).toBe(
      "recoverable",
    );
    expect(classifyOpencodeStreamError(Object.assign(new Error("bad gateway"), { statusCode: 502 }))).toBe(
      "recoverable",
    );
    expect(classifyOpencodeStreamError(new Error("Provider response headers timed out after 10000ms"))).toBe(
      "recoverable",
    );
  });

  test("classifies unknown stream errors as unknown", () => {
    expect(classifyOpencodeStreamError(new Error("unexpected provider stream event"))).toBe("unknown");
  });
});
