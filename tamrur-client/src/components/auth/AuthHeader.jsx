// React
import { memo } from "react";

// External libraries
import { Box, Stack, Text, Title } from "@mantine/core";

// Internal application modules

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
          border: `2px solid var(--app-color-primary)`,
          borderRadius: "50%",
          backgroundColor: "var(--app-color-surface)",
          boxShadow: `0 0 30px rgba(197, 160, 89, 0.1)`,
          padding: theme.spacing.sm,
        })}
      />

      <Title
        order={1}
        c="var(--app-color-primary)"
        ta="center"
        fz="2rem"
        fw={700}
        lh={1.25}
      >
        תמרור
      </Title>

      <Text
        c="var(--app-color-text-muted)"
        ta="center"
        fz="0.75rem"
        fw={700}
        lh={1.33}
        lts="0.1em"
        tt="uppercase"
      >
        מערכת ניהול פינוי טקטית
      </Text>
    </Stack>
  );
};

export default memo(AuthHeader);
