export type SessionSeedInput = {
  sessionId: string | null;
  lastUserText?: string | null;
  startedAt?: number | null;
  lastActivityAt?: number | null;
  last?: { role?: string; kind?: string; text?: string; ts?: number };
};

export type LiveMessage = {
  id?: string;
  role?: string;
  kind?: string;
  text?: string;
  html?: string;
  ts?: number;
  pending?: boolean;
  seed?: boolean;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch]!);
}

function normText(value?: string | null) {
  return (value || "").replace(/\s+/g, " ").trim();
}

export function seedMessageForSession(session: SessionSeedInput): LiveMessage | null {
  const sid = session.sessionId;
  const last = session.last;
  const lastIsProse =
    last?.kind === "text" && (last.role === "assistant" || last.role === "user") && !!last.text;
  const text = normText(lastIsProse ? last.text : session.lastUserText || "");
  if (!sid || !text) return null;
  const role = lastIsProse && last.role === "assistant" ? "assistant" : "user";
  const ts = (lastIsProse ? last.ts : null) ?? session.lastActivityAt ?? session.startedAt ?? Date.now();
  return {
    id: `seed-${sid}-${ts}-${role}`,
    role,
    kind: "text",
    text,
    html: escapeHtml(text).replace(/\n/g, "<br>"),
    ts,
    seed: true,
  };
}

function sameSeed(a: LiveMessage[] | undefined, b: LiveMessage | null): boolean {
  if (!a?.length || !b) return !a?.length && !b;
  return a.length === 1 && !!a[0].seed && a[0].id === b.id && a[0].text === b.text;
}

export function mergeSessionListSeeds<T extends LiveMessage>(
  previous: Record<string, T[]>,
  sessions: SessionSeedInput[],
): Record<string, T[]> {
  let changed = false;
  const next: Record<string, T[]> = {};

  for (const session of sessions) {
    const sid = session.sessionId;
    if (!sid) continue;

    const current = previous[sid];
    if (current?.some((message) => !message.seed)) {
      next[sid] = current;
      continue;
    }

    const seed = seedMessageForSession(session) as T | null;
    if (seed) {
      next[sid] = sameSeed(current, seed) ? current! : [seed];
    } else {
      next[sid] = current?.length ? [] : (current ?? []);
    }
    if (next[sid] !== current) changed = true;
  }

  for (const sid of Object.keys(previous)) {
    if (!(sid in next)) {
      changed = true;
      break;
    }
  }

  return changed ? next : previous;
}
