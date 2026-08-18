// React
import { useState } from "react";

// External libraries
import {
  Box,
  Button,
  PasswordInput,
  Progress,
  Select,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconCheck,
  IconLock,
  IconLogin,
  IconMail,
  IconX,
} from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

// Internal application modules
import AuthFormCard from "../AuthFormCard";
import { registerUser } from "../../../features/auth/authSlice";
import { ROLE_HOME_ROUTES } from "../../../constants/roles";

// Styles

const PASSWORD_REQUIREMENTS = [
  { re: /^.{7,}$/, label: "לפחות 7 תווים" },
  { re: /[a-z]/, label: "אות קטנה (a-z)" },
  { re: /[A-Z]/, label: "אות גדולה (A-Z)" },
  { re: /[^A-Za-z0-9\s]/, label: "תו מיוחד (למשל !@#$%)" },
];

/**
 * @param {string} password
 * @returns {number} How many of PASSWORD_REQUIREMENTS the password satisfies.
 */
function countMetRequirements(password) {
  return PASSWORD_REQUIREMENTS.filter((requirement) =>
    requirement.re.test(password),
  ).length;
}

/**
 * @param {number} strength - Percentage 0-100.
 * @returns {string} A CSS color var matching how strong the password is.
 */
function getStrengthColor(strength) {
  if (strength === 100) return "var(--app-color-success)";
  if (strength > 50) return "var(--app-color-warning)";
  return "var(--app-color-error)";
}

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
  const navigate = useNavigate();
  const status = useSelector((state) => state.auth.status);
  const isSubmitting = status === "loading";

  const metRequirementsCount = countMetRequirements(password);
  const passwordStrength =
    (metRequirementsCount / PASSWORD_REQUIREMENTS.length) * 100;
  const isPasswordStrong = passwordStrength === 100;

  /**
   * Handles signup form submission. Blocked until the password satisfies
   * every entry in PASSWORD_REQUIREMENTS (the submit button is also
   * disabled for this, this is a guard against e.g. an Enter-key submit).
   * Redirects to the new user's home route on success; alerts on failure.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - The form submission event.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isPasswordStrong) return;
    try {
      const { user } = await dispatch(
        registerUser({ role, email, password }),
      ).unwrap();
      navigate(ROLE_HOME_ROUTES[user.role] ?? "/");
    } catch (message) {
      window.alert(message ?? "ההרשמה נכשלה");
    }
  };

  const rolesOptions = [
    { value: "brigade", label: "חטיבה" },
    { value: "medic", label: "צוות רפואי" },
    { value: "airforce", label: "חיל האוויר" },
    { value: "supervisor", label: "רמה ממונה" },
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
        autoComplete="new-password"
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

      <Box>
        <Progress
          value={passwordStrength}
          color={getStrengthColor(passwordStrength)}
          size="sm"
          radius="xl"
        />
        <Box mt="xs">
          {PASSWORD_REQUIREMENTS.map((requirement) => {
            const isMet = requirement.re.test(password);
            return (
              <Text
                key={requirement.label}
                fz="sm"
                dir="rtl"
                c={
                  isMet
                    ? "var(--app-color-success)"
                    : "var(--app-color-text-muted)"
                }
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                {isMet ? (
                  <IconCheck size={14} stroke={2} />
                ) : (
                  <IconX size={14} stroke={2} />
                )}
                {requirement.label}
              </Text>
            );
          })}
        </Box>
      </Box>

      <Button
        type="submit"
        fullWidth
        loading={isSubmitting}
        disabled={!isPasswordStrong}
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
