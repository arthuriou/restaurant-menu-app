"use client";

import { MediaGallery } from "@/components/admin/media/MediaGallery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GalleryPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Médiathèque</h2>
        <p className="text-muted-foreground mt-1">
          Gérez toutes les images de votre restaurant (plats, logos, bannières).
        </p>
      </div>

      <Card className="rounded-2xl border-none shadow-sm bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Vos Images</CardTitle>
          <CardDescription>
            Images stockées sur le serveur sécurisé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MediaGallery className="min-h-[400px]" />
        </CardContent>
      </Card>
    </div>
  );
}
