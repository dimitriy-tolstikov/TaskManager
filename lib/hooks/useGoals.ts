"use client";

import { useCallback, useEffect, useState } from "react";

import { listGoals, type GoalDto } from "@/lib/apiClient";

export function useGoals() {
  const [goals, setGoals] = useState<GoalDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setGoals(await listGoals());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Defer the initial fetch so no setState runs synchronously in the effect.
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  return { goals, isLoading, refresh };
}
