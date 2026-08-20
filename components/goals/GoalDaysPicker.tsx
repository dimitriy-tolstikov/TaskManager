"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DAY_LABELS, DAY_ORDER } from "@/lib/goalFormat";

interface GoalDaysPickerProps {
  value: number[];
  onChange: (days: number[]) => void;
}

export function GoalDaysPicker({ value, onChange }: GoalDaysPickerProps) {
  function toggle(day: number, checked: boolean) {
    onChange(checked ? [...value, day] : value.filter((item) => item !== day));
  }

  return (
    <div className="space-y-1.5">
      <Label>Дни недели</Label>
      <div className="flex flex-wrap gap-3">
        {DAY_ORDER.map((day) => (
          <label key={day} className="flex items-center gap-1.5 text-sm">
            <Checkbox
              checked={value.includes(day)}
              onCheckedChange={(checked) => toggle(day, checked === true)}
            />
            {DAY_LABELS[day]}
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Не выбрано ни одного дня — цель ежедневная</p>
    </div>
  );
}
