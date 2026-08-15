// React
import { useState } from "react";

// External libraries
import { Alert, Badge, Button, Group, Loader, Stack, Text } from "@mantine/core";
import { IconAlertCircle, IconArrowsSort } from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import TamrurAPI from "../../api/TamrurAPI";
import { URGENCY_LABELS, EVAC_ABILITY_LABELS } from "../../constants/casualtyStatus";

// Styles

/**
 * Lets the medic ask Claude to rank the selected event's casualties by
 * evacuation priority, based on each casualty's record and the
 * treatments logged for them (tamrur-server gathers both server-side —
 * only the event id is sent from the client). The AI's ranking is written
 * straight onto each casualty's evac-priority column; the result list below
 * the button is what actually got saved, not a preview.
 *
 * The parent should remount this (e.g. `key={eventId}`) when the selected
 * event changes, so a ranking from a previous event doesn't linger.
 *
 * @param {{ eventId: string | null }} props
 * @returns {JSX.Element} The evac-priority card.
 */
const EvacPriorityCard = ({ eventId }) => {
  const [isSetting, setIsSetting] = useState(false);
  const [error, setError] = useState(null);
  const [casualties, setCasualties] = useState(null);

  function handleClick() {
    if (!eventId || isSetting) return;

    setIsSetting(true);
    setError(null);

    TamrurAPI.post(`/medic-query/priority/${eventId}`)
      .then((response) => setCasualties(response.data.casualties))
      .catch((err) => {
        setCasualties(null);
        setError(err.response?.data?.message ?? "קביעת העדיפויות נכשלה, נסה שוב");
      })
      .finally(() => setIsSetting(false));
  }

  const sortedCasualties = casualties
    ? [...casualties].sort((a, b) => (a["evac-priority"] ?? Infinity) - (b["evac-priority"] ?? Infinity))
    : [];

  return (
    <DashboardCard title="עדיפות פינוי">
      <Stack gap="sm">
        <Button
          leftSection={<IconArrowsSort size={18} stroke={1.8} />}
          loading={isSetting}
          disabled={!eventId}
          onClick={handleClick}
          style={{ alignSelf: "flex-start" }}
          styles={{
            root: {
              backgroundColor: "var(--app-color-primary)",
              color: "var(--app-color-primary-text)",
              "&:hover": { backgroundColor: "var(--app-color-primary-hover)" },
            },
          }}
        >
          קבע עדיפויות פינוי
        </Button>

        {!eventId && (
          <Text fz="sm" c="var(--app-color-text-muted)">
            בחר אירוע כדי לקבוע עדיפויות פינוי
          </Text>
        )}

        {isSetting && (
          <Stack align="center" gap="xs" py="md">
            <Loader color="var(--app-color-primary)" size="sm" />
            <Text fz="sm" c="var(--app-color-text-muted)">
              הבינה המלאכותית קובעת עדיפויות...
            </Text>
          </Stack>
        )}

        {error && (
          <Alert
            icon={<IconAlertCircle size={18} />}
            color="red"
            styles={{ root: { backgroundColor: "color-mix(in srgb, var(--app-color-error) 12%, transparent)" } }}
          >
            {error}
          </Alert>
        )}

        {casualties && !isSetting && (
          <Stack gap={6}>
            {sortedCasualties.length === 0 ? (
              <Text fz="sm" c="var(--app-color-text-muted)">
                לא נמצאו נפגעים לאירוע זה
              </Text>
            ) : (
              sortedCasualties.map((casualty) => (
                <Group key={casualty.id} gap="sm" wrap="nowrap">
                  <Badge
                    styles={{
                      root: {
                        backgroundColor: "color-mix(in srgb, var(--app-color-primary) 18%, transparent)",
                        color: "var(--app-color-primary)",
                        flexShrink: 0,
                      },
                    }}
                  >
                    {`עדיפות ${casualty["evac-priority"] ?? "-"}`}
                  </Badge>
                  <Text fz="sm" fw={600} c="var(--app-color-text)" style={{ flexShrink: 0 }}>
                    {casualty["casualty-number"] != null ? `נפגע #${casualty["casualty-number"]}` : "ללא מספר נפגע"}
                  </Text>
                  <Text fz="sm" c="var(--app-color-text)" truncate>
                    {`${URGENCY_LABELS[casualty.urgency] || casualty.urgency || "-"} · ${
                      EVAC_ABILITY_LABELS[casualty["evac-ability"]] || casualty["evac-ability"] || "-"
                    }`}
                  </Text>
                </Group>
              ))
            )}
          </Stack>
        )}
      </Stack>
    </DashboardCard>
  );
};

export default EvacPriorityCard;
