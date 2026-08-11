// React
import { useState } from "react";

// External libraries
import { Button, PasswordInput, Select, Text, TextInput } from "@mantine/core";
import { IconMail, IconLock, IconLogin } from "@tabler/icons-react";
import { useDispatch } from "react-redux";

// Internal application modules
import AuthFormCard from "../AuthFormCard";
import { registerUser } from "../../../features/auth/authSlice";

// Styles

/**
 * Renders the Tamrur signup form.
 *
 * @returns {JSX.Element} The signup form.
 */
const SignUpForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const dispatch = useDispatch();

  /**
   * Handles signup form submission.
   *
   * Authentication will be connected when the backend is implemented.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - The form submission event.
   * @returns {void}
   */
  const handleSubmit = (event) => {
    event.preventDefault();
    dispatch(registerUser({ role, email, password }));
  };

  const rolesOptions = [
    { value: "brigade", label: "חטיבה" },
    { value: "medic", label: "צוות רפואי" },
    { value: "airforce", label: "חיל האוויר" },
  ];

  return (
    <AuthFormCard handleSubmit={handleSubmit}>
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

      <TextInput
        id="email"
        name="email"
        label="מייל"
        placeholder="הזן מייל"
        value={email}
        onChange={(event) => setEmail(event.currentTarget.value)}
        leftSection={<IconMail size={20} stroke={1.8} />}
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
      <Select
        label="תפקיד"
        placeholder="בחר תפקיד"
        data={rolesOptions}
        value={role}
        onChange={(value) => setRole(value)}
        defaultValue="React"
        clearable
        clearSectionMode="clear"
        searchable
        withAlignedLabels
        checkIconPosition="right"
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
        // rightSection={<CaretDownIcon size={16} />}
        comboboxProps={{ shadow: "md" }}
      />
      <PasswordInput
        id="password"
        name="password"
        label="סיסמה"
        placeholder="הזן סיסמה"
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
        הירשם למערכת
      </Button>
      <Text ta="center" c="var(--app-color-text-muted)" fz="md" lh={1.5}>
        כבר רשום?{" "}
        <Text
          component="a"
          href="/login"
          inherit
          fw={700}
          c="var(--app-color-primary)"
          style={{
            textDecoration: "underline",
            textDecorationColor:
              "color-mix(in srgb, var(--app-color-primary) 30%, transparent)",
            textUnderlineOffset: "4px",
          }}
        >
          התחבר כאן
        </Text>
      </Text>
    </AuthFormCard>
  );
};

export default SignUpForm;
