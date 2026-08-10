// React
import { useState } from "react";

// External libraries
import {
  Button,
  Checkbox,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconBadge, IconLock, IconLogin } from "@tabler/icons-react";

// Internal application modules

// Styles

/**
 * Renders the Tamrur login form.
 *
 * @returns {JSX.Element} The login form.
 */
function LoginForm() {
  const [personalId, setPersonalId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  /**
   * Handles login form submission.
   *
   * Authentication will be connected when the backend is implemented.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - The form submission event.
   * @returns {void}
   */
  function handleSubmit(event) {
    event.preventDefault();
  }

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
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          insetInline: 0,
          top: 0,
          height: "4px",
          backgroundColor: "var(--app-color-primary)",
        }}
      />

      <Stack gap="md" pt="xs">
        <TextInput
          id="personal-id"
          name="personal-id"
          label="מספר אישי"
          placeholder="הזן מספר אישי"
          value={personalId}
          onChange={(event) => setPersonalId(event.currentTarget.value)}
          leftSection={<IconBadge size={20} stroke={1.8} />}
          leftSectionPointerEvents="none"
          required
          dir="rtl"
          styles={{
            label: {
              color: "var(--app-color-text-muted)",
              marginBottom: "0.25rem",
            },
            input: {
              minHeight: "3rem",
              backgroundColor: "var(--app-color-background)",
              color: "var(--app-color-text)",
              borderColor: "var(--app-color-border)",
              fontFamily: 'ui-monospace, "SF Mono", "Consolas", monospace',
              "&:focus": {
                borderWidth: "2px",
                borderColor: "var(--app-color-primary)",
              },
            },
          }}
        />

        <PasswordInput
          id="password"
          name="password"
          label="סיסמה"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
          leftSection={<IconLock size={20} stroke={1.8} />}
          leftSectionPointerEvents="none"
          required
          dir="rtl"
          styles={{
            label: {
              color: "var(--app-color-text-muted)",
              marginBottom: "0.25rem",
            },
            input: {
              minHeight: "3rem",
              backgroundColor: "var(--app-color-background)",
              color: "var(--app-color-text)",
              borderColor: "var(--app-color-border)",
              fontFamily: 'ui-monospace, "SF Mono", "Consolas", monospace',
              "&:focus": {
                borderWidth: "px",
                borderColor: "var(--app-color-primary)",
              },
            },
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            paddingTop: "0.25rem",
          }}
        >
          <Checkbox
            id="remember-me"
            name="remember-me"
            label="זכור אותי"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.currentTarget.checked)}
            styles={{
              label: {
                color: "var(--app-color-text-muted)",
              },
              input: {
                backgroundColor: "var(--app-color-background)",
                borderColor: "var(--app-color-border)",
              },
            }}
          />

          <Text
            component="a"
            href="#"
            c="var(--app-color-primary)"
            fz="md"
            style={{
              textDecoration: "none",
            }}
          >
            שכחת סיסמה?
          </Text>
        </div>

        <Button
          type="submit"
          fullWidth
          leftSection={<IconLogin size={20} stroke={1.8} />}
          mih="3rem"
          radius="sm"
          mt="xs"
          styles={{
            root: {
              backgroundColor: "var(--app-color-primary)",
              color: "var(--app-color-primary-text)",
              boxShadow: "0 4px 14px rgba(197, 160, 89, 0.39)",
              "&:hover": {
                backgroundColor: "var(--app-color-primary-hover)",
              },
            },
          }}
        >
          התחבר למערכת
        </Button>
      </Stack>
    </Paper>
  );
}

export default LoginForm;
