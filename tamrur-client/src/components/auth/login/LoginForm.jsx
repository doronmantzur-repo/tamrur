// React
import { useState } from "react";

// External libraries
import {
  Alert,
  Button,
  Checkbox,
  PasswordInput,
  Text,
  TextInput,
} from "@mantine/core";
import { IconAlertCircle, IconMail, IconLock, IconLogin } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

// Internal application modules
import { loginUser } from "../../../features/auth/authSlice";
import { ROLE_HOME_ROUTES } from "../../../constants/roles";
import AuthFormCard from "../AuthFormCard";

// Styles

// The server keeps its own error messages generic on purpose (never says
// which of email/password was wrong, to avoid confirming an email is
// registered) — translated here rather than trusting the raw string for
// display, and falling back to a generic Hebrew message for anything else
// (a network error, the server being unreachable, ...).
const LOGIN_ERROR_MESSAGES = {
  "Invalid email or password": "אימייל או סיסמה שגויים",
  "email or password missing": "יש למלא אימייל וסיסמה",
};

function loginErrorMessage(error) {
  if (!error) return null;
  return LOGIN_ERROR_MESSAGES[error] ?? "ההתחברות נכשלה, נסה שוב";
}

/**
 * Renders the Tamrur login form.
 *
 * @returns {JSX.Element} The login form.
 */
const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector((state) => state.auth.status);
  const error = useSelector((state) => state.auth.error);
  const isSubmitting = status === "loading";
  const errorMessage = status === "failed" ? loginErrorMessage(error) : null;
  /**
   * Handles login form submission. Redirects to the logged-in user's home
   * route on success; failures stay on the page (error is in redux state).
   *
   * @param {React.FormEvent<HTMLFormElement>} event - The form submission event.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const { user } = await dispatch(
        loginUser({ email, password, rememberMe }),
      ).unwrap();
      navigate(ROLE_HOME_ROUTES[user.role] ?? "/");
    } catch {
      // Rejection is already captured in redux auth state via loginUser.rejected.
    }
  };

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

      <div
        style={{
          display: "flex",
          alignItems: "center",
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
      </div>

      {errorMessage && (
        <Alert
          icon={<IconAlertCircle size={18} />}
          color="red"
          styles={{
            root: {
              backgroundColor: "color-mix(in srgb, var(--app-color-error) 12%, transparent)",
            },
          }}
        >
          {errorMessage}
        </Alert>
      )}

      <Button
        type="submit"
        fullWidth
        loading={isSubmitting}
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
      <Text ta="center" c="var(--app-color-text-muted)" fz="md" lh={1.5}>
        חדש במערכת?{" "}
        <Text
          component="a"
          href="/signup"
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
          הירשם כאן
        </Text>
      </Text>
    </AuthFormCard>
  );
};

export default LoginForm;
