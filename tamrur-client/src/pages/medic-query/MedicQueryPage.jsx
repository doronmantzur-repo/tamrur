// React

// External libraries
import { ActionIcon, Box, Group, Stack, Title } from "@mantine/core";
import { IconStethoscope } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

// Internal application modules
import Layout from "../../components/layout/Layout";
import PdfQaCard from "../../components/analyst/PdfQaCard";
import ThemeToggle from "../../components/common/ThemeToggle";

// Styles

/**
 * Renders the medic-query page.
 *
 * @returns {JSX.Element} The medic-query page.
 */
const MedicQueryPage = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <Group pos="absolute" top="md" left="md" gap="sm" style={{ zIndex: 20 }}>
        <ActionIcon
          aria-label="חזרה לממשק הרפואי"
          title="חזרה לממשק הרפואי"
          variant="default"
          size={40}
          radius="xl"
          onClick={() => navigate("/medic")}
          style={{
            backgroundColor: "var(--app-color-surface)",
            borderColor: "var(--app-color-border)",
            color: "var(--app-color-text)",
          }}
        >
          <IconStethoscope aria-hidden="true" size={20} stroke={1.8} />
        </ActionIcon>

        <ThemeToggle />
      </Group>

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
