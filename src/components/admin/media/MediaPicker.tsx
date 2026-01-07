"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon } from "lucide-react";
import { MediaGallery } from "./MediaGallery";
import { useState } from "react";

interface MediaPickerProps {
  onSelect: (url: string) => void;
  trigger?: React.ReactNode;
  value?: string;
}

export function MediaPicker({ onSelect, trigger, value }: MediaPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (url: string) => {
    onSelect(url);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full h-32 flex flex-col gap-2 border-dashed">
            {value ? (
               <div className="relative w-full h-full"> 
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={value} alt="Selected" className="w-full h-full object-contain" />
               </div>
            ) : (
                <>
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <span className="text-muted-foreground">Choisir une image</span>
                </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col bg-zinc-50 dark:bg-zinc-900 border-none">
        <DialogHeader>
          <DialogTitle>Médiathèque</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden p-1">
            <MediaGallery onSelect={handleSelect} selectedUrl={value} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
