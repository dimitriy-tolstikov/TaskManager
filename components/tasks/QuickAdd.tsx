"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";

interface QuickAddProps {
  onAdd: (title: string) => Promise<void>;
}

export function QuickAdd({ onAdd }: QuickAddProps) {
  const [title, setTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  async function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || !title.trim() || isAdding) {
      return;
    }
    setIsAdding(true);
    try {
      await onAdd(title.trim());
      setTitle("");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <Input
      value={title}
      onChange={(event) => setTitle(event.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Быстро добавить задачу… (Enter)"
      aria-label="Быстрое добавление задачи"
      disabled={isAdding}
    />
  );
}
