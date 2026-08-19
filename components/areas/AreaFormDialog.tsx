"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createArea, updateArea, type AreaDto } from "@/lib/apiClient";

interface AreaFormDialogProps {
  area: AreaDto | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

/** Mounted only while open, so the form state initializes from props. */
export function AreaFormDialog({ area, onClose, onSaved }: AreaFormDialogProps) {
  const [name, setName] = useState(area?.name ?? "");
  const [color, setColor] = useState(area?.color ?? "#3b82f6");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      if (area) {
        await updateArea(area.id, { name, color });
      } else {
        await createArea({ name, color });
      }
      await onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Что-то пошло не так");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{area ? "Переименовать направление" : "Новое направление"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="area-name">Название</Label>
            <Input
              id="area-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="area-color">Цвет</Label>
            <Input
              id="area-color"
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="h-9 w-16 p-1"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSaving || !name.trim()}>
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
