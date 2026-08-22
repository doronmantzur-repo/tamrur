// React
import { useState } from "react";

// External libraries
import { useMantineColorScheme } from "@mantine/core";
import { motion, AnimatePresence } from "framer-motion";

const TRACK_W = 64;
const TRACK_H = 32;
const KNOB = 28;
const PAD = 2;
const TRAVEL = TRACK_W - KNOB - PAD * 2;

const STARS = [
  { top: "22%", left: "20%", delay: 0 },
  { top: "60%", left: "32%", delay: 0.6 },
  { top: "35%", left: "44%", delay: 1.1 },
];

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

const DUST = Array.from({ length: 8 }).map((_, i) => {
  const angle = ((i * 360) / 8) * (Math.PI / 180);
  return { x: Math.cos(angle) * 20, y: Math.sin(angle) * 20, delay: i * 0.02 };
});

/**
 * Renders the visor icon (helmet dome/rim/strap + a swappable amber-sun or
 * green-NVG visor) shown inside the knob. Colors come from the app's own
 * tokens — the dome/rim/strap reuse the gold brand ramp and surface tokens
 * rather than the original inspiration's invented olive-green, and the
 * visor housing itself is a neutral dark backing in both themes (a visor
 * frame doesn't change color with the time of day any more than real
 * hardware would).
 *
 * @param {{ isDark: boolean }} props
 * @returns {JSX.Element} The helmet visor icon.
 */
const HelmetVisor = ({ isDark }) => (
  <svg viewBox="0 0 24 24" style={{ width: "100%", height: "100%", overflow: "visible" }}>
    <path
      d="M3 14 C3 7 7 3.5 12 3.5 C17 3.5 21 7 21 14 L21 15 L3 15 Z"
      fill={isDark ? "var(--app-color-surface-high)" : "var(--mantine-color-brand-4)"}
      stroke={isDark ? "var(--app-color-background)" : "var(--app-color-primary)"}
      strokeWidth="0.6"
    />
    <rect x="3" y="14.5" width="18" height="2.4" rx="1" fill={isDark ? "var(--app-color-background)" : "var(--app-color-primary)"} />
    <path
      d="M5 16.5 C6 19 9 20 12 20 C15 20 18 19 19 16.5"
      fill="none"
      stroke={isDark ? "var(--app-color-background)" : "var(--app-color-primary-hover)"}
      strokeWidth="1"
      strokeLinecap="round"
    />
    <rect x="6" y="8.5" width="12" height="5" rx="2.4" fill="rgba(0,0,0,0.55)" />
    <path
      d="M12 9.6 L13.1 11.7 L15.4 11.9 L13.7 13.4 L14.2 15.6 L12 14.5 L9.8 15.6 L10.3 13.4 L8.6 11.9 L10.9 11.7 Z"
      fill="var(--app-color-warning)"
      opacity={isDark ? 0 : 1}
      style={{ transition: "opacity 0.4s ease" }}
    />
    <rect x="6.4" y="8.8" width="11.2" height="3.9" rx="2" fill="var(--app-color-success)" opacity={isDark ? 1 : 0} style={{ transition: "opacity 0.4s ease" }} />
    {isDark && (
      <motion.rect
        x="6.6"
        width="10.8"
        height="0.9"
        rx="0.45"
        fill="#B6FF7A"
        initial={{ y: 8.9, opacity: 0 }}
        animate={{ y: [8.9, 12.6, 8.9], opacity: 0.9 }}
        transition={{ y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.3 } }}
      />
    )}
  </svg>
);

/**
 * Dark/light theme toggle styled as a helmet sliding across a tank-tread
 * track — night mode shows a green NVG visor with a rotating radar ring and
 * twinkling stars, day mode shows an amber visor with one pulsing
 * sun-and-beams glyph and a soft breathing glow on the knob. Purely visual:
 * theme state and switching are still Mantine's own
 * `useMantineColorScheme`, unchanged from the plain sun/moon `ActionIcon`
 * this replaces everywhere it's used.
 *
 * @returns {JSX.Element} The theme toggle button.
 */
