// React

// External libraries
import { Box, Group, Paper, Stack, Title } from "@mantine/core";

// Internal application modules

// Styles

/**
 * Renders a dashboard panel card matching the app's auth-form-card styling
 * (surface background, border, top gold accent bar). `fullHeight` fills a
 * parent-provided height (e.g. a Grid.Col); `h` instead fixes the card's own
 * height. Either way, the content stack stretches to fill it, so a flex-grow
 * child (e.g. `flex: 1`) can center itself in the leftover space. Passing
 * `aside` adds a second column stretched (via CSS grid's default
 * `align-items: stretch`) to exactly match the height of the title row plus
 * `children` combined — it grows and shrinks with that content instead of a
 * fixed guess, and (per the app's RTL layout) renders on the visual left,
 * with the title/children column on the right.
 *
 * @param {{
 *   title: string,
 *   titleContent?: React.ReactNode,
 *   headerExtra?: React.ReactNode,
 *   headerAlign?: string,
 *   aside?: React.ReactNode,
 *   children: React.ReactNode,
 *   padding?: import("@mantine/core").StyleProp<import("@mantine/core").MantineSpacing>,
 *   gap?: string,
 *   fullHeight?: boolean,
 *   h?: string,
 * }} props
 * @returns {JSX.Element} The dashboard card.
 */
const DashboardCard = ({
  title,
  titleContent,
  headerExtra,
  headerAlign = "center",
  aside,
  children,
  padding = "lg",
  gap = "md",
  fullHeight = false,
  h,
}) => {
  const stretchContent = fullHeight || h !== undefined;

  const content = (
    <Stack gap={gap} pt={aside ? undefined : "xs"} style={stretchContent ? { flex: 1, minHeight: 0 } : undefined}>
      <Group justify="space-between" align={headerAlign} wrap="wrap" gap="sm">
        {titleContent ?? (
          <Title order={2} fz="lg" fw={700} c="var(--app-color-text)">
            {title}
          </Title>
        )}
        {headerExtra}
      </Group>

      {children}
    </Stack>
  );

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
        ...(fullHeight && { height: "100%" }),
        ...(h !== undefined && { height: h }),
        ...(stretchContent && { display: "flex", flexDirection: "column" }),
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

      {aside ? (
        <Box
          pt="xs"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "var(--mantine-spacing-sm)",
            ...(stretchContent && { flex: 1, minHeight: 0 }),
          }}
        >
          {content}
          {aside}
        </Box>
      ) : (
        content
      )}
    </Paper>
  );
};

export default DashboardCard;
