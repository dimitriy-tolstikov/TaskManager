"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

interface FormSelectProps {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}

export function FormSelect({ label, value, options, onChange }: FormSelectProps) {
  // Radix shows the raw value until content mounts, so resolve the label ourselves.
  const currentLabel = options.find(([optionValue]) => optionValue === value)?.[1] ?? value;
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(next) => next && onChange(next)}>
        <SelectTrigger aria-label={label} className="w-full">
          {currentLabel}
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
