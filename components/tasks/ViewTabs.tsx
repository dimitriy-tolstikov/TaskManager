"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type TaskView = "list" | "kanban" | "today";

interface ViewTabsProps {
  view: TaskView;
  onChange: (view: TaskView) => void;
}

export function ViewTabs({ view, onChange }: ViewTabsProps) {
  return (
    <Tabs value={view} onValueChange={(value) => onChange(value as TaskView)}>
      <TabsList>
        <TabsTrigger value="list">Список</TabsTrigger>
        <TabsTrigger value="kanban">Канбан</TabsTrigger>
        <TabsTrigger value="today">Сегодня</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
