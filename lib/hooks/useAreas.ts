"use client";

import { useCallback, useEffect, useState } from "react";

import { listAreas, type AreaDto } from "@/lib/apiClient";

export function useAreas() {
  const [areas, setAreas] = useState<AreaDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setAreas(await listAreas());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  return { areas, isLoading, refresh };
}