const ThemeToggle = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const [burstKey, setBurstKey] = useState(0);

  const handleClick = () => {
    setBurstKey((key) => key + 1);
    toggleColorScheme();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="החלף מצב תצוגה"
      title="החלף מצב תצוגה"
      style={{
        position: "relative",
        flexShrink: 0,
        width: TRACK_W,
        height: TRACK_H,
        padding: PAD,
        border: "none",
        borderRadius: TRACK_H,
        cursor: "pointer",
        background: isDark
          ? "linear-gradient(135deg, var(--app-color-background) 0%, var(--app-color-surface) 55%, var(--app-color-background) 100%)"
          : "linear-gradient(135deg, var(--mantine-color-brand-1) 0%, var(--mantine-color-brand-3) 55%, var(--app-color-primary) 100%)",
        boxShadow: isDark
          ? "inset 0 0 0 1.5px rgba(255,255,255,0.08), inset 0 2px 6px rgba(0,0,0,0.5), 0 4px 10px rgba(0,0,0,0.35)"
          : "inset 0 0 0 1.5px var(--app-color-border), inset 0 2px 5px rgba(120,95,40,0.18), 0 4px 10px rgba(120,95,40,0.25)",
        transition: "background 0.5s ease, box-shadow 0.5s ease",
      }}
    >
      {/* tread ticks — clipped to the pill so they can never poke past the rounded edge */}
      <span style={{ position: "absolute", inset: 0, borderRadius: "inherit", overflow: "hidden", pointerEvents: "none" }}>
        {[4, TRACK_H - 8].map((top) => (
          <span key={top} style={{ position: "absolute", insetInline: 9, top, display: "flex", justifyContent: "space-between" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: 2,
                  height: 4,
                  borderRadius: 1,
                  background: isDark ? "rgba(255,255,255,0.14)" : "var(--app-color-border)",
                  transition: "background 0.5s ease",
                }}
              />
            ))}
          </span>
        ))}
      </span>

      {/* night: twinkling star field */}
      <AnimatePresence>
        {isDark && (
          <motion.span
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {STARS.map((star) => (
              <motion.span
                key={star.left}
                style={{
                  position: "absolute",
                  top: star.top,
                  left: star.left,
                  width: 2,
                  height: 2,
                  borderRadius: "50%",
                  background: "#E8E2C0",
                  boxShadow: "0 0 3px #E8E2C0",
                }}
                animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4] }}
                transition={{ duration: 2.2, delay: star.delay, repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut" }}
              />
            ))}
          </motion.span>
        )}
      </AnimatePresence>

      {/* day: one pulsing sun with radiating beams — not a mirror of the star field */}
      <AnimatePresence>
        {!isDark && (
          <motion.span
            style={{ position: "absolute", top: "50%", left: "76%", pointerEvents: "none" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.span
              style={{ position: "relative", display: "block" }}
              animate={{ scale: [0.85, 1.2, 0.85], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <span
                style={{
                  position: "absolute",
                  top: -1.5,
                  left: -1.5,
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, #FFDD8A, var(--app-color-warning) 72%)",
                  boxShadow: "0 0 5px rgba(245, 158, 11, 0.75)",
                }}
              />
              {RAY_ANGLES.map((angle) => (
                <span
                  key={angle}
                  style={{
                    position: "absolute",
                    top: -1.7,
                    left: -0.65,
                    width: 1.3,
                    height: 3.4,
                    borderRadius: 1,
                    background: "var(--app-color-warning)",
                    transform: `rotate(${angle}deg) translateY(-4.6px)`,
                  }}
                />
              ))}
            </motion.span>
          </motion.span>
        )}
      </AnimatePresence>

      {/* knob = helmet — anchored with an explicit physical left/top (not flow
          position) so it has a fixed, direction-independent resting spot;
          this app is RTL, and an in-flow block defaults to the *right* edge
          under dir="rtl", which combined with translateX (never mirrored by
          direction) pushed the knob out past the track's right edge in dark
          mode instead of sliding a known distance from a known start */}
      <motion.span
        style={{
          position: "absolute",
          left: PAD,
          top: PAD,
          zIndex: 2,
          width: KNOB,
          height: KNOB,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDark
            ? "radial-gradient(circle at 32% 28%, var(--app-color-surface-high), var(--app-color-background) 78%)"
            : "radial-gradient(circle at 32% 28%, var(--mantine-color-brand-0), var(--app-color-primary-hover) 78%)",
          boxShadow: isDark
            ? "0 0 0 1.5px var(--app-color-surface-high), 0 0 9px rgba(34, 197, 94, 0.45), inset 0 1px 2px rgba(255,255,255,0.12)"
            : "0 0 0 1.5px var(--app-color-primary-hover), 0 0 10px rgba(245, 158, 11, 0.5), inset 0 1px 2px rgba(255,255,255,0.5)",
        }}
        animate={{ x: isDark ? TRAVEL : 0, rotate: isDark ? -8 : 8 }}
        transition={{ type: "spring", stiffness: 460, damping: 28 }}
      >
        {/* day-only breathing glow around the knob's rim */}
        <AnimatePresence>
          {!isDark && (
            <motion.span
              style={{
                position: "absolute",
                inset: -4,
                borderRadius: "50%",
                background: "var(--app-color-warning)",
                filter: "blur(4px)",
                pointerEvents: "none",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.25, 0.55, 0.25], scale: [0.9, 1.08, 0.9] }}
              exit={{ opacity: 0, transition: { duration: 0.3, repeat: 0 } }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>

        <span style={{ position: "relative", width: 20, height: 20 }}>
          {/* night-only rotating radar ring */}
          <AnimatePresence>
            {isDark && (
              <motion.span
                style={{
                  position: "absolute",
                  inset: -2,
                  borderRadius: "50%",
                  background:
                    "conic-gradient(from 0deg, color-mix(in srgb, var(--app-color-success) 55%, transparent), transparent 65%)",
                  pointerEvents: "none",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 0.3 }, rotate: { duration: 2.4, repeat: Infinity, ease: "linear" } }}
              />
            )}
          </AnimatePresence>

          <HelmetVisor isDark={isDark} />
        </span>
      </motion.span>

      {/* shockwave + dust burst on toggle */}
      <AnimatePresence>
        {burstKey > 0 && (
          <span key={burstKey} style={{ position: "absolute", left: "50%", top: "50%", pointerEvents: "none" }}>
            <motion.span
              style={{
                position: "absolute",
                left: -5,
                top: -5,
                width: 10,
                height: 10,
                borderRadius: "50%",
                border: `2px solid ${isDark ? "#7EC850" : "var(--app-color-primary)"}`,
              }}
              initial={{ opacity: 0.8, scale: 0.4 }}
              animate={{ opacity: 0, scale: 3.2 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
            {DUST.map((dust, i) => (
              <motion.span
                key={i}
                style={{
                  position: "absolute",
                  left: -1.5,
                  top: -1.5,
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: isDark ? "#9AC870" : "#A89050",
                }}
                initial={{ x: 0, y: 0, opacity: 0.9, scale: 1 }}
                animate={{ x: dust.x, y: dust.y, opacity: 0, scale: 0.2 }}
                transition={{ duration: 0.7, delay: dust.delay, ease: "easeOut" }}
              />
            ))}
          </span>
        )}
      </AnimatePresence>
    </button>
  );
};

export default ThemeToggle;
