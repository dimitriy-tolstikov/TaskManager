"use client";

import { useCallback, useEffect, useState } from "react";

import { listTasks, type TaskDto, type TaskFilterState } from "@/lib/apiClient";

const REFRESH_DEBOUNCE_MS = 300;

export function useTasks(filters: TaskFilterState) {
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const query = JSON.stringify(filters);

  const refresh = useCallback(async () => {
    setTasks(await listTasks(JSON.parse(query) as TaskFilterState));
    setIsLoading(false);
  }, [query]);

  useEffect(() => {
    // Debounce so typing in the search box does not fire a request per keystroke.
    const timer = setTimeout(() => {
      setIsLoading(true);
      void refresh();
    }, REFRESH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [refresh]);

  return { tasks, isLoading, refresh };
}
