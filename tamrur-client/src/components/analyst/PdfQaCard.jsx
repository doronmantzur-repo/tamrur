// React
import { useState } from "react";

// External libraries
import { Alert, Button, Loader, Stack, Text, Textarea } from "@mantine/core";
import { IconAlertCircle, IconSend } from "@tabler/icons-react";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import TamrurAPI from "../../api/TamrurAPI";

// Styles

/**
 * Lets the analyst ask a free-text question against the reference PDF
 * (currently the IDF combat casualty care manual) and shows Claude's answer.
 *
 * Goes through the authenticated tamrur-server (/medic-query/ask), which
 * embeds the question, retrieves the closest excerpts, and asks Claude to
 * answer using only that context.
 *
 * @returns {JSX.Element} The PDF Q&A card.
 */
const PdfQaCard = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState(null);

  function handleSubmit(evt) {
    evt.preventDefault();
    if (!question.trim() || isAsking) return;

    setIsAsking(true);
    setError(null);

    TamrurAPI.post("/medic-query/ask", { question: question.trim() })
      .then((response) => setAnswer(response.data.answer))
      .catch((err) => {
        setAnswer(null);
        setError(err.response?.data?.message ?? "השאלה נכשלה, נסה שוב");
      })
      .finally(() => setIsAsking(false));
  }

  return (
    <DashboardCard title="שאל על החומר הרפואי">
      <Stack gap="sm" component="form" onSubmit={handleSubmit}>
        <Textarea
          placeholder="לדוגמא: מהם פעולות סקר ראשוני לפצוע?"
          value={question}
          onChange={(evt) => setQuestion(evt.currentTarget.value)}
          dir="rtl"
          autosize
          minRows={2}
          styles={{
            input: {
              backgroundColor: "var(--app-color-background)",
              color: "var(--app-color-text)",
              borderColor: "var(--app-color-border)",
            },
          }}
        />

        <Button
          type="submit"
          leftSection={<IconSend size={18} stroke={1.8} />}
          loading={isAsking}
          disabled={!question.trim()}
          style={{ alignSelf: "flex-start" }}
          styles={{
            root: {
              backgroundColor: "var(--app-color-primary)",
              color: "var(--app-color-primary-text)",
              "&:hover": { backgroundColor: "var(--app-color-primary-hover)" },
            },
          }}
        >
          שאל
        </Button>

        {isAsking && (
          <Stack align="center" gap="xs" py="md">
            <Loader color="var(--app-color-primary)" size="sm" />
            <Text fz="sm" c="var(--app-color-text-muted)">
              מחפש תשובה...
            </Text>
          </Stack>
        )}

        {error && (
          <Alert
            icon={<IconAlertCircle size={18} />}
            color="red"
            styles={{
              root: {
                backgroundColor:
                  "color-mix(in srgb, var(--app-color-error) 12%, transparent)",
              },
            }}
          >
            {error}
          </Alert>
        )}

        {answer && !isAsking && (
          <Text
            dir="rtl"
            c="var(--app-color-text)"
            style={{ whiteSpace: "pre-wrap" }}
          >
            {answer}
          </Text>
        )}
      </Stack>
    </DashboardCard>
  );
};

export default PdfQaCard;
