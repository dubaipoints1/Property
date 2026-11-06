/** Native reading/rail state, kept separate from the DOM for regression tests. */
export function currentReadingSection(tops: readonly number[], readingLine: number): number {
  if (!tops.length) return -1;
  let current = 0;
  for (let index = 0; index < tops.length; index++) {
    if (tops[index] <= readingLine) current = index;
    else break;
  }
  return current;
}

export function editorialRailBounds(scrollLeft: number, clientWidth: number, scrollWidth: number) {
  return {
    atStart: scrollLeft <= 2,
    atEnd: scrollLeft + clientWidth >= scrollWidth - 2,
    overflow: scrollWidth > clientWidth + 2,
  };
}

interface RailFocusTarget { focus(options: { preventScroll: boolean }): void; }
interface RailFocusButton extends RailFocusTarget { disabled: boolean; }

/** Hand off only control focus, before the caller hides/disables it. */
export function preserveEditorialRailFocus(
  bounds: ReturnType<typeof editorialRailBounds>,
  { active, hasControlFocus, previous, next, track }: {
    active: unknown;
    hasControlFocus: boolean;
    previous: RailFocusButton;
    next: RailFocusButton;
    track: RailFocusTarget;
  },
) {
  // A swipe, touch scroll or resize must never take focus from a story link
  // or anything outside these controls.
  if (!hasControlFocus) return;
  if (!bounds.overflow) {
    track.focus({ preventScroll: true });
  } else if (active === next && bounds.atEnd) {
    if (bounds.atStart) track.focus({ preventScroll: true });
    else {
      // An instant move can cross the whole rail while Previous is still
      // disabled from its start state. Enable the destination before focus.
      previous.disabled = false;
      previous.focus({ preventScroll: true });
    }
  } else if (active === previous && bounds.atStart) {
    if (bounds.atEnd) track.focus({ preventScroll: true });
    else {
      next.disabled = false;
      next.focus({ preventScroll: true });
    }
  }
}
