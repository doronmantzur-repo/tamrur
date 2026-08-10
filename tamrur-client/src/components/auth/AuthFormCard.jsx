// React

// External libraries
import { Paper, Stack } from "@mantine/core";

// Internal application modules

// Styles

/**
 * Renders the Tamrur auth form card.
 *
 * @returns {JSX.Element} The login form.
 */
const AuthFormCard = ({ handleSubmit, children }) => {
  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      radius="sm"
      p="xl"
      withBorder
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: "var(--app-color-surface)",
        borderColor: "var(--app-color-border)",
      }}
    >
      <Stack gap="md" pt="xs">
        {children}
      </Stack>
    </Paper>
  );
};

export default AuthFormCard;
