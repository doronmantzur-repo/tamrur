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
 * @param {{ event: object, locations: Array<object>, forces: Array<object> }} props
 * @returns {JSX.Element} The event map card.
 */
const EventMapCard = ({ event, locations, forces }) => {
  return (
    <DashboardCard title="מפת אירוע" padding="md" gap="sm" fullHeight>
      <EvacuationMap event={event} locations={locations} forces={forces} />
    </DashboardCard>
  );
};

export default EventMapCard;
