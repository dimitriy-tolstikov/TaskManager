import { RRule, rrulestr } from "rrule";

export type RecurrenceKind = "none" | "daily" | "weekly" | "biweekly" | "monthly";

export const RECURRENCE_LABELS: Record<RecurrenceKind, string> = {
  none: "Не повторяется",
  daily: "Каждый день",
  weekly: "Каждую неделю",
  biweekly: "Каждые 2 недели",
  monthly: "Каждый месяц",
};

export const RECURRENCE_KINDS = Object.keys(RECURRENCE_LABELS) as RecurrenceKind[];

const KIND_TO_RRULE: Record<Exclude<RecurrenceKind, "none">, string> = {
  daily: "FREQ=DAILY",
  weekly: "FREQ=WEEKLY",
  biweekly: "FREQ=WEEKLY;INTERVAL=2",
  monthly: "FREQ=MONTHLY",
};

export function buildRruleString(kind: Exclude<RecurrenceKind, "none">): string {
  return KIND_TO_RRULE[kind];
}

/**
 * Next occurrence strictly after `anchor`, with the schedule anchored at `anchor`
 * itself: the stored RRULE has no DTSTART, so without re-anchoring rrule would
 * count occurrences from the parse time instead of the task's deadline.
 */
export function nextOccurrenceAfter(rruleString: string, anchor: Date): Date | null {
  // We only ever store FREQ/INTERVAL rules (see buildRruleString), so the
  // parsed options are narrowed to just those two fields.
  const { freq, interval } = rrulestr(rruleString).origOptions;
  const rule = new RRule({ freq: freq ?? RRule.DAILY, interval: interval ?? 1, dtstart: anchor });
  return rule.after(anchor, false);
}

export function recurrenceKindFromRrule(rruleString: string | null | undefined): RecurrenceKind {
  if (!rruleString) {
    return "none";
  }
  const { freq, interval } = rrulestr(rruleString).origOptions;
  if (freq === RRule.DAILY) {
    return "daily";
  }
  if (freq === RRule.WEEKLY) {
    return interval === 2 ? "biweekly" : "weekly";
  }
  if (freq === RRule.MONTHLY) {
    return "monthly";
  }
  return "none";
}
