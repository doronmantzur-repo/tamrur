// React

// External libraries
import { Divider, Stack, Text, Title } from "@mantine/core";

// Internal application modules

// Styles

function LabeledLine({ label, value }) {
  return (
    <Text fz="sm" c="var(--app-color-text)">
      <Text component="span" fw={700}>
        {label}{" "}
      </Text>
      {value}
    </Text>
  );
}

/**
 * Renders a report view model (see utils/reportData.js) as read-only
 * on-screen content, mirroring the .docx layout field-for-field so what the
 * analyst reviews here is exactly what gets saved if they choose to.
 *
 * @param {{ viewModel: object }} props
 * @returns {JSX.Element} The report preview.
 */
const ReportPreview = ({ viewModel }) => {
  return (
    <Stack gap="xs">
      <Title order={4} ta="center" c="var(--app-color-text)">
        {viewModel.title}
      </Title>

      <LabeledLine label='תאריך יצירת הדו"ח:' value={viewModel.createdAt} />
      <LabeledLine label="שם האירוע:" value={viewModel.eventName} />

      <Divider color="var(--app-color-border)" my={4} />
      <Text fw={700} c="var(--app-color-text)">
        סקירה כללית:
      </Text>
      {viewModel.overview.map(({ label, value }) => (
        <LabeledLine key={label} label={label} value={value} />
      ))}

      <LabeledLine label={viewModel.aerialEvac.label} value={viewModel.aerialEvac.value} />

      <Divider color="var(--app-color-border)" my={4} />
      <Text fw={700} c="var(--app-color-text)">
        צוותי חילוץ:
      </Text>
      {viewModel.evacuationTeams.map((team, index) => (
        <Text key={`${index}-${team}`} fz="sm" c="var(--app-color-text)">
          {team}
        </Text>
      ))}

      <Divider color="var(--app-color-border)" my={4} />
      <Text fw={700} c="var(--app-color-text)">
        נפגעים:
      </Text>
      {!viewModel.hasCasualties ? (
        <Text fz="sm" c="var(--app-color-text)">
          לא דווחו נפגעים
        </Text>
      ) : (
        viewModel.casualties.map((casualty) => (
          <Stack key={casualty.title} gap={2} pt="xs">
            <Text fw={700} c="var(--app-color-text)">
              {casualty.title}
            </Text>
            {casualty.fields.map(({ label, value }) => (
              <LabeledLine key={label} label={label} value={value} />
            ))}
          </Stack>
        ))
      )}
    </Stack>
  );
};

export default ReportPreview;
