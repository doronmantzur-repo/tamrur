// React
import { useMemo, useState } from "react";

// External libraries
import {
  Alert,
  Badge,
  Button,
  Collapse,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp,
  IconSparkles,
  IconUserPlus,
} from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import MedicCasualtyCards from "./MedicCasualtyCards";
import MedicCasualtiesTable from "./MedicCasualtiesTable";
import { MONO_FONT, primaryButtonStyles } from "./formStyles";
import {
  EVAC_STATUS_COLOR_VARS,
  EVAC_STATUS_LABELS,
  GATHERING_COMPLETED,
  GATHERING_IN_PROGRESS,
  GATHERING_STATUS_LABELS,
  URGENCY_COLOR_VARS,
  URGENCY_LABELS,
  URGENCY_NONE_COLOR_VAR,
  URGENCY_NONE_LABEL,
  URGENCY_ORDER,
} from "../../constants/casualtyStatus";
import {
  clearAiPriorityError,
  setAiEvacPriorities,
  updateCasualty,
} from "../../features/casualties/casualtiesSlice";
import { fetchEvents, updateEventGatheringStatus } from "../../features/events/eventsSlice";
import { CASUALTY_TIER, useCasualtyTier } from "../../hooks/useCasualtyTier";

// Styles

/**
 * Renders the medic interface's casualty card.
 *
 * Casualties split in two: those still on scene, and those already evacuated.
 * Evacuating a casualty is a one-click move from the first list to the second,
 * which stays collapsed by default so the active picture isn't cluttered.
 *
 * The gathering switch closes casualty collection for the event. That, together
 * with how many casualties have been evacuated, is what the server derives the
 * event's `evac_status` from — the badge here only reports it.
 *
 * @param {{
 *   event: Object,
 *   casualties: Array<Object>,
 *   isAdding: boolean,
 *   onAddingChange: (isAdding: boolean) => void,
 *   onOpenRecords: (casualty: Object) => void,
 * }} props
 * @returns {JSX.Element} The medic casualties card.
 */
