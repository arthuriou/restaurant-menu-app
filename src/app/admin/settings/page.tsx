"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Store, Bell, Palette, Save, QrCode, Copy, ExternalLink, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [siteUrl, setSiteUrl] = useState("https://restaurant-app.com");
  const [currency, setCurrency] = useState("XOF");
  const [socials, setSocials] = useState({
    facebook: "",
    instagram: "",
    tiktok: ""
  });
  const [theme, setTheme] = useState("dark");

  const handleSave = () => {
    toast.success("Paramètres enregistrés avec succès");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Paramètres</h2>
          <p className="text-muted-foreground mt-1">Gérez la configuration générale de votre restaurant.</p>
        </div>
        <Button onClick={handleSave} className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4 mr-2" /> Enregistrer
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl inline-flex w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 sm:flex-none">
            <Store className="w-4 h-4 mr-2" /> Général
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 sm:flex-none">
            <Palette className="w-4 h-4 mr-2" /> Apparence
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 sm:flex-none">
            <Bell className="w-4 h-4 mr-2" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="qrcode" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 sm:flex-none">
            <QrCode className="w-4 h-4 mr-2" /> QR Code & Accès
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader>
              <CardTitle>Informations du Restaurant</CardTitle>
              <CardDescription>Ces informations seront visibles sur votre menu numérique.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="url">URL du Site</Label>
                <div className="flex gap-2">
                  <Input 
                    id="url" 
                    value={siteUrl} 
                    onChange={(e) => setSiteUrl(e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" 
                  />
                  <Button variant="outline" size="icon" onClick={() => {
                    navigator.clipboard.writeText(siteUrl);
                    toast.success("Lien copié !");
                  }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">L'adresse web où vos clients pourront accéder au menu.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="currency">Devise</Label>
                  <select 
                    id="currency" 
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="XOF">FCFA (XOF)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">Dollar ($)</option>
                    <option value="GBP">Livre (£)</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" placeholder="+225 07 00 00 00 00" />
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Label>Réseaux Sociaux</Label>
                <div className="grid gap-3">
                  <div className="relative">
                    <Input 
                      placeholder="Lien Facebook" 
                      className="pl-9" 
                      value={socials.facebook}
                      onChange={(e) => setSocials({...socials, facebook: e.target.value})}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">FB</div>
                  </div>
                  <div className="relative">
                    <Input 
                      placeholder="Lien Instagram" 
                      className="pl-9"
                      value={socials.instagram}
                      onChange={(e) => setSocials({...socials, instagram: e.target.value})}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">IG</div>
                  </div>
                  <div className="relative">
                    <Input 
                      placeholder="Lien TikTok" 
                      className="pl-9"
                      value={socials.tiktok}
                      onChange={(e) => setSocials({...socials, tiktok: e.target.value})}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">TK</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader>
              <CardTitle>Personnalisation</CardTitle>
              <CardDescription>Adaptez l'apparence de votre menu à votre image de marque.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Mode Sombre</Label>
                  <p className="text-sm text-muted-foreground">Activer le thème sombre par défaut.</p>
                </div>
                <Switch 
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Animations</Label>
                  <p className="text-sm text-muted-foreground">Activer les animations de transition.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader>
              <CardTitle>Alertes & Sons</CardTitle>
              <CardDescription>Configurez comment vous souhaitez être notifié des nouvelles commandes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Son de notification</Label>
                  <p className="text-sm text-muted-foreground">Jouer un son à chaque nouvelle commande.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notifications Push</Label>
                  <p className="text-sm text-muted-foreground">Recevoir des notifications sur votre appareil.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qrcode">
          <Card className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader>
              <CardTitle>Accès Client & QR Code</CardTitle>
              <CardDescription>Gérez l'accès public à votre menu numérique.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label>URL du Site</Label>
                <div className="flex gap-2">
                  <Input value={siteUrl} readOnly className="bg-zinc-50 dark:bg-zinc-900" />
                  <Button variant="outline" size="icon" onClick={() => {
                    navigator.clipboard.writeText(siteUrl);
                    toast.success("Lien copié !");
                  }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 items-center bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <QRCodeSVG value={`${siteUrl}?type=takeaway`} size={150} />
                </div>
                <div className="space-y-4 text-center sm:text-left">
                  <div>
                    <h3 className="font-bold text-lg">QR Code "À Emporter"</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Ce QR code permet aux clients d'accéder au menu en mode "À emporter" (sans numéro de table).
                      Idéal pour l'affichage à l'entrée ou sur vos flyers.
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center sm:justify-start">
                    <Button variant="outline" onClick={() => {
                      navigator.clipboard.writeText(`${siteUrl}?type=takeaway`);
                      toast.success("Lien copié !");
                    }}>
                      <Copy className="w-4 h-4 mr-2" /> Copier Lien
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90">
                      <Download className="w-4 h-4 mr-2" /> Télécharger
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
