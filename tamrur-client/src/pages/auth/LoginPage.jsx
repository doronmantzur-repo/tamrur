// React

// External libraries
import { Box, Stack } from "@mantine/core";

// Internal application modules
import Layout from "../../components/layout/Layout";
import AuthHeader from "../../components/auth/AuthHeader";
import LoginForm from "../../components/auth/login/LoginForm";
import AuthFooter from "../../components/auth/AuthFooter";
import ThemeToggle from "../../components/common/ThemeToggle";
// Styles

/**
 * Renders the Tamrur authentication page.
 *
 * @returns {JSX.Element} The Tamrur login page.
 */
const LoginPage = () => {
  return (
    <Layout>
      <Box pos="absolute" top="md" right="md" style={{ zIndex: 20 }}>
        <ThemeToggle />
      </Box>

      <Box
        aria-hidden="true"
        pos="absolute"
        inset={0}
        style={{
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.2,
          backgroundImage:
            "radial-gradient(rgba(197, 160, 89, 0.1) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <Box
        aria-hidden="true"
        pos="absolute"
        inset={0}
        style={{
          zIndex: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--app-color-surface-high) 50%, transparent), var(--app-color-background))",
        }}
      />

      <Stack
        align="center"
        justify="center"
        mih="100vh"
        px="var(--app-page-padding-mobile)"
        py="xl"
        pos="relative"
        style={{
          zIndex: 10,
        }}
      >
        <Box w="100%" maw={448}>
          <Stack align="stretch" gap="xl">
            <AuthHeader />

            <LoginForm />

            <AuthFooter />
          </Stack>
        </Box>
      </Stack>
    </Layout>
  );
};

export default LoginPage;
