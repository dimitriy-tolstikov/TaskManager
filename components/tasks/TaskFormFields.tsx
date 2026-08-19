"use client";

import type { TaskPriority, TaskStatus } from "@prisma/client";

import { FormSelect } from "@/components/tasks/FormSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AreaDto } from "@/lib/apiClient";
import { RECURRENCE_LABELS, type RecurrenceKind } from "@/lib/recurrence";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/taskUtils";

export interface TaskFormState {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  dueAt: string;
  estimateMin: string;
  tags: string;
  recurrence: RecurrenceKind;
}

interface TaskFormFieldsProps {
  value: TaskFormState;
  areas: AreaDto[];
  onChange: (patch: Partial<TaskFormState>) => void;
}

const statusOptions = Object.entries(STATUS_LABELS);
const priorityOptions = Object.entries(PRIORITY_LABELS);
const recurrenceOptions = Object.entries(RECURRENCE_LABELS);

export function TaskFormFields({ value, areas, onChange }: TaskFormFieldsProps) {
  const projectOptions: [string, string][] = areas.flatMap((area) =>
    area.projects.map((project): [string, string] => [
      project.id,
      `${area.name} / ${project.name}`,
    ]),
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="task-title">Название</Label>
        <Input
          id="task-title"
          value={value.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="task-description">Описание</Label>
        <Textarea
          id="task-description"
          value={value.description}
          onChange={(event) => onChange({ description: event.target.value })}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormSelect
          label="Статус"
          value={value.status}
          options={statusOptions}
          onChange={(status) => onChange({ status: status as TaskStatus })}
        />
        <FormSelect
          label="Приоритет"
          value={value.priority}
          options={priorityOptions}
          onChange={(priority) => onChange({ priority: priority as TaskPriority })}
        />
      </div>
      <FormSelect
        label="Проект"
        value={value.projectId}
        options={projectOptions}
        onChange={(projectId) => onChange({ projectId })}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="task-due">Дедлайн</Label>
          <Input
            id="task-due"
            type="datetime-local"
            value={value.dueAt}
            onChange={(event) => onChange({ dueAt: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="task-estimate">Оценка, мин</Label>
          <Input
            id="task-estimate"
            type="number"
            min={0}
            value={value.estimateMin}
            onChange={(event) => onChange({ estimateMin: event.target.value })}
          />
        </div>
      </div>
      <FormSelect
        label="Повтор"
        value={value.recurrence}
        options={recurrenceOptions}
        onChange={(recurrence) => onChange({ recurrence: recurrence as RecurrenceKind })}
      />
      <div className="space-y-1.5">
        <Label htmlFor="task-tags">Теги (через запятую)</Label>
        <Input
          id="task-tags"
          value={value.tags}
          onChange={(event) => onChange({ tags: event.target.value })}
          placeholder="срочно, дом"
        />
      </div>
    </div>
  );
}
