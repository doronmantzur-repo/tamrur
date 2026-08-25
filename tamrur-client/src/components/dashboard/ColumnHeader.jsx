// React
import { useState } from "react";

// External libraries
import { ActionIcon, Box, Button, Checkbox, Group, Popover, ScrollArea, Stack, Table, Text } from "@mantine/core";
import { IconChevronDown, IconChevronUp, IconFilter, IconFilterFilled, IconSearch } from "@tabler/icons-react";

// Internal application modules
import { useHoverState } from "../../hooks/useHoverState";

// Styles

/**
 * The filter popover's "נקה סינון" (clear filter) button — hover/press
 * feedback is real state (`useHoverState` + local `isPressed`), not CSS
 * `&:hover`/`&:active` keys inside Mantine's `styles` prop: that prop
 * flattens straight into a plain inline `style` attribute here, so
 * pseudo-selectors inside it are silently dropped rather than compiled into
 * real CSS (same gotcha `CasualtyRow`/`EvacuationRow`/`ClearSearchButton`
 * already work around the same way). Isolated in its own component so this
 * hover state doesn't force `ColumnHeader` itself to re-render on every
 * mouse move — hooks can't run inside a conditional in the parent either way.
 *
 * @param {{ onClick: () => void }} props
 * @returns {JSX.Element} The clear-filter button.
 */
