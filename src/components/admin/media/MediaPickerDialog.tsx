"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MediaGallery } from "./MediaGallery";

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

export function MediaPickerDialog({ open, onOpenChange, onSelect }: MediaPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Médiathèque</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Sélectionnez une image de la galerie ou téléchargez-en une nouvelle.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-1">
            <MediaGallery 
                onSelect={(url) => {
                    onSelect(url);
                    onOpenChange(false);
                }} 
                className="h-full"
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}
