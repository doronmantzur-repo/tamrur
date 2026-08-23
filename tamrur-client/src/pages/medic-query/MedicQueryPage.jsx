// React

// External libraries
import { ActionIcon, Box, Stack, Title } from "@mantine/core";
import { IconStethoscope } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

// Internal application modules
import Layout from "../../components/layout/Layout";
import PdfQaCard from "../../components/analyst/PdfQaCard";
import ThemeToggleButton from "../../components/common/ThemeToggleButton";
import AccountBar from "../../components/brigade/AccountBar";
import { useHoverState } from "../../hooks/useHoverState";

// Styles

/**
 * Renders the medic-query page.
 *
 * @returns {JSX.Element} The medic-query page.
 */
const MedicQueryPage = () => {
  const navigate = useNavigate();
  const [isBackButtonHovered, backButtonHoverHandlers] = useHoverState();

  return (
    <Layout>
      <div
        style={{
          position: "absolute",
          top: "var(--mantine-spacing-md)",
          left: "var(--mantine-spacing-md)",
          display: "flex",
          alignItems: "center",
          gap: "var(--mantine-spacing-sm)",
          zIndex: 20,
        }}
      >
        <ActionIcon
          aria-label="חזרה לממשק הרפואי"
          title="חזרה לממשק הרפואי"
          variant="default"
          size={40}
          radius="xl"
          onClick={() => navigate("/medic")}
          {...backButtonHoverHandlers}
          style={{
            backgroundColor: isBackButtonHovered ? "var(--app-color-primary)" : "var(--app-color-surface)",
            borderColor: isBackButtonHovered ? "var(--app-color-primary)" : "var(--app-color-border)",
            color: isBackButtonHovered ? "var(--app-color-primary-text)" : "var(--app-color-text)",
            transform: isBackButtonHovered ? "translateY(-1px)" : undefined,
            transition: "background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease",
          }}
        >
          <IconStethoscope aria-hidden="true" size={20} stroke={1.8} />
        </ActionIcon>

        <ThemeToggleButton variant="glass" />

        <AccountBar />
      </div>

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
        align="stretch"
        mih="100vh"
        px="var(--app-page-padding-mobile)"
        py="xl"
        pos="relative"
        style={{
          zIndex: 10,
        }}
      >
        <Box w="100%" maw={1240} style={{ marginInline: "auto" }}>
          <Stack align="stretch" gap="xl">
            <Title order={1} c="var(--app-color-primary)" fz="1.75rem" fw={700}>
              ספר הטראומה והרפואה המבצעית
            </Title>

            <PdfQaCard />
          </Stack>
        </Box>
      </Stack>
    </Layout>
  );
};

export default MedicQueryPage;
