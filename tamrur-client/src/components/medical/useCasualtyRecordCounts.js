// React
import { useMemo } from "react";

// External libraries
import { useSelector } from "react-redux";

// Internal application modules

// Styles

/**
 * Counts the treatment and vitals records logged against one casualty.
 *
 * Both live in the store keyed by event, so the counts update on their own when
 * a record is added, edited or deleted — the panel and the row's counter badge
 * never need telling.
 *
 * @param {string} eventId
 * @param {string} casualtyId
 * @returns {{treatments: number, vitals: number, drugs: number, total: number}}
 */
export function useCasualtyRecordCounts(eventId, casualtyId) {
  const eventTreatments = useSelector((state) => state.treatments.byEventId[eventId]);
  const eventVitals = useSelector((state) => state.vitals.byEventId[eventId]);
  const eventDrugs = useSelector((state) => state.drugs.byEventId[eventId]);

  return useMemo(() => {
    // The treatment/vitals foreign key is still spelled "injury-id" — the
    // casualties rename was identifier-level and left the columns alone.
    const treatments = (eventTreatments || []).filter((r) => r["injury-id"] === casualtyId).length;
    const vitals = (eventVitals || []).filter((r) => r["injury-id"] === casualtyId).length;

    // The drugs table was added later and uses snake_case keys throughout.
    const drugs = (eventDrugs || []).filter((r) => r.casualty_id === casualtyId).length;

    return { treatments, vitals, drugs, total: treatments + vitals + drugs };
  }, [eventTreatments, eventVitals, eventDrugs, casualtyId]);
}
