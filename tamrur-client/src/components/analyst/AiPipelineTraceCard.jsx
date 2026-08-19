// React

// External libraries
import { Badge, Group, Stack, Text, Timeline } from "@mantine/core";
import {
  IconBrain,
  IconCheck,
  IconDatabase,
  IconListNumbers,
  IconMathFunction,
  IconMessage2,
  IconVectorTriangle,
} from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import { usePacedReveal } from "../../hooks/usePacedReveal";

// Styles

const STEP_REVEAL_INTERVAL_MS = 700;

/**
 * Maps one real pipeline-step event (as emitted by the server, see
 * `medicQueryModel.askQuestionStream`) to how it's shown in the log.
 *
 * @param {{ key: string, [field: string]: unknown }} step
 * @returns {{ icon: React.ReactNode, title: string, detail: React.ReactNode } | null}
 */
function describeStep(step) {
  switch (step.key) {
    case "question":
      return {
        icon: <IconMessage2 size={16} />,
        title: "השאלה התקבלה",
        detail: (
          <Text fz="sm" c="var(--app-color-text-muted)" dir="rtl">
            "{step.question}"
          </Text>
        ),
      };
    case "embed":
      return {
        icon: <IconVectorTriangle size={16} />,
        title: "השאלה הומרה לוקטור (embedding)",
        detail: (
          <Text fz="sm" c="var(--app-color-text-muted)">
            מודל {step.embeddingModel}, וקטור באורך {step.embeddingDimensions} מימדים
          </Text>
        ),
      };
    case "corpus":
      return {
        icon: <IconDatabase size={16} />,
        title: "טעינת קבצי ה embedding המוכנים מראש",
        detail: (
          <Text fz="sm" c="var(--app-color-text-muted)">
            {step.corpusSize} קטעים מתוך ספר הטראומה והרפואה המבצעית, כל אחד מיוצג כווקטור
          </Text>
        ),
      };
    case "similarity":
      return {
        icon: <IconMathFunction size={16} />,
        title: "חושב דמיון קוסינוס מול כל קטע במאגר",
        detail: (
          <Text fz="sm" c="var(--app-color-text-muted)">
            כל קטע דורג לפי הקרבה הסמנטית שלו לשאלה
          </Text>
        ),
      };
    case "retrieval":
      return {
        icon: <IconListNumbers size={16} />,
        title: `נבחרו ${step.retrievedChunks.length} הקטעים הרלוונטיים ביותר`,
        detail: (
          <Stack gap={6} mt={4}>
            {step.retrievedChunks.map((chunk) => (
              <Group key={chunk.rank} gap="xs" wrap="nowrap" align="flex-start">
                <Badge
                  size="sm"
                  variant="outline"
                  style={{ flexShrink: 0 }}
                  styles={{
                    root: {
                      borderColor: "var(--app-color-border)",
                      color: "var(--app-color-text-muted)",
                    },
                  }}
                >
                  {Math.round(chunk.score * 100)}%
                </Badge>
                <Text
                  fz="xs"
                  c="var(--app-color-text-muted)"
                  dir="rtl"
                  style={{ overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  {chunk.preview}…
                </Text>
              </Group>
            ))}
          </Stack>
        ),
      };
    case "generate":
      return {
        icon: <IconBrain size={16} />,
        title: "הקטעים נשלחו למודל השפה כהקשר סגור",
        detail: (
          <Text fz="sm" c="var(--app-color-text-muted)">
            {step.answerModel} התבקש לענות אך ורק על סמך הקטעים שאוחזרו, ולא מידע כללי
          </Text>
        ),
      };
    case "done":
      return { icon: <IconCheck size={16} />, title: "התקבלה תשובה", detail: null };
    default:
      return null;
  }
}

/**
 * Shows what the RAG pipeline is actually doing to answer the question, live:
 * the question gets embedded, the closest excerpts are picked out of the
 * trauma-manual corpus by cosine similarity, and Claude answers using only
 * those excerpts. Each entry is a real event the server emits as that step
 * actually happens (see `medicQueryModel.askQuestionStream`) — this just
 * renders whatever has arrived so far, so the log fills in as the request
 * progresses instead of appearing all at once at the end.
 *
 * Steps are still paced at least `STEP_REVEAL_INTERVAL_MS` apart even when
 * several land within the same instant (the local retrieval steps run in
 * milliseconds) — real progress, just smoothed enough to read as a sequence
 * instead of snapping in all together.
 *
 * @param {{ steps: Array<{ key: string, [field: string]: unknown }> }} props
 * @returns {JSX.Element} The pipeline trace card.
 */
const AiPipelineTraceCard = ({ steps }) => {
  const visibleCount = usePacedReveal(steps.length, { minIntervalMs: STEP_REVEAL_INTERVAL_MS });
  const visibleSteps = steps.slice(0, visibleCount);

  return (
    <DashboardCard title="מאחורי הקלעים: תהליך השאילתה">
      <Timeline active={visibleSteps.length - 1} bulletSize={28} lineWidth={2} color="var(--app-color-primary)">
        {visibleSteps.map((step, i) => {
          const view = describeStep(step);
          if (!view) return null;
          return (
            <Timeline.Item key={`${step.key}-${i}`} bullet={view.icon} title={view.title} className="app-fade-in">
              {view.detail}
            </Timeline.Item>
          );
        })}
      </Timeline>
    </DashboardCard>
  );
};

export default AiPipelineTraceCard;
