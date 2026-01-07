"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Upload, Trash2, Check, RefreshCcw, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CloudinaryImage {
  id: string;
  url: string;
  fileName: string;
  publicId: string;
  createdAt: string;
}

interface MediaGalleryProps {
  onSelect?: (url: string) => void;
  className?: string;
  selectedUrl?: string; // To highlight the currently selected one
}

export function MediaGallery({ onSelect, className, selectedUrl }: MediaGalleryProps) {
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cloudinary/gallery');
      const data = await res.json();
      
      if (data.images) {
        setImages(data.images);
      } else {
        console.error("Failed to load images", data.error);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      toast.error("Impossible de charger la galerie Cloudinary");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "restaurant_menu");
    formData.append("folder", "restaurant_menu"); // Organize in folder

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) throw new Error("Missing Cloudinary Cloud Name");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();

      if (data.secure_url) {
        toast.success("Image ajoutée avec succès");
        // Select immediately if in picker mode
        if (onSelect) onSelect(data.secure_url);
        // Refresh list
        fetchImages();
      } else {
        throw new Error(data.error?.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Images Cloudinary ({images.length})</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchImages} title="Rafraîchir">
                <RefreshCcw className={cn("h-3 w-3", isLoading && "animate-spin")} />
            </Button>
        </div>
        <div>
            <Button
                size="sm"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg"
            >
                {isUploading ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                ) : (
                    <Upload className="h-3 w-3 mr-2" />
                )}
                Uploader
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
            />
        </div>
      </div>

      {isLoading && images.length === 0 ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
            <ImageIcon className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Aucune image trouvée sur Cloudinary</p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Uploader votre première image
            </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[60vh] overflow-y-auto p-1 pr-2 custom-scrollbar">
          {images.map((img) => {
             const isSelected = selectedUrl === img.url;
             return (
              <div
                key={img.id}
                className={cn(
                    "group relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all bg-zinc-100 dark:bg-zinc-800",
                    isSelected ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                )}
                onClick={() => onSelect?.(img.url)}
              >
                <Image
                  src={img.url}
                  alt={img.fileName}
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover"
                />
                
                {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center pointer-events-none">
                        <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                            <Check className="h-4 w-4" />
                        </div>
                    </div>
                )}

                {/* Info Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-white">
                    {onSelect && !isSelected && (
                         <span className="text-xs font-bold bg-white text-black px-2 py-1 rounded-full mb-2">Choisir</span>
                    )}
                    <span className="text-[10px] truncate w-full text-center px-1">{img.fileName}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
