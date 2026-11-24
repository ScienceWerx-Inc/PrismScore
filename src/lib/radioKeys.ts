import type React from 'react';

/**
 * Keyboard behaviour for a custom role="radiogroup": arrows move and select,
 * Home/End jump to the ends, and focus follows the selection.
 */
export function handleRadioKeys(
  e: React.KeyboardEvent<HTMLElement>,
  index: number,
  count: number,
  select: (index: number) => void
) {
  let next = -1;
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (index + 1) % count;
  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (index - 1 + count) % count;
  else if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = count - 1;
  if (next < 0) return;
  e.preventDefault();
  select(next);
  const radios = e.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="radio"]');
  radios?.[next]?.focus();
}

/** Only one option is a tab stop: the checked one, or the first if none is checked. */
export function radioTabIndex(isChecked: boolean, index: number, anyChecked: boolean) {
  return isChecked || (!anyChecked && index === 0) ? 0 : -1;
}
