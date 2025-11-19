"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface TableSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTable: string;
  onSelectTable: (table: string) => void;
  forceSelection?: boolean;
}

export function TableSelector({ 
  open, 
  onOpenChange, 
  currentTable, 
  onSelectTable,
  forceSelection = false
}: TableSelectorProps) {
  const [value, setValue] = useState(currentTable);

  useEffect(() => {
    setValue(currentTable);
  }, [currentTable]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSelectTable(value.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !forceSelection && onOpenChange(val)}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => forceSelection && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Numéro de table</DialogTitle>
          <DialogDescription>
            Veuillez indiquer votre numéro de table pour que nous puissions vous servir.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="table-number">Votre table</Label>
            <Input
              id="table-number"
              placeholder="Ex: 12"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
          </div>
          
          <DialogFooter>
            <Button type="submit" disabled={!value.trim()} className="w-full sm:w-auto">
              Confirmer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
