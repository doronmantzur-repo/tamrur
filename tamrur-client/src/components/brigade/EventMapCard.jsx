// React

// External libraries
import { ActionIcon, Box, Stack, Text } from "@mantine/core";
import { IconLayoutSidebarRightCollapse, IconMap } from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import EvacuationMap from "./EvacuationMap";

// Styles

/**
 * Renders the event's situational map (location, landing pads, evacuation
 * routes) as its own full-width section. Not aerial-evac specific, it's the
 * general operational picture for the event.
 *
 * Foldable: `collapsed` swaps the full map for a slim strip, so the caller
 * can give the casualties/evacuation columns the width back once the map
 * isn't needed on screen. Folds toward the right (this card sits rightmost
 * in the row, per the app's RTL layout), open by default. Collapsed, the
 * whole strip is clickable to reopen — there's no separate button.
 *
 * @param {{ event: object, locations: Array<object>, forces: Array<object>, collapsed: boolean, onToggleCollapsed: () => void }} props
 * @returns {JSX.Element} The event map card.
 */
const EventMapCard = ({ event, locations, forces, collapsed, onToggleCollapsed }) => {
  if (collapsed) {
    return (
      <Box
        role="button"
        tabIndex={0}
        aria-label="הצג את מפת האירוע"
        title="הצג את מפת האירוע"
        onClick={onToggleCollapsed}
        onKeyDown={(evt) => {
          if (evt.key !== "Enter" && evt.key !== " ") return;
          evt.preventDefault();
          onToggleCollapsed();
        }}
        style={{ height: "100%", cursor: "pointer" }}
      >
        <DashboardCard titleContent={<span />} padding="xs" gap="sm" fullHeight>
          <Stack align="center" justify="center" style={{ flex: 1 }} gap="xs">
            <IconMap aria-hidden="true" size={20} stroke={1.6} color="var(--app-color-text-muted)" />
            <Text fz="xs" c="var(--app-color-text-muted)" style={{ writingMode: "vertical-rl" }}>
              מפת אירוע
            </Text>
          </Stack>
        </DashboardCard>
      </Box>
    );
  }

  const toggleButton = (
    <ActionIcon
      aria-label="הסתר את מפת האירוע"
      title="הסתר את מפת האירוע"
      variant="subtle"
      size="lg"
      onClick={onToggleCollapsed}
      styles={{ root: { color: "var(--app-color-text-muted)" } }}
    >
      <IconLayoutSidebarRightCollapse size={24} stroke={1.8} />
    </ActionIcon>
  );

  return (
    <DashboardCard title="מפת אירוע" headerExtra={toggleButton} padding="md" gap="sm" fullHeight>
      <EvacuationMap event={event} locations={locations} forces={forces} />
    </DashboardCard>
  );
};

export default EventMapCard;
