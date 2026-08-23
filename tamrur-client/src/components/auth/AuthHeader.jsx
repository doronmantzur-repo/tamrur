// React
import { memo } from "react";

// External libraries
import { Box, Stack, Text, Title } from "@mantine/core";

// Internal application modules
import { APP_NAME, APP_SUBTITLE } from "../../constants/branding";

// Styles

/**
 * Renders the branding header for the Tamrur login/signup page.
 *
 * @returns {JSX.Element} The login page branding header.
 */
const AuthHeader = () => {
  return (
    <Stack align="center" gap="md">
      <Box
        aria-hidden="true"
        h={128}
        w={128}
        style={(theme) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `2px solid var(--app-color-primary)`,
          borderRadius: "50%",
          backgroundColor: "var(--app-color-surface)",
          boxShadow: `0 0 30px rgba(197, 160, 89, 0.1)`,
          padding: theme.spacing.sm,
        })}
      >
        {/* Echoes the shield already used for events on the brigade page
            (IconShieldHalfFilled) — the military/protection half of תמרו״ר —
            with a medical pulse trace crossing it for the "רפואית" half.
            Stroke-only, matching the Tabler icon language used everywhere
            else in the app. */}
        <svg width="72" height="72" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M50,10 L83,23 L83,51 C83,73 68,88 50,95 C32,88 17,73 17,51 L17,23 Z"
            stroke="var(--app-color-primary)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="27,52 39,52 47,35 55,69 63,52 75,52"
            stroke="var(--app-color-primary)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Box>

      <Title
        order={1}
        c="var(--app-color-primary)"
        ta="center"
        fz="2rem"
        fw={700}
        lh={1.25}
        style={{ whiteSpace: "nowrap" }}
      >
        {APP_NAME}
      </Title>

      {/* The expansion runs longer than the old tagline, so the letter-spacing
          is eased and a max width lets it wrap to two centred lines on a narrow
          screen instead of forcing the card wider. */}
      <Text
        c="var(--app-color-text-muted)"
        ta="center"
        fz="0.75rem"
        fw={700}
        lh={1.4}
        lts="0.06em"
        maw="18rem"
      >
        {APP_SUBTITLE}
      </Text>
    </Stack>
  );
};

export default memo(AuthHeader);
