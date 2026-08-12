// React

// External libraries

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import EvacuationMap from "./EvacuationMap";

// Styles

/**
 * Renders the event's situational map (location, landing pads, evacuation
 * routes) as its own full-width section. Not aerial-evac specific, it's the
 * general operational picture for the event.
 *
 * @param {{ event: object, landingPads: Array<object>, evacuations: Array<object> }} props
 * @returns {JSX.Element} The event map card.
 */
const EventMapCard = ({ event, landingPads, evacuations }) => {
  return (
    <DashboardCard title="מפת אירוע" padding="md" gap="sm">
      <EvacuationMap event={event} landingPads={landingPads} evacuations={evacuations} />
    </DashboardCard>
  );
};

export default EventMapCard;
