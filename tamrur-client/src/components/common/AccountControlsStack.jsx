// React

// External libraries
import { Group, Stack } from "@mantine/core";

// Internal application modules
import AccountBar from "../brigade/AccountBar";

// Styles

/**
 * Keeps the signed-in account cluster (role label + logout, via AccountBar)
 * alone on its own row, with every other page control — the theme toggle,
 * page-specific nav buttons, etc. — passed as `children` and wrapping onto
 * the row(s) below it instead of crowding into AccountBar's row. `children`
 * wraps (via Mantine's own `wrap="wrap"`) if there isn't room for all of
 * them on one row either.
 *
 * Both rows are cross-axis aligned to "flex-end", the visual left in this
 * app's `dir="rtl"` layout, matching where AccountBar has always sat.
 * That's true regardless of whether the parent element is in normal flow or
 * absolutely positioned with a physical `left` — flex/grid alignment values
 * like "flex-end" follow the document's `direction`, not the positioning
 * scheme of whatever box they're inside, so there's no "physical" variant to
 * opt into here.
 *
 * Convention: pass the theme toggle as the *last* child. In a `dir="rtl"`
 * flex row the last JSX child renders visually leftmost, and every page
 * keeps the toggle there — so order other controls before it, not after.
 *
 * @param {{ children?: React.ReactNode, style?: React.CSSProperties }} props
 * @returns {JSX.Element} The two-row account/controls stack.
 */
const AccountControlsStack = ({ children, style }) => (
  <Stack gap="md" align="flex-end" style={style}>
    <AccountBar />
    {children && (
      <Group gap="sm" wrap="wrap" justify="flex-end">
        {children}
      </Group>
    )}
  </Stack>
);

export default AccountControlsStack;
