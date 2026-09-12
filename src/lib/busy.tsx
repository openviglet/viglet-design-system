import type { MouseEvent, MouseEventHandler } from "react";

/**
 * VDS143 — busy is not disabled.
 *
 * A button marked pending with `disabled` leaves the tab order the moment it is
 * pressed, so focus falls back to the document body just as the outcome is
 * announced, and a keyboard or screen-reader user loses their place on every save.
 *
 * So a control that is loading, or unavailable for now (a form with nothing to
 * save yet), says so with `aria-busy` and `aria-disabled`, stays focusable, and
 * ignores activation. Cancelling the click also cancels a form's submission,
 * the implicit one an Enter in a field triggers included, so a second press
 * never submits twice. Only a control that is genuinely unavailable uses the
 * `disabled` attribute.
 */
export function busyControl<T extends HTMLElement>(
  loading: boolean,
  ariaDisabled: unknown,
  onClick: MouseEventHandler<T> | undefined,
) {
  const inert = loading || ariaDisabled === true || ariaDisabled === "true";
  return {
    inert,
    props: {
      "aria-busy": loading ? ("true" as const) : undefined,
      "aria-disabled": inert ? ("true" as const) : undefined,
      onClick: (event: MouseEvent<T>) => {
        if (inert) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        onClick?.(event);
      },
    },
  };
}

/** The spinner a busy control shows beside its label. */
export function BusyGlyph() {
  return (
    <svg aria-hidden="true" className="size-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
