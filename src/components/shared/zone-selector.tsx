"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store/app-store";

export function ZoneSelector({
  value,
  onChange,
  placeholder = "All zones",
  allowAll = false,
  className,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  allowAll?: boolean;
  className?: string;
}) {
  const zones = useAppStore((state) => state.zones);

  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next)}
    >
      <SelectTrigger className={className ?? "h-9 w-full min-w-40 bg-white"}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {allowAll ? <SelectItem value="all">All zones</SelectItem> : null}
        {zones.map((zone) => (
          <SelectItem key={zone.id} value={zone.id}>
            {zone.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
