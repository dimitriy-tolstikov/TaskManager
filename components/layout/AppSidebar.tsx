"use client";

import { useState } from "react";

import { AreaFormDialog } from "@/components/areas/AreaFormDialog";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { SidebarArea } from "@/components/layout/SidebarArea";
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog";
import { Button } from "@/components/ui/button";
import type { AreaDto, ProjectDto, TaskFilterState } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  areas: AreaDto[];
  filters: TaskFilterState;
  userEmail: string;
  onFiltersChange: (filters: TaskFilterState) => void;
  onDataChanged: () => Promise<void>;
}

type AreaDialogState = { area: AreaDto | null } | null;
type ProjectDialogState = { areaId: string; project: ProjectDto | null } | null;

export function AppSidebar({
  areas,
  filters,
  userEmail,
  onFiltersChange,
  onDataChanged,
}: AppSidebarProps) {
  const [areaDialog, setAreaDialog] = useState<AreaDialogState>(null);
  const [projectDialog, setProjectDialog] = useState<ProjectDialogState>(null);

  function handleSelect(areaId?: string, projectId?: string) {
    onFiltersChange({ ...filters, areaId, projectId });
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col gap-2 border-r border-border p-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="truncate text-sm text-muted-foreground">{userEmail}</span>
        <LogoutButton />
      </div>
      <button
        type="button"
        className={cn(
          "rounded-md px-2 py-1 text-left text-sm font-medium hover:bg-muted",
          !filters.areaId && !filters.projectId && "bg-muted",
        )}
        onClick={() => handleSelect()}
      >
        Все задачи
      </button>
      <nav className="flex-1 overflow-y-auto">
        {areas.map((area) => (
          <SidebarArea
            key={area.id}
            area={area}
            filters={filters}
            onSelect={handleSelect}
            onDataChanged={onDataChanged}
            dialogs={{
              openAreaDialog: (area) => setAreaDialog({ area }),
              openProjectDialog: (areaId, project) =>
                setProjectDialog({ areaId, project: project ?? null }),
            }}
          />
        ))}
      </nav>
      <Button variant="outline" size="sm" onClick={() => setAreaDialog({ area: null })}>
        + Направление
      </Button>
      {areaDialog && (
        <AreaFormDialog
          area={areaDialog.area}
          onClose={() => setAreaDialog(null)}
          onSaved={onDataChanged}
        />
      )}
      {projectDialog && (
        <ProjectFormDialog
          areaId={projectDialog.areaId}
          project={projectDialog.project}
          onClose={() => setProjectDialog(null)}
          onSaved={onDataChanged}
        />
      )}
    </aside>
  );
}
