// React
import { useCallback } from "react";

// External libraries
import { useDispatch } from "react-redux";

// Internal application modules
import { updateCasualty } from "../../features/casualties/casualtiesSlice";

// Styles

/**
 * Compares a pending cell value against what is already stored, so clicking
 * into a cell and straight back out doesn't fire a pointless write.
 *
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean} Whether the two values would store identically.
 */
export function isSameValue(a, b) {
  if (Array.isArray(a) || Array.isArray(b)) {
    return JSON.stringify(a ?? []) === JSON.stringify(b ?? []);
  }

  return (a ?? null) === (b ?? null);
}

/**
 * Returns a writer that saves a single column of one casualty.
 *
 * The update route writes exactly the keys it is given, so a cell can send its
 * own column alone and leave the rest of the row untouched — which is what
 * keeps per-cell editing safe while another medic works the same casualty.
 *
 * @param {string} casualtyId
 * @returns {(column: string, value: unknown, current: unknown) => void}
 */
export function useCellSave(casualtyId) {
  const dispatch = useDispatch();

  return useCallback(
    (column, value, current) => {
      if (isSameValue(value, current)) return;

      dispatch(updateCasualty({ id: casualtyId, fields: { [column]: value } }))
        .unwrap()
        // The failure is kept in rowErrorById and flagged on the row — swallow
        // it here so it isn't reported as an unhandled rejection.
        .catch(() => {});
    },
    [dispatch, casualtyId],
  );
}
