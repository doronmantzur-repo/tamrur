// React

// External libraries
import { Box, Group, Paper, Stack, Title } from "@mantine/core";

// Internal application modules

// Styles

/**
 * Renders a dashboard panel card matching the app's auth-form-card styling
 * (surface background, border, top gold accent bar).
 *
 * @param {{
 *   title: string,
 *   headerExtra?: React.ReactNode,
 *   children: React.ReactNode,
 *   padding?: string,
 *   gap?: string,
 * }} props
 * @returns {JSX.Element} The dashboard card.
 */
const DashboardCard = ({ title, headerExtra, children, padding = "lg", gap = "md" }) => {
  return (
    <Paper
      radius="sm"
      p={padding}
      withBorder
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: "var(--app-color-surface)",
        borderColor: "var(--app-color-border)",
      }}
    >
      <Box
        aria-hidden="true"
        style={{
          position: "absolute",
          insetInline: 0,
          top: 0,
          height: "4px",
          backgroundColor: "var(--app-color-primary)",
        }}
      />

      <Stack gap={gap} pt="xs">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Title order={2} fz="lg" fw={700} c="var(--app-color-text)">
            {title}
          </Title>
          {headerExtra}
        </Group>

        {children}
      </Stack>
    </Paper>
  );
};

export default DashboardCard;
