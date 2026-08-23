// External libraries
import { ActionIcon, Divider, Group, Text } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

// Internal application modules
import { logout } from "../../features/auth/authSlice";
import { ROLE_LABELS } from "../../constants/roles";
import { useHoverState } from "../../hooks/useHoverState";

// Styles

const GLASS_CHIP_STYLES = {
  backgroundColor: "color-mix(in srgb, var(--app-color-surface) 32%, transparent)",
  borderColor: "color-mix(in srgb, var(--app-color-border) 22%, transparent)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.15)",
};

/** Logout button's resting look. Its hover is applied via useHoverState, not a `styles` "&:hover" key — Mantine's `styles` prop merges straight into an inline `style` attribute and doesn't compile pseudo-selectors into real CSS. */
const LOGOUT_STYLE = {
  ...GLASS_CHIP_STYLES,
  color: "var(--app-color-text)",
  transition: "background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease",
};

const LOGOUT_HOVER_STYLE = {
  backgroundColor: "color-mix(in srgb, var(--app-color-error) 14%, transparent)",
  borderColor: "color-mix(in srgb, var(--app-color-error) 40%, transparent)",
  color: "var(--app-color-error)",
  transform: "translateY(-1px)",
};

/**
 * The event dashboard's account cluster: the signed-in role (no username
 * exists in this app, so the mockup's name+role user-chip collapses to
 * role-only), a divider, and a logout button — glass-styled to match the
 * dashboard's theme toggle and event-action buttons (see ThemeToggleButton's
 * `variant="glass"`).
 *
 * @returns {JSX.Element} The role chip + divider + logout control.
 */
const AccountBar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [isLogoutHovered, logoutHoverHandlers] = useHoverState();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  return (
    <Group gap="sm" wrap="nowrap" align="center">
      <Group
        gap={0}
        wrap="nowrap"
        style={{
          ...GLASS_CHIP_STYLES,
          border: "1px solid",
          borderRadius: 999,
          padding: "0.5rem 0.9rem",
        }}
      >
        <Text fz="sm" fw={600} c="var(--app-color-text)">
          {ROLE_LABELS[user?.role] || user?.role}
        </Text>
      </Group>

      <Divider orientation="vertical" color="color-mix(in srgb, var(--app-color-border) 40%, transparent)" h="1.5rem" />

      <ActionIcon
        aria-label="התנתק"
        title="התנתק"
        size={40}
        radius="xl"
        onClick={handleLogout}
        {...logoutHoverHandlers}
        style={isLogoutHovered ? { ...LOGOUT_STYLE, ...LOGOUT_HOVER_STYLE } : LOGOUT_STYLE}
      >
        <IconLogout aria-hidden="true" size={20} stroke={1.8} />
      </ActionIcon>
    </Group>
  );
};

export default AccountBar;
