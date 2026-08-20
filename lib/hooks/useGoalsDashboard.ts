"use client";

import { useCallback, useEffect, useState } from "react";

import { getGoalsDashboard, type GoalsDashboardDto } from "@/lib/apiClient";

const REFRESH_INTERVAL_MS = 60_000;

const EMPTY_DASHBOARD: GoalsDashboardDto = { current: [], upcomingToday: [], overdue: [] };

export function useGoalsDashboard() {
  const [dashboard, setDashboard] = useState<GoalsDashboardDto>(EMPTY_DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setDashboard(await getGoalsDashboard());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Defer the initial fetch so no setState runs synchronously in the effect.
    const initial = setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [refresh]);

  return { dashboard, isLoading, refresh };
}
