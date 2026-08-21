// React
import { useState } from "react";

// External libraries
import { ActionIcon, Box, Button, Checkbox, Group, Popover, ScrollArea, Stack, Table, Text } from "@mantine/core";
import { IconChevronDown, IconChevronUp, IconFilter, IconSearch } from "@tabler/icons-react";

// Internal application modules

// Styles

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
}) => {
  const [search, setSearch] = useState("");

  const sortable = Boolean(onSortClick);
  const filterable = Boolean(filterOptions);
  const filterActive = Boolean(activeFilterValues?.size);
  const visibleOptions = filterOptions?.filter((option) => option.label.includes(search)) ?? [];

  return (
    <Table.Th w={w}>
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
                styles={{
                  root: filterActive
                    ? { color: "var(--app-color-primary)" }
                    : { color: "var(--app-color-text-muted)" },
                }}
              >
                <IconFilter size={14} stroke={1.8} />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown>
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
                      />
                    ))}
                    {visibleOptions.length === 0 && (
                      <Text fz="xs" c="var(--app-color-text-muted)">
                        אין תוצאות
                      </Text>
                    )}
                  </Stack>
                </ScrollArea.Autosize>
                {filterActive && (
                  <Button size="xs" variant="subtle" onClick={onClearFilter}>
                    נקה סינון
                  </Button>
                )}
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
