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
  currentTable: { id: string; label: string } | null;
  onSelectTable: (table: { id: string; label: string } | null) => void;
  forceSelection?: boolean;
}

export function TableSelector({ 
  open, 
  onOpenChange, 
  currentTable, 
  onSelectTable,
  forceSelection = false
}: TableSelectorProps) {
  const [step, setStep] = useState<'choice' | 'input'>('choice');
  const [value, setValue] = useState(currentTable?.label || "");

  useEffect(() => {
    if (open) {
      // If we already have a table (and it's not takeaway), go straight to input
      if (currentTable && currentTable.id !== 'takeaway') {
        setStep('input');
        setValue(currentTable.label.replace('Table ', ''));
      } else {
        setStep('choice');
        setValue("");
      }
    }
  }, [open, currentTable]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSelectTable({ id: `table-${value.trim()}`, label: `Table ${value.trim()}` });
      onOpenChange(false);
    }
  };

  const handleTakeaway = () => {
    onSelectTable({ id: "takeaway", label: "À emporter" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !forceSelection && onOpenChange(val)}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => forceSelection && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{step === 'choice' ? "Type de commande" : "Numéro de table"}</DialogTitle>
          <DialogDescription>
            {step === 'choice' 
              ? "Comment souhaitez-vous commander ?" 
              : "Veuillez indiquer votre numéro de table."}
          </DialogDescription>
        </DialogHeader>
        
        {step === 'choice' ? (
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary hover:text-primary transition-all"
              onClick={() => setStep('input')}
            >
              <span className="text-2xl">🍽️</span>
              <span className="font-bold">Sur place</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary hover:text-primary transition-all"
              onClick={handleTakeaway}
            >
              <span className="text-2xl">🛍️</span>
              <span className="font-bold">À emporter</span>
            </Button>
          </div>
        ) : (
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
            
            <DialogFooter className="flex-row gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setStep('choice')}>
                Retour
              </Button>
              <Button type="submit" disabled={!value.trim()}>
                Confirmer
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