const MedicCasualtiesCard = ({ event, casualties, isAdding, onAddingChange, onOpenRecords }) => {
  const dispatch = useDispatch();
  const tier = useCasualtyTier();
  const [showEvacuated, setShowEvacuated] = useState(false);

  const rowErrorById = useSelector((state) => state.casualties.rowErrorById);
  const savingById = useSelector((state) => state.casualties.savingById);
  const isUpdatingEvent = useSelector((state) => state.events.updateStatus === "loading");
  const isRankingByAi = useSelector((state) => state.casualties.aiPriorityStatus === "loading");
  const aiPriorityError = useSelector((state) => state.casualties.aiPriorityError);

  const eventId = event.id;
  const gatheringStatus = event.gathering_status ?? GATHERING_IN_PROGRESS;
  const isGatheringComplete = gatheringStatus === GATHERING_COMPLETED;
  const evacStatus = event.evac_status ?? 0;

  const { active, evacuated } = useMemo(
    () => ({
      active: casualties.filter((casualty) => !casualty.is_evacuated),
      evacuated: casualties.filter((casualty) => casualty.is_evacuated),
    }),
    [casualties],
  );

  // The tiles describe who is still on scene, matching the table beneath them.
  const countsByUrgency = URGENCY_ORDER.reduce((acc, key) => {
    acc[key] = active.filter((casualty) => casualty.urgency === key).length;
    return acc;
  }, {});

  // Urgency is optional, so a casualty can sit outside all four tiles. Surface
  // that as its own tile rather than letting the breakdown quietly under-count —
  // an un-triaged casualty is exactly the one a medic needs to notice.
  const untriagedCount = active.filter((casualty) => !casualty.urgency).length;
  const urgencyTiles = [
    ...URGENCY_ORDER.map((key) => ({
      key,
      label: URGENCY_LABELS[key],
      color: URGENCY_COLOR_VARS[key],
      count: countsByUrgency[key],
    })),
    ...(untriagedCount > 0
      ? [
          {
            key: "__untriaged__",
            label: URGENCY_NONE_LABEL,
            color: URGENCY_NONE_COLOR_VAR,
            count: untriagedCount,
          },
        ]
      : []),
  ];

  /**
   * Marks a casualty evacuated, or puts them back on scene.
   *
   * The slice applies this optimistically, so the row moves between the two
   * lists on the click and rolls back only if the write fails.
   *
   * @param {Object} casualty
   * @param {boolean} isEvacuated
   * @returns {void}
   */
  function handleToggleEvacuated(casualty, isEvacuated) {
    dispatch(updateCasualty({ id: casualty.id, fields: { is_evacuated: isEvacuated } }))
      .unwrap()
      // The event's evac_status is derived server-side from this very write, so
      // the event has to be re-read or the badge reports the state from before
      // the click.
      .then(() => dispatch(fetchEvents()))
      // The failure is flagged on the row and the optimistic change is rolled
      // back in the slice — swallow it so it isn't an unhandled rejection.
      .catch(() => {});
  }

  /**
   * Opens or closes casualty gathering for this event.
   *
   * @param {boolean} complete
   * @returns {void}
   */
  function handleGatheringChange(complete) {
    dispatch(
      updateEventGatheringStatus({
        id: eventId,
        gatheringStatus: complete ? GATHERING_COMPLETED : GATHERING_IN_PROGRESS,
      }),
    )
      .unwrap()
      .catch(() => {});
  }

  /**
   * Asks the server to rank this event's casualties by evacuation priority.
   *
   * The saved rows come back in the response, so the AI column fills in without
   * a refetch. This is the only path that ever calls the model — loading the
   * table just reads the stored column.
   *
   * @returns {void}
   */
  function handleRankByAi() {
    dispatch(setAiEvacPriorities(eventId))
      .unwrap()
      // Surfaced in the alert below the action bar via `aiPriorityError`.
      .catch(() => {});
  }

  const listProps = {
    eventId,
    onAddingChange,
    onOpenRecords,
    onToggleEvacuated: handleToggleEvacuated,
  };

  return (
    <DashboardCard
      title="נפגעים"
      padding={{ base: "xs", sm: "md", md: "lg" }}
      headerExtra={
        <Group gap="sm">
          <Badge
            variant="outline"
            styles={{
              root: {
                backgroundColor: "var(--app-color-surface-high)",
                borderColor: "var(--app-color-border)",
                color: "var(--app-color-text-muted)",
              },
            }}
          >
            {active.length} בזירה · {casualties.length} סה״כ
          </Badge>
          <Button
            size="xs"
            h="2.25rem"
            mih="2.25rem"
            variant="default"
            leftSection={<IconSparkles size={16} stroke={1.8} />}
            loading={isRankingByAi}
            // Nothing to rank on an empty event, and re-running mid-request
            // would just queue a second identical inference.
            disabled={casualties.length === 0 || isRankingByAi}
            onClick={handleRankByAi}
            styles={{
              root: {
                backgroundColor: "var(--app-color-surface-high)",
                color: "var(--app-color-primary)",
                border: "1px solid color-mix(in srgb, var(--app-color-primary) 45%, transparent)",
              },
            }}
          >
            חשב קדימות לפינוי (AI)
          </Button>
          <Button
            size="xs"
            h="2.25rem"
            mih="2.25rem"
            leftSection={<IconUserPlus size={16} stroke={1.8} />}
            disabled={isAdding}
            onClick={() => onAddingChange(true)}
            styles={primaryButtonStyles}
          >
            נפגע חדש
          </Button>
        </Group>
      }
    >
      {aiPriorityError && (
        <Alert
          icon={<IconAlertCircle size={18} />}
          color="red"
          withCloseButton
          closeButtonLabel="סגור"
          onClose={() => dispatch(clearAiPriorityError())}
          styles={{
            root: {
              backgroundColor: "color-mix(in srgb, var(--app-color-error) 12%, transparent)",
            },
          }}
        >
          {aiPriorityError}
        </Alert>
      )}

      {/* Gathering control, plus the event's derived evacuation state. */}
      <Paper
        withBorder
        radius="sm"
        px="md"
        py="sm"
        style={{
          backgroundColor: "var(--app-color-surface-high)",
          borderColor: "var(--app-color-border)",
          borderInlineStart: `3px solid ${EVAC_STATUS_COLOR_VARS[evacStatus]}`,
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Switch
            checked={isGatheringComplete}
            onChange={(changed) => handleGatheringChange(changed.currentTarget.checked)}
            disabled={isUpdatingEvent}
            color="var(--app-color-primary)"
            label={
              <Text fz="sm" fw={600} c="var(--app-color-text)">
                איסוף נפגעים: {GATHERING_STATUS_LABELS[gatheringStatus] ?? gatheringStatus}
              </Text>
            }
          />

          <Group gap="xs" align="center" wrap="nowrap">
            <Text fz="0.68rem" c="var(--app-color-text-muted)">
              מצב פינוי
            </Text>
            <Badge
              styles={{
                root: {
                  backgroundColor: `color-mix(in srgb, ${EVAC_STATUS_COLOR_VARS[evacStatus]} 16%, transparent)`,
                  color: EVAC_STATUS_COLOR_VARS[evacStatus],
                },
              }}
            >
              {EVAC_STATUS_LABELS[evacStatus] ?? evacStatus}
            </Badge>
            <Text fz="0.68rem" c="var(--app-color-text-muted)" ff={MONO_FONT}>
              {evacuated.length}/{casualties.length}
            </Text>
          </Group>
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 2, sm: urgencyTiles.length > 4 ? 5 : 4 }} spacing="sm">
        {urgencyTiles.map((tile) => (
          <Stack
            key={tile.key}
            gap={4}
            p="sm"
            style={{
              backgroundColor: "var(--app-color-surface-high)",
              border: "1px solid var(--app-color-border)",
              borderInlineStart: `3px solid ${tile.color}`,
              borderRadius: "var(--mantine-radius-sm)",
            }}
          >
            <Text fz="1.35rem" fw={700} lh={1} ff={MONO_FONT}>
              {tile.count}
            </Text>
            <Text fz="0.68rem" c="var(--app-color-text-muted)">
              {tile.label}
            </Text>
          </Stack>
        ))}
      </SimpleGrid>

      {tier === CASUALTY_TIER.CARD ? (
        <MedicCasualtyCards
          {...listProps}
          casualties={active}
          rowErrorById={rowErrorById}
          savingById={savingById}
          isAdding={isAdding}
        />
      ) : (
        <MedicCasualtiesTable
          {...listProps}
          casualties={active}
          tier={tier}
          isAdding={isAdding}
          // "none recorded" is wrong once everyone has been evacuated.
          emptyMessage={evacuated.length > 0 ? "כל הנפגעים פונו" : "לא נרשמו נפגעים באירוע זה"}
        />
      )}

      {/* Evacuated casualties, tucked away until asked for. */}
      <Stack gap="sm">
        <Button
          variant="default"
          size="xs"
          h="2.25rem"
          mih="2.25rem"
          onClick={() => setShowEvacuated((open) => !open)}
          disabled={evacuated.length === 0}
          leftSection={showEvacuated ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          styles={{
            root: {
              alignSelf: "flex-start",
              backgroundColor: "var(--app-color-surface-high)",
              color: "var(--app-color-text)",
              border: "1px solid var(--app-color-border)",
            },
          }}
        >
          {showEvacuated ? "הסתר נפגעים שפונו" : `הצג נפגעים שפונו (${evacuated.length})`}
        </Button>

        {/* Mantine v9 spells this `expanded`; the older `in` is silently ignored. */}
        <Collapse expanded={showEvacuated && evacuated.length > 0}>
          {tier === CASUALTY_TIER.CARD ? (
            <MedicCasualtyCards
              {...listProps}
              casualties={evacuated}
              rowErrorById={rowErrorById}
              savingById={savingById}
              isAdding={false}
              hideReadyForEvac
            />
          ) : (
            <MedicCasualtiesTable
              {...listProps}
              casualties={evacuated}
              tier={tier}
              isAdding={false}
              emptyMessage="לא פונו נפגעים עדיין"
              hideReadyForEvac
            />
          )}
        </Collapse>
      </Stack>
    </DashboardCard>
  );
};

export default MedicCasualtiesCard;
