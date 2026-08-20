"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AreaDto } from "@/lib/apiClient";

export interface GoalTargetForm {
  scope: string;
  requiredCount: string;
}

interface GoalTargetRowProps {
  value: GoalTargetForm;
  areas: AreaDto[];
  onChange: (value: GoalTargetForm) => void;
  onRemove: () => void;
}

export function GoalTargetRow({ value, areas, onChange, onRemove }: GoalTargetRowProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={value.scope}
        onValueChange={(scope) => onChange({ ...value, scope: scope ?? "" })}
      >
        <SelectTrigger aria-label="Направление или проект" className="flex-1">
          <SelectValue placeholder="Выберите направление или проект" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Направления</SelectLabel>
            {areas.map((area) => (
              <SelectItem key={area.id} value={`area:${area.id}`}>
                {area.name}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Проекты</SelectLabel>
            {areas.flatMap((area) =>
              area.projects.map((project) => (
                <SelectItem key={project.id} value={`project:${project.id}`}>
                  {area.name} / {project.name}
                </SelectItem>
              )),
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Input
        type="number"
        min={1}
        max={100}
        aria-label="Количество задач"
        className="w-20"
        value={value.requiredCount}
        onChange={(e) => onChange({ ...value, requiredCount: e.target.value })}
      />
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        ✕
      </Button>
    </div>
  );
}
