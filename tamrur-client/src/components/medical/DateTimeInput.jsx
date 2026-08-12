// React

// External libraries
import { TextInput } from "@mantine/core";
import { IconClock } from "@tabler/icons-react";

// Internal application modules
import { inputStyles } from "./formStyles";
import { isoToLocalInputValue, localInputValueToIso } from "../../utils/datetime";

// Styles

/**
 * Renders the timestamp field used on every treatment and vitals record.
 *
 * Built on a native `datetime-local` input rather than Mantine's
 * `DateTimePicker`, which lives in `@mantine/dates` — a package this client
 * doesn't depend on. `AerialEvacuationForm` takes the same approach for its ETA
 * field, so the two read consistently.
 *
 * @param {{
 *   value: string | null,
 *   onChange: (isoString: string | null) => void,
 *   label?: string,
 *   error?: string | null,
 *   disabled?: boolean,
 *   required?: boolean,
 * }} props
 * @returns {JSX.Element} The timestamp input.
 */
const DateTimeInput = ({
  value,
  onChange,
  label = "זמן רישום",
  error = null,
  disabled = false,
  required = true,
}) => {
  return (
    <TextInput
      type="datetime-local"
      label={label}
      value={isoToLocalInputValue(value)}
      onChange={(event) => onChange(localInputValueToIso(event.currentTarget.value))}
      leftSection={<IconClock size={20} stroke={1.8} />}
      leftSectionPointerEvents="none"
      error={error}
      disabled={disabled}
      required={required}
      dir="rtl"
      styles={inputStyles}
    />
  );
};

export default DateTimeInput;