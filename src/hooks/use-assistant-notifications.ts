import { useSonner } from "sonner";

import type { VigletAvatarState } from "../components/ui/viglet-avatar";

/**
 * useAssistantNotifications — the mascot's state, read off the toasts that are
 * already on screen.
 *
 * Every consumer reports its outcomes through this package's `Toaster`. If the
 * mascot needed a second call beside each `toast.success`, it would get one in
 * the places somebody remembered and nowhere else, and it would sit at idle
 * while a red toast slid past it. That failure does not look like a bug; it
 * looks like a mascot that does not react.
 *
 * So this reads rather than wraps. Nothing here patches `toast`, which means a
 * product calling sonner from a module that never imported this hook still moves
 * the mascot. It also means a toast cannot strand the avatar: the live list is
 * the truth, and an empty list is idle.
 */

/**
 * sonner's types, mapped onto the mascot's. The avatar's states were named for
 * these in the first place, so this is a lookup and not a translation.
 *
 * `warning` and `info` both land on `attention`: the mascot has one gesture for
 * "something arrived that you have not looked at", and splitting it would be a
 * distinction only the palette could make and nobody could read.
 */
const STATE_BY_TYPE: Record<string, VigletAvatarState> = {
  loading: "working",
  success: "success",
  error: "error",
  warning: "attention",
  info: "attention",
};

/**
 * Which state wins when several toasts are up. Work in progress outranks an
 * outcome, because the outcome has already been read and the work has not; and
 * a failure outranks a success, because it is the one that needs somebody.
 */
const PRECEDENCE: VigletAvatarState[] = ["working", "error", "attention", "success"];

export interface AssistantNotifications {
  /** What to hand `VigletAssistant` or `VigletAvatar` as `state`. */
  state: VigletAvatarState;
  /**
   * The title of the toast the state came from, when it is a string — the
   * sentence the collapsed dock can type beside itself. A toast rendered as JSX
   * has no sentence to lift, so this is null rather than a guess.
   */
  caption: string | null;
  /** Bump this into `activity` to make the mascot react as toasts arrive. */
  activity: number;
}

/** A toast's title is a ReactNode, and only a plain string can be spoken. */
function titleOf(toast: { title?: unknown }): string | null {
  const { title } = toast;
  if (typeof title === "string") return title;
  if (typeof title === "number") return String(title);
  return null;
}

export function useAssistantNotifications(): AssistantNotifications {
  const { toasts } = useSonner();

  // `useSonner` drops a toast when it is dismissed, so the returning-to-idle
  // case is already covered. This is the other one: a toast object that carries
  // `delete` is on its way out, and counting it would hold the mascot a beat
  // past the notification it belongs to.
  const live = toasts.filter((toast) => !toast.delete);

  let state: VigletAvatarState = "idle";
  let caption: string | null = null;

  for (const candidate of PRECEDENCE) {
    const match = live.find((toast) => STATE_BY_TYPE[toast.type ?? ""] === candidate);
    if (match) {
      state = candidate;
      caption = titleOf(match);
      break;
    }
  }

  // The count is the signal: it changes when a toast arrives and when one goes,
  // which is what the avatar's flare is for. It is deliberately not the state —
  // three successes in a row are three flares and one state.
  return { state, caption, activity: live.length };
}