function ClearFilterButton({ onClick }) {
  const [isHovered, hoverHandlers] = useHoverState();
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Button
      size="xs"
      variant="subtle"
      onClick={onClick}
      {...hoverHandlers}
      onMouseLeave={() => {
        hoverHandlers.onMouseLeave();
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      styles={{
        root: {
          backgroundColor: "transparent",
          color: isHovered ? "var(--app-color-primary)" : "var(--app-color-text-muted)",
          textDecoration: isHovered ? "underline" : "none",
          transform: isPressed ? "scale(0.95)" : isHovered ? "scale(1.05)" : "scale(1)",
          transition: "color 0.15s ease, transform 0.15s ease",
        },
      }}
    >
      נקה סינון
    </Button>
  );
}

/**
 * A `Table.Th` with an optional click-to-sort label (single active column
 * app-wide, cycling none -> asc -> desc -> none) and an optional filter
 * popover (searchable checklist of that column's distinct values), laid out
 * label / filter icon / sort chevron in that order — the chevron's space is
 * always reserved (hidden, not unrendered) so sorting a column never
 * changes its width.
 *
 * @param {{
 *   label: string,
 *   sortDirection?: "asc" | "desc" | null,
 *   onSortClick?: () => void,
 *   filterOptions?: Array<{ value: string, label: string }>,
 *   activeFilterValues?: Set<string>,
 *   onToggleFilterValue?: (value: string) => void,
 *   onClearFilter?: () => void,
 *   w?: string | number,
 *   sticky?: boolean,
 * }} props
 * @returns {JSX.Element} The column header cell.
 */
const ColumnHeader = ({
  label,
  sortDirection,
  onSortClick,
  filterOptions,
  activeFilterValues,
  onToggleFilterValue,
  onClearFilter,
  w,
  sticky = false,
}) => {
  const [search, setSearch] = useState("");
  const [isFilterIconHovered, filterIconHoverHandlers] = useHoverState();

  const sortable = Boolean(onSortClick);
  const filterable = Boolean(filterOptions);
  const filterActive = Boolean(activeFilterValues?.size);
  const visibleOptions = filterOptions?.filter((option) => option.label.includes(search)) ?? [];

  // Same 4-state glyph/color treatment as the kanban board's own per-column
  // filter icon (QueueColumn.jsx's QueueFilterRow) — outline -> filled glyph
  // swap plus a color/background transition — just recolored from that
  // component's red "click to clear" semantics to primary/gold here, since
  // clicking this icon always opens the filter popover rather than clearing
  // directly (the popover has its own "נקה סינון" button for that).
  let filterIcon;
  let filterIconColor;
  let filterIconBackground = "transparent";

  if (filterActive) {
    filterIcon = <IconFilterFilled size={14} />;
    if (isFilterIconHovered) {
      filterIconBackground = "var(--app-color-primary)";
      filterIconColor = "var(--app-color-primary-text)";
    } else {
      filterIconColor = "var(--app-color-primary)";
    }
  } else if (isFilterIconHovered) {
    filterIcon = <IconFilterFilled size={14} />;
    filterIconColor = "var(--app-color-primary)";
  } else {
    filterIcon = <IconFilter size={14} stroke={1.8} />;
    filterIconColor = "var(--app-color-text-muted)";
  }

  return (
    <Table.Th
      w={w}
      style={
        sticky
          ? {
              position: "sticky",
              top: 0,
              zIndex: 1,
              backgroundColor: "var(--app-color-surface)",
              borderBottom: "1px solid var(--app-color-border)",
            }
          : undefined
      }
    >
      {/* Order is deliberate: label, then filter icon (right next to the
          label it belongs to), then the sort chevron last. flex-start (not
          space-between) keeps everything clustered together — in this RTL
          app that means all three sit on the right, rather than spread to
          the cell's far edge. Sorting triggers off the label and the
          chevron specifically (not the whole row), so a click on the filter
          icon only opens its own popover, never also toggles sort. */}
      <Group gap={4} wrap="nowrap" justify="flex-start">
        <Text
          fz="sm"
          fw={700}
          onClick={onSortClick}
          style={{ cursor: sortable ? "pointer" : "default", userSelect: "none" }}
        >
          {label}
        </Text>

        {filterable && (
          <Popover position="bottom-start" withArrow shadow="md" width={220}>
            <Popover.Target>
              <ActionIcon
                variant="subtle"
                size="sm"
                aria-label={`סינון ${label}`}
                {...filterIconHoverHandlers}
                styles={{
                  root: {
                    backgroundColor: filterIconBackground,
                    color: filterIconColor,
                    transition: "background-color 0.15s ease, color 0.15s ease",
                  },
                }}
              >
                {filterIcon}
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown
              p="sm"
              style={{
                backgroundColor: "var(--app-color-surface)",
                borderColor: "var(--app-color-border)",
              }}
            >
              <Stack gap="xs">
                {/* A plain HTML input, not Mantine's TextInput — same gotcha
                    as EventDescriptionBlock's textarea: Mantine wraps it in
                    an Input.Wrapper div the theme forces to mih="3rem" for
                    touch targets, with no reliable per-instance override. A
                    native element has no such wrapper, so it's styled
                    directly here to match (minus that min-height), with the
                    search icon positioned manually since there's no
                    leftSection to lean on. */}
                <Box style={{ position: "relative" }}>
                  <IconSearch
                    size={14}
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: "0.5rem",
                      transform: "translateY(-50%)",
                      color: "var(--app-color-text-muted)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="חיפוש"
                    value={search}
                    onChange={(event) => setSearch(event.currentTarget.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      backgroundColor: "var(--app-color-background)",
                      color: "var(--app-color-text)",
                      border: "1px solid var(--app-color-border)",
                      borderRadius: "0.25rem",
                      padding: "0.25rem 1.75rem 0.25rem 0.5rem",
                      fontFamily: "inherit",
                      fontSize: "0.75rem",
                      lineHeight: 1.4,
                      outline: "none",
                    }}
                  />
                </Box>
                <ScrollArea.Autosize mah={200}>
                  <Stack gap={6}>
                    {visibleOptions.map((option) => (
                      <Checkbox
                        key={option.value}
                        size="xs"
                        label={option.label}
                        checked={activeFilterValues?.has(option.value) ?? false}
                        onChange={() => onToggleFilterValue(option.value)}
                        color="var(--app-color-primary)"
                        styles={{ label: { fontSize: "0.8rem", color: "var(--app-color-text)" } }}
                      />
                    ))}
                    {visibleOptions.length === 0 && (
                      <Text fz="xs" c="var(--app-color-text-muted)">
                        אין תוצאות
                      </Text>
                    )}
                  </Stack>
                </ScrollArea.Autosize>
                {filterActive && <ClearFilterButton onClick={onClearFilter} />}
              </Stack>
            </Popover.Dropdown>
          </Popover>
        )}

        {/* Reserves the chevron's width at all times (hidden, not
            unrendered) instead of only when actually sorted — otherwise a
            sortable header's natural width grows the moment it's sorted,
            which (this table has no fixed column widths) squeezes every
            other column to compensate, visibly "shrinking" the whole table
            on every sort click. */}
        {sortable && (
          <Box
            onClick={onSortClick}
            style={{
              cursor: "pointer",
              visibility: sortDirection ? "visible" : "hidden",
              display: "flex",
            }}
          >
            {sortDirection === "desc" ? (
              <IconChevronDown size={14} stroke={2.2} />
            ) : (
              <IconChevronUp size={14} stroke={2.2} />
            )}
          </Box>
        )}
      </Group>
    </Table.Th>
  );
};

export default ColumnHeader;
