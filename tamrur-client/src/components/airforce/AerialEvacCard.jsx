// React

// External libraries
import { Badge } from "@mantine/core";
import { IconHelicopter } from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import { AERIAL_EVAC_COLOR_VARS, AERIAL_EVAC_LABELS } from "../../constants/aerialEvacStatus";

// Styles

/**
 * Renders a single event's aerial-evacuation request status.
 *
 * @param {{ event: object }} props
 * @returns {JSX.Element} The aerial evacuation status card.
 */
const AerialEvacCard = ({ event }) => {
  const aerialEvac = event["aerial-evac"];
  const color = AERIAL_EVAC_COLOR_VARS[aerialEvac] || "var(--app-color-text-muted)";

  return (
    <DashboardCard
      title={event.name || "אירוע ללא שם"}
      headerExtra={
        <Badge
          leftSection={<IconHelicopter size={12} />}
          styles={{
            root: {
              backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
              color,
            },
          }}
        >
          {AERIAL_EVAC_LABELS[aerialEvac] || aerialEvac}
        </Badge>
      }
    />
  );
};

export default AerialEvacCard;
