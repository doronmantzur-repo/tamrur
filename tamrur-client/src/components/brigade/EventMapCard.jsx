// React

// External libraries
import { ActionIcon, Stack, Text } from "@mantine/core";
import { IconLayoutSidebarRightCollapse, IconLayoutSidebarRightExpand, IconMap } from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import EvacuationMap from "./EvacuationMap";

// Styles

/**
 * Renders the event's situational map (location, landing pads, evacuation
 * routes) as its own full-width section. Not aerial-evac specific, it's the
 * general operational picture for the event.
 *
 * Foldable: `collapsed` swaps the full map for a slim strip with just an
 * expand button, so the caller can give the casualties/evacuation columns the
 * width back once the map isn't needed on screen. Folds toward the right
 * (this card sits rightmost in the row, per the app's RTL layout), open by
 * default.
 *
 * @param {{ event: object, locations: Array<object>, forces: Array<object>, collapsed: boolean, onToggleCollapsed: () => void }} props
 * @returns {JSX.Element} The event map card.
 */
const EventMapCard = ({ event, locations, forces, collapsed, onToggleCollapsed }) => {
  const toggleButton = (
    <ActionIcon
      aria-label={collapsed ? "הצג את מפת האירוע" : "הסתר את מפת האירוע"}
      title={collapsed ? "הצג את מפת האירוע" : "הסתר את מפת האירוע"}
      variant="subtle"
      size="lg"
      onClick={onToggleCollapsed}
      styles={{ root: { color: "var(--app-color-text-muted)" } }}
    >
      {collapsed ? (
        <IconLayoutSidebarRightExpand size={24} stroke={1.8} />
      ) : (
        <IconLayoutSidebarRightCollapse size={24} stroke={1.8} />
      )}
    </ActionIcon>
  );

  if (collapsed) {
    return (
      <DashboardCard
        titleContent={<span />}
        headerExtra={toggleButton}
        padding="xs"
        gap="sm"
        fullHeight
      >
        <Stack align="center" justify="center" style={{ flex: 1 }} gap="xs">
          <IconMap aria-hidden="true" size={20} stroke={1.6} color="var(--app-color-text-muted)" />
          <Text
            fz="xs"
            c="var(--app-color-text-muted)"
            style={{ writingMode: "vertical-rl" }}
          >
            מפת אירוע
          </Text>
        </Stack>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="מפת אירוע" headerExtra={toggleButton} padding="md" gap="sm" fullHeight>
      <EvacuationMap event={event} locations={locations} forces={forces} />
    </DashboardCard>
  );
};

export default EventMapCard;
