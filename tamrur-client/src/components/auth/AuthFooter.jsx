// React

// External libraries
import { Group, Stack, Text } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";

// Internal application modules

// Styles

/**
 * Renders the classified-system information displayed below the login form.
 *
 * @returns {JSX.Element} The login page footer.
 */
const AuthFooter = () => {
  return (
    <Stack align="center" gap="xs">
      <Group gap="xs" justify="center">
        <IconLock aria-hidden="true" size={16} stroke={1.8} />

        <Text
          c="var(--app-color-text-muted)"
          fz="xs"
          fw={700}
          lh={1.33}
          lts="0.1em"
        >
          מערכת מסווגת - גישה מורשית בלבד
        </Text>
      </Group>

      <Text
        c="var(--app-color-text-muted)"
        fz="xs"
        fw={700}
        lh={1.33}
        lts="0.1em"
        opacity={0.5}
      >
        גרסה 2.4.1 (MASCAL Protocol Active)
      </Text>
    </Stack>
  );
};

export default AuthFooter;
