// React
import { useState } from "react";

// External libraries
import { ActionIcon, Button, Checkbox, Group, Popover, ScrollArea, Stack, Table, Text, TextInput } from "@mantine/core";
import { IconChevronDown, IconChevronUp, IconFilter, IconSearch } from "@tabler/icons-react";

// Internal application modules

// Styles

/**
 * A `Table.Th` with an optional click-to-sort label (single active column
 * app-wide, cycling none -> asc -> desc -> none, shown as a chevron — no
 * icon while unsorted) and an optional filter popover (searchable checklist
 * of that column's distinct values).
 *
 * @param {{
 *   label: string,
 *   sortDirection?: "asc" | "desc" | null,
 *   onSortClick?: () => void,
 *   filterOptions?: Array<{ value: string, label: string }>,
 *   activeFilterValues?: Set<string>,
 *   onToggleFilterValue?: (value: string) => void,
 *   onClearFilter?: () => void,
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
}) => {
  const [search, setSearch] = useState("");

  const sortable = Boolean(onSortClick);
  const filterable = Boolean(filterOptions);
  const filterActive = Boolean(activeFilterValues?.size);
  const visibleOptions = filterOptions?.filter((option) => option.label.includes(search)) ?? [];

  return (
    <Table.Th>
      <Group gap={4} wrap="nowrap" justify="space-between">
        <Group
          gap={4}
          wrap="nowrap"
          onClick={onSortClick}
          style={{ cursor: sortable ? "pointer" : "default", userSelect: "none" }}
        >
          <Text fz="sm" fw={700}>
            {label}
          </Text>
          {sortDirection === "asc" && <IconChevronUp size={14} stroke={2.2} />}
          {sortDirection === "desc" && <IconChevronDown size={14} stroke={2.2} />}
        </Group>

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
                <TextInput
                  placeholder="חיפוש"
                  size="xs"
                  value={search}
                  onChange={(event) => setSearch(event.currentTarget.value)}
                  leftSection={<IconSearch size={14} />}
                />
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
      </Group>
    </Table.Th>
  );
};

export default ColumnHeader;
