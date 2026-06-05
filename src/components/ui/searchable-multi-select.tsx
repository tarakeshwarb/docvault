"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Command } from "cmdk";

import { cn } from "@/lib/utils";
import { Button } from "./button";

type Option = {
  label: string;
  value: string;
};

export function SearchableMultiSelect({
  options,
  values,
  onChange,
  placeholder = "Select...",
  emptyMessage = "No results found.",
}: {
  options: Option[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const selectedLabels = values
    .map((value) => options.find((option) => option.value === value)?.label)
    .filter((label): label is string => Boolean(label));

  const toggleValue = (nextValue: string) => {
    if (values.includes(nextValue)) {
      onChange(values.filter((value) => value !== nextValue));
      return;
    }

    onChange([...values, nextValue]);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-auto min-h-10 w-full justify-between px-3 py-2 text-left"
        >
          <span className="mr-3 line-clamp-1 flex-1 text-left text-sm text-[var(--color-ink)]">
            {selectedLabels.length > 0 ? (
              selectedLabels.length === 1 ? (
                selectedLabels[0]
              ) : (
                `${selectedLabels.length} selected`
              )
            ) : (
              <span className="text-[var(--color-muted)]">{placeholder}</span>
            )}
          </span>
          <span className="flex items-center gap-1">
            {selectedLabels.length > 0 ? (
              <span className="inline-flex items-center rounded-full bg-[var(--color-ink)]/5 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-ink)]">
                {selectedLabels.length}
              </span>
            ) : null}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </span>
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-md border border-black/10 bg-white p-0 shadow-lg outline-none"
          align="start"
        >
          <Command className="flex h-full w-full flex-col overflow-hidden rounded-md bg-white text-gray-950">
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
              <Command.Input
                placeholder="Search..."
                className="h-8 w-full rounded-md border-0 bg-transparent px-0 text-sm outline-none placeholder:text-gray-500"
              />
              {values.length > 0 ? (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="inline-flex items-center gap-1 rounded-full border border-black/10 px-2 py-1 text-[11px] font-medium text-gray-500 transition hover:text-[var(--color-ink)]"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              ) : null}
            </div>
            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
              <Command.Empty className="py-6 text-center text-sm text-gray-500">
                {emptyMessage}
              </Command.Empty>
              <Command.Group>
                {options.map((option) => (
                  <Command.Item
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => toggleValue(option.value)}
                    className={cn(
                      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 aria-selected:bg-gray-100"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        values.includes(option.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1">{option.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}