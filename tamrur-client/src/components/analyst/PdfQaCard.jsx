// React
import { useEffect, useRef, useState } from "react";

// External libraries
import { Alert, Button, Loader, Stack, Text, Textarea, Typography } from "@mantine/core";
import { IconAlertCircle, IconSend } from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";

// Internal application modules
import DashboardCard from "../dashboard/DashboardCard";
import AiPipelineTraceCard from "./AiPipelineTraceCard";
import { streamPost } from "../../api/TamrurAPI";

// Styles

/**
 * Lets the analyst ask a free-text question against the reference PDF
 * (currently the IDF combat casualty care manual) and shows Claude's answer.
 *
 * Goes through the authenticated tamrur-server (/medic-query/ask), which
 * streams the retrieval steps live as Server-Sent Events — the answer itself
 * is accumulated from the same stream of tokens but only shown once complete,
 * printed as a single block rather than growing token by token.
 *
 * Only the current question and answer are shown, but every completed turn is
 * kept in `historyRef` (a plain in-memory ref, not displayed) and sent back
 * as `history` on the next question, so a follow-up ("and what about
 * children?") is answered with the earlier conversation as context. That
 * history lives only in this component's memory for as long as it's mounted
 * — leaving the query page unmounts it and the context is gone.
 *
 * @returns {JSX.Element} The PDF Q&A card.
 */
const PdfQaCard = () => {
  const [question, setQuestion] = useState("");
  const [askedQuestion, setAskedQuestion] = useState(null);
  const [steps, setSteps] = useState([]);
  const [answer, setAnswer] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const historyRef = useRef([]);
  const answerRef = useRef("");

  useEffect(() => () => abortRef.current?.abort(), []);

  function handleSubmit(evt) {
    evt.preventDefault();
    if (!question.trim() || isAsking) return;

    const submittedQuestion = question.trim();
    const history = historyRef.current;
    const controller = new AbortController();
    abortRef.current = controller;

    setIsAsking(true);
    setError(null);
    setSteps([]);
    setAnswer("");
    answerRef.current = "";
    setAskedQuestion(submittedQuestion);

    let streamFailed = false;

    streamPost(
      "/medic-query/ask",
      { question: submittedQuestion, history },
      {
        signal: controller.signal,
        onEvent: (event, data) => {
          if (event === "step") setSteps((prev) => [...prev, data]);
          else if (event === "token") {
            answerRef.current += data.text;
            setAnswer((prev) => prev + data.text);
          } else if (event === "error") {
            streamFailed = true;
            setError(data.message || "השאלה נכשלה, נסה שוב");
          }
        },
      },
    )
      .then(() => {
        if (streamFailed || !answerRef.current) return;
        historyRef.current = [...history, { question: submittedQuestion, answer: answerRef.current }];
        setSteps((prev) => [...prev, { key: "saved" }]);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "השאלה נכשלה, נסה שוב");
      })
      .finally(() => setIsAsking(false));
  }

  return (
    <Stack align="stretch" gap="xl">
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
                {steps.length === 0 ? "מתחיל לעבד..." : "מנסח תשובה..."}
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
            <Typography dir="rtl" c="var(--app-color-text)">
              <ReactMarkdown>{answer}</ReactMarkdown>
            </Typography>
          )}
        </Stack>
      </DashboardCard>

      {steps.length > 0 && <AiPipelineTraceCard key={askedQuestion} steps={steps} />}
    </Stack>
  );
};

export default PdfQaCard;
