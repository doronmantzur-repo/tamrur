// External libraries
import { ActionIcon, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

/**
 * Dark/light theme toggle: a plain icon button that swaps between a sun and
 * moon glyph. Theme state and switching are Mantine's own
 * `useMantineColorScheme`.
 *
 * @returns {JSX.Element} The theme toggle button.
 */
const ThemeToggleButton = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <ActionIcon
      aria-label="החלף מצב תצוגה"
      title="החלף מצב תצוגה"
      variant="default"
      size={40}
      radius="xl"
      onClick={() => toggleColorScheme()}
      style={{
        backgroundColor: "var(--app-color-surface)",
        borderColor: "var(--app-color-border)",
        color: "var(--app-color-text)",
      }}
    >
      {isDark ? (
        <IconSun aria-hidden="true" size={20} stroke={1.8} />
      ) : (
        <IconMoon aria-hidden="true" size={20} stroke={1.8} />
      )}
    </ActionIcon>
  );
};

export default ThemeToggleButton;
