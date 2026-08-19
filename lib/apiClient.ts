import type { TaskPriority, TaskStatus } from "@prisma/client";

export interface ProjectDto {
  id: string;
  areaId: string;
  name: string;
  archived: boolean;
}

export interface AreaDto {
  id: string;
  name: string;
  color: string;
  position: number;
  projects: ProjectDto[];
}

export interface SubtaskDto {
  id: string;
  taskId: string;
  title: string;
  done: boolean;
  position: number;
}

export interface TagDto {
  id: string;
  name: string;
}

export interface TaskDto {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  estimateMin: number | null;
  completedAt: string | null;
  createdAt: string;
  subtasks: SubtaskDto[];
  tags: { tag: TagDto }[];
  project: { id: string; name: string; areaId: string };
}

export interface TaskFilterState {
  areaId?: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  tag?: string;
  q?: string;
  overdue?: boolean;
}

export interface CreateTaskPayload {
  title: string;
  projectId?: string;
  areaId?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueAt?: string | null;
  estimateMin?: number | null;
  tags?: string[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Что-то пошло не так");
  }
  return response.json() as Promise<T>;
}

export function buildTaskQuery(filters: TaskFilterState): string {
  const params = new URLSearchParams();
  if (filters.areaId) params.set("areaId", filters.areaId);
  if (filters.projectId) params.set("projectId", filters.projectId);
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.q) params.set("q", filters.q);
  if (filters.overdue) params.set("overdue", "true");
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const listAreas = () => request<AreaDto[]>("/api/areas");

export const createArea = (input: { name: string; color?: string }) =>
  request<AreaDto>("/api/areas", { method: "POST", body: JSON.stringify(input) });

export const updateArea = (id: string, input: { name?: string; color?: string }) =>
  request<AreaDto>(`/api/areas/${id}`, { method: "PATCH", body: JSON.stringify(input) });

export const deleteArea = (id: string) =>
  request<{ ok: boolean }>(`/api/areas/${id}`, { method: "DELETE" });

export const createProject = (input: { name: string; areaId: string }) =>
  request<ProjectDto>("/api/projects", { method: "POST", body: JSON.stringify(input) });

export const updateProject = (id: string, input: { name?: string }) =>
  request<ProjectDto>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(input) });

export const deleteProject = (id: string) =>
  request<{ ok: boolean }>(`/api/projects/${id}`, { method: "DELETE" });

export const listTasks = (filters: TaskFilterState) =>
  request<TaskDto[]>(`/api/tasks${buildTaskQuery(filters)}`);

export const createTask = (input: CreateTaskPayload) =>
  request<TaskDto>("/api/tasks", { method: "POST", body: JSON.stringify(input) });

export const updateTask = (id: string, input: UpdateTaskPayload) =>
  request<TaskDto>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) });

export const deleteTask = (id: string) =>
  request<{ ok: boolean }>(`/api/tasks/${id}`, { method: "DELETE" });

export const addSubtask = (taskId: string, title: string) =>
  request<SubtaskDto>(`/api/tasks/${taskId}/subtasks`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });

export const updateSubtask = (id: string, input: { title?: string; done?: boolean }) =>
  request<SubtaskDto>(`/api/subtasks/${id}`, { method: "PATCH", body: JSON.stringify(input) });

export const deleteSubtask = (id: string) =>
  request<{ ok: boolean }>(`/api/subtasks/${id}`, { method: "DELETE" });

export const listTags = () => request<TagDto[]>("/api/tags");
