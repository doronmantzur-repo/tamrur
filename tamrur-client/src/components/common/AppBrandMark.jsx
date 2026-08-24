// React
import { memo } from "react";

// External libraries
import { Box, Stack, Text, Title } from "@mantine/core";

// Internal application modules
import { APP_NAME, APP_SUBTITLE } from "../../constants/branding";

// Styles

/**
 * The app's mark (icon + name + subtitle) sized for a page's own toolbar
 * row rather than `AuthHeader`'s full auth-page size (128px icon, 2rem
 * title) — same shield+pulse icon, shrunk down, for pages dense with their
 * own content underneath (the brigade board, the airforce queue).
 *
 * @returns {JSX.Element} The compact brand mark.
 */
const AppBrandMark = () => {
  return (
    <Stack align="center" gap={2}>
      <Box
        aria-hidden="true"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "3.5rem",
          height: "3.5rem",
          flexShrink: 0,
          border: "2px solid var(--app-color-primary)",
          borderRadius: "50%",
          backgroundColor: "var(--app-color-surface)",
          boxShadow: "0 0 18px rgba(197, 160, 89, 0.12)",
        }}
      >
        <svg width="30" height="30" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M50,10 L83,23 L83,51 C83,73 68,88 50,95 C32,88 17,73 17,51 L17,23 Z"
            stroke="var(--app-color-primary)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="27,52 39,52 47,35 55,69 63,52 75,52"
            stroke="var(--app-color-primary)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Box>

      <Title order={2} c="var(--app-color-primary)" ta="center" fz="1.15rem" fw={700} lh={1.2} style={{ whiteSpace: "nowrap" }}>
        {APP_NAME}
      </Title>

      <Text c="var(--app-color-text-muted)" ta="center" fz="0.62rem" fw={600} lh={1.3} lts="0.04em">
        {APP_SUBTITLE}
      </Text>
    </Stack>
  );
};

export default memo(AppBrandMark);
