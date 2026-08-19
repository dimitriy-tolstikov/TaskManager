"use client";

import { MoreHorizontal, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteArea,
  deleteProject,
  type AreaDto,
  type ProjectDto,
  type TaskFilterState,
} from "@/lib/apiClient";
import { cn } from "@/lib/utils";

interface SidebarDialogs {
  openAreaDialog: (area: AreaDto) => void;
  openProjectDialog: (areaId: string, project?: ProjectDto) => void;
}

interface SidebarAreaProps {
  area: AreaDto;
  filters: TaskFilterState;
  onSelect: (areaId?: string, projectId?: string) => void;
  onDataChanged: () => Promise<void>;
  dialogs: SidebarDialogs;
}

const itemClass =
  "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-muted";

export function SidebarArea({ area, filters, onSelect, onDataChanged, dialogs }: SidebarAreaProps) {
  async function handleDeleteArea() {
    if (window.confirm(`Удалить направление «${area.name}» со всеми проектами и задачами?`)) {
      await deleteArea(area.id);
      await onDataChanged();
    }
  }

  async function handleDeleteProject(project: ProjectDto) {
    if (window.confirm(`Удалить проект «${project.name}» со всеми задачами?`)) {
      await deleteProject(project.id);
      await onDataChanged();
    }
  }

  return (
    <div className="mb-1">
      <div className="group flex items-center gap-1">
        <button
          type="button"
          className={cn(itemClass, filters.areaId === area.id && !filters.projectId && "bg-muted")}
          onClick={() => onSelect(area.id)}
        >
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: area.color }}
          />
          <span className="flex-1 truncate font-medium">{area.name}</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-xs" aria-label="Меню направления" />}
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => dialogs.openAreaDialog(area)}>
              Переименовать
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleDeleteArea}>
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="ml-4">
        {area.projects.map((project) => (
          <div key={project.id} className="group/project flex items-center gap-1">
            <button
              type="button"
              className={cn(itemClass, filters.projectId === project.id && "bg-muted")}
              onClick={() => onSelect(area.id, project.id)}
            >
              <span className="flex-1 truncate text-muted-foreground">{project.name}</span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="opacity-0 group-hover/project:opacity-100"
                    aria-label="Меню проекта"
                  />
                }
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => dialogs.openProjectDialog(area.id, project)}>
                  Переименовать
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => void handleDeleteProject(project)}
                >
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
        <button
          type="button"
          className={cn(itemClass, "text-muted-foreground")}
          onClick={() => dialogs.openProjectDialog(area.id)}
        >
          <Plus className="size-3.5" /> Проект
        </button>
      </div>
    </div>
  );
}
