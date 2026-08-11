// React
import { useEffect } from "react";

// External libraries
import { ActionIcon, Box, Stack, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";

// Internal application modules
import Layout from "../../components/layout/Layout";
import AuthHeader from "../../components/auth/AuthHeader";
import AuthFooter from "../../components/auth/AuthFooter";
import AerialEvacCard from "../../components/airforce/AerialEvacCard";
import { fetchEvents } from "../../features/events/eventsSlice";

// Styles

/**
 * Renders the aerial evacuation request page.
 *
 * @returns {JSX.Element} The aerial evacuation request page.
 */
const AerialEvacuationPage = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dispatch = useDispatch();
  const events = useSelector((state) => state.events.events);
  const aerialEvacEvents = events.filter((event) => event["aerial-evac"] !== null);

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  const isDark = colorScheme === "dark";

  return (
    <Layout>
      <ActionIcon
        aria-label="החלף מצב תצוגה"
        title="החלף מצב תצוגה"
        variant="default"
        size={40}
        radius="xl"
        onClick={() => toggleColorScheme()}
        pos="absolute"
        top="md"
        right="md"
        style={{
          zIndex: 20,
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

            <Stack align="stretch" gap="md">
              {aerialEvacEvents.map((event) => (
                <AerialEvacCard key={event.id} event={event} />
              ))}
            </Stack>

            <AuthFooter />
          </Stack>
        </Box>
      </Stack>
    </Layout>
  );
};

export default AerialEvacuationPage;
