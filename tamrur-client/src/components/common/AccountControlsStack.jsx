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
 * `align` controls which edge both rows line up against — "flex-end" (the
 * default) is the visual left in this app's RTL layout, matching where
 * AccountBar has always sat; pass "flex-start" for a container that isn't
 * itself already flush against that edge (e.g. an absolutely-positioned
 * corner cluster written with physical, not logical, CSS).
 *
 * @param {{ children?: React.ReactNode, align?: "flex-start" | "flex-end", style?: React.CSSProperties }} props
 * @returns {JSX.Element} The two-row account/controls stack.
 */
const AccountControlsStack = ({ children, align = "flex-end", style }) => (
  <Stack gap="xs" align={align} style={style}>
    <AccountBar />
    {children && (
      <Group gap="sm" wrap="wrap" justify={align}>
        {children}
      </Group>
    )}
  </Stack>
);

export default AccountControlsStack;
