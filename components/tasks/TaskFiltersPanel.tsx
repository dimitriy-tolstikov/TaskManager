"use client";

import type { TaskPriority, TaskStatus } from "@prisma/client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TagDto, TaskFilterState } from "@/lib/apiClient";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/taskUtils";

interface TaskFiltersPanelProps {
  filters: TaskFilterState;
  tags: TagDto[];
  onChange: (filters: TaskFilterState) => void;
}

const ALL = "ALL";

const statusOptions = Object.entries(STATUS_LABELS) as [TaskStatus, string][];
const priorityOptions = Object.entries(PRIORITY_LABELS) as [TaskPriority, string][];

export function TaskFiltersPanel({ filters, tags, onChange }: TaskFiltersPanelProps) {
  function patch(update: Partial<TaskFilterState>) {
    onChange({ ...filters, ...update });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={filters.q ?? ""}
        onChange={(event) => patch({ q: event.target.value || undefined })}
        placeholder="Поиск…"
        aria-label="Поиск задач"
        className="w-48"
      />
      <Select
        value={filters.status ?? ALL}
        onValueChange={(value) =>
          patch({ status: value === ALL ? undefined : (value as TaskStatus) })
        }
      >
        <SelectTrigger aria-label="Фильтр по статусу">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Любой статус</SelectItem>
          {statusOptions.map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.priority ?? ALL}
        onValueChange={(value) =>
          patch({ priority: value === ALL ? undefined : (value as TaskPriority) })
        }
      >
        <SelectTrigger aria-label="Фильтр по приоритету">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Любой приоритет</SelectItem>
          {priorityOptions.map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {tags.length > 0 && (
        <Select
          value={filters.tag ?? ALL}
          onValueChange={(value) => patch({ tag: !value || value === ALL ? undefined : value })}
        >
          <SelectTrigger aria-label="Фильтр по тегу">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Любой тег</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.name}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox
          checked={filters.overdue ?? false}
          onCheckedChange={(checked) => patch({ overdue: checked ? true : undefined })}
        />
        Просроченные
      </Label>
    </div>
  );
}
