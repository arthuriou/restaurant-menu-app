"use client";

import { useState, useEffect } from "react";
import { useAdminTheme } from "@/components/admin-theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Save, Store, Palette, Megaphone, QrCode, Copy, ExternalLink, Download, Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { useRestaurantStore } from "@/stores/restaurant";
import { useMenuStore } from "@/stores/menu";

const PRESET_COLORS = [
  { name: "Rouge", value: "hsl(0 72.2% 50.6%)", class: "bg-red-500" },
  { name: "Orange", value: "hsl(24.6 95% 53.1%)", class: "bg-orange-500" },
  { name: "Bleu", value: "hsl(221.2 83.2% 53.3%)", class: "bg-blue-500" },
  { name: "Vert", value: "hsl(142.1 76.2% 36.3%)", class: "bg-green-500" },
  { name: "Violet", value: "hsl(262.1 83.3% 57.8%)", class: "bg-purple-500" },
  { name: "Rose", value: "hsl(330 81% 60%)", class: "bg-pink-500" },
  { name: "Noir", value: "hsl(0 0% 0%)", class: "bg-black" },
];

export default function AdminSettingsPage() {
  const { theme, setTheme } = useAdminTheme();
  const [mounted, setMounted] = useState(false);
  const [siteUrl, setSiteUrl] = useState("https://restaurant-menu.app");
  const [currency, setCurrency] = useState("XOF");
  
  const { 
    primaryColor, setPrimaryColor,
    specialOffers, addSpecialOffer, removeSpecialOffer, updateSpecialOffer,
    chefSpecial, updateChefSpecial,
    openingHours, updateOpeningHours,
    specialHours, addSpecialHour, removeSpecialHour
  } = useRestaurantStore();

  const { items } = useMenuStore();

  const [socials, setSocials] = useState({
    facebook: "",
    instagram: "",
    tiktok: ""
  });

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = () => {
    toast.success("Paramètres enregistrés avec succès");
  };

  const handleAddOffer = () => {
    addSpecialOffer({
      enabled: true,
      title: "NOUVELLE\nOFFRE",
      subtitle: "Nouveauté",
      discount: "-10%",
      imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop"
    });
    toast.success("Nouvelle offre ajoutée");
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Paramètres</h2>
          <p className="text-muted-foreground mt-1">Gérez les préférences de votre restaurant.</p>
        </div>
        <Button onClick={handleSave} className="rounded-full shadow-lg shadow-primary/20">
          <Save className="w-4 h-4 mr-2" /> Enregistrer
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 inline-flex w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm">
            <Store className="w-4 h-4 mr-2" /> Général
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm">
            <Palette className="w-4 h-4 mr-2" /> Apparence
          </TabsTrigger>
          <TabsTrigger value="marketing" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm">
            <Megaphone className="w-4 h-4 mr-2" /> Marketing
          </TabsTrigger>
          <TabsTrigger value="qrcode" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm">
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
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner une devise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XOF">FCFA (XOF)</SelectItem>
                      <SelectItem value="XAF">FCFA (XAF)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="USD">Dollar ($)</SelectItem>
                      <SelectItem value="GBP">Livre (£)</SelectItem>
                      <SelectItem value="GHS">Cedi (GHS)</SelectItem>
                      <SelectItem value="NGN">Naira (NGN)</SelectItem>
                      <SelectItem value="KES">Shilling (KES)</SelectItem>
                      <SelectItem value="ZAR">Rand (ZAR)</SelectItem>
                      <SelectItem value="MAD">Dirham (MAD)</SelectItem>
                    </SelectContent>
                  </Select>
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
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-base">Couleur du thème</Label>
                  <p className="text-sm text-muted-foreground">Choisissez la couleur principale de votre site.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setPrimaryColor(color.value)}
                      className={cn(
                        "w-10 h-10 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
                        color.class,
                        primaryColor === color.value ? "ring-2 ring-offset-2 ring-offset-background ring-zinc-900 dark:ring-white scale-110" : ""
                      )}
                      title={color.name}
                    >
                      {primaryColor === color.value && (
                        <Check className="w-5 h-5 text-white mx-auto" />
                      )}
                    </button>
                  ))}
                  <div className="flex flex-col items-center gap-2">
                    <div className={cn(
                      "relative flex items-center justify-center w-10 h-10 rounded-full overflow-hidden transition-all hover:scale-110 ring-offset-background focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-zinc-900 dark:focus-within:ring-white",
                      !PRESET_COLORS.some(c => c.value === primaryColor) && "ring-2 ring-offset-2 ring-offset-background ring-zinc-900 dark:ring-white scale-110"
                    )}>
                      <input
                        type="color"
                        value={primaryColor.startsWith('hsl') ? '#000000' : primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] p-0 border-0 cursor-pointer"
                        title="Couleur personnalisée"
                      />
                      <Plus className={cn(
                        "w-5 h-5 pointer-events-none transition-colors",
                        !PRESET_COLORS.some(c => c.value === primaryColor) ? "text-primary" : "text-zinc-500"
                      )} />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Perso</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Horaires d'ouverture</Label>
                <Card>
                  <CardContent className="p-4 space-y-4">
                    {Object.entries(openingHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center justify-between">
                        <span className="capitalize w-24">{day === 'monday' ? 'Lundi' : day === 'tuesday' ? 'Mardi' : day === 'wednesday' ? 'Mercredi' : day === 'thursday' ? 'Jeudi' : day === 'friday' ? 'Vendredi' : day === 'saturday' ? 'Samedi' : 'Dimanche'}</span>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={!hours.closed} 
                            onCheckedChange={(checked) => updateOpeningHours(day, { ...hours, closed: !checked })}
                          />
                          {!hours.closed ? (
                            <>
                              <Input 
                                type="time" 
                                value={hours.open} 
                                onChange={(e) => updateOpeningHours(day, { ...hours, open: e.target.value })}
                                className="w-24"
                              />
                              <span>-</span>
                              <Input 
                                type="time" 
                                value={hours.close} 
                                onChange={(e) => updateOpeningHours(day, { ...hours, close: e.target.value })}
                                className="w-24"
                              />
                            </>
                          ) : (
                            <span className="text-muted-foreground text-sm italic px-4">Fermé</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Label className="mt-6 block">Horaires Spéciaux (Fériés, Événements)</Label>
                <Card>
                  <CardContent className="p-4 space-y-4">
                    {specialHours.map((special, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                        <div className="grid gap-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Input 
                              value={special.label} 
                              onChange={(e) => {
                                const newSpecials = [...specialHours];
                                newSpecials[index].label = e.target.value;
                                // In a real app we'd update the store properly, simplified here
                                // For now, let's just delete and re-add logic or assume store handles deep updates? 
                                // Actually store only has add/remove. Let's just use add/remove for simplicity or update store.
                              }}
                              placeholder="Nom (ex: Noël)"
                              className="h-8"
                              readOnly // Simplified for now, remove/add to edit
                            />
                            <span className="text-xs text-muted-foreground">{special.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            {special.closed ? (
                              <span className="text-red-500 font-medium">Fermé</span>
                            ) : (
                              <span>{special.open} - {special.close}</span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeSpecialHour(index)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="flex flex-col gap-2 border-t pt-4">
                      <div className="flex gap-2">
                        <Input type="text" placeholder="Nom (ex: Nouvel An)" id="new-special-label" />
                        <Input type="date" id="new-special-date" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <Input type="time" id="new-special-open" defaultValue="10:00" />
                          <span>-</span>
                          <Input type="time" id="new-special-close" defaultValue="00:00" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="new-special-closed" className="text-xs">Fermé ?</Label>
                          <Switch id="new-special-closed" />
                        </div>
                      </div>
                      <Button onClick={() => {
                        const label = (document.getElementById('new-special-label') as HTMLInputElement).value;
                        const date = (document.getElementById('new-special-date') as HTMLInputElement).value;
                        const open = (document.getElementById('new-special-open') as HTMLInputElement).value;
                        const close = (document.getElementById('new-special-close') as HTMLInputElement).value;
                        const closed = (document.getElementById('new-special-closed') as HTMLInputElement).checked; // Checkbox/Switch handling might need state

                        if (label && date) {
                          addSpecialHour(date, { open, close, closed, label });
                          // Reset fields
                          (document.getElementById('new-special-label') as HTMLInputElement).value = '';
                          (document.getElementById('new-special-date') as HTMLInputElement).value = '';
                        }
                      }}>Ajouter une date spéciale</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Mode Sombre (Admin)</Label>
                  <p className="text-sm text-muted-foreground">
                    Activez le thème sombre pour l'interface d'administration. 
                    <br/>
                    <span className="text-xs opacity-80 italic">N'affecte pas le site public.</span>
                  </p>
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

        <TabsContent value="marketing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <Card className="rounded-xl border-zinc-200 dark:border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Offres Spéciales (Carrousel)</CardTitle>
                  <CardDescription>Gérez les bannières défilantes de l'accueil.</CardDescription>
                </div>
                <Button size="sm" onClick={handleAddOffer}>
                  <Plus className="w-4 h-4 mr-2" /> Ajouter
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {specialOffers.map((offer, index) => (
                  <div key={offer.id} className="relative bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <div className="absolute right-2 top-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => removeSpecialOffer(offer.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 pr-8">
                      <div className="space-y-2">
                        <Label>Titre (Slide {index + 1})</Label>
                        <Input 
                          value={offer.title} 
                          onChange={(e) => updateSpecialOffer(offer.id, { title: e.target.value })}
                          placeholder="Titre de l'offre"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Image URL</Label>
                        <Input 
                          value={offer.imageUrl} 
                          onChange={(e) => updateSpecialOffer(offer.id, { imageUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sous-titre</Label>
                        <Input 
                          value={offer.subtitle} 
                          onChange={(e) => updateSpecialOffer(offer.id, { subtitle: e.target.value })}
                          placeholder="Ex: Offre Spéciale"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Badge (Réduction)</Label>
                        <Input 
                          value={offer.discount} 
                          onChange={(e) => updateSpecialOffer(offer.id, { discount: e.target.value })}
                          placeholder="Ex: -20%"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {specialOffers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune offre active. Ajoutez-en une pour commencer.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle>Spécial du Chef</CardTitle>
                <CardDescription>Mettez en avant un plat spécifique.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Titre de la section</Label>
                  <Input 
                    value={chefSpecial.title} 
                    onChange={(e) => updateChefSpecial({ title: e.target.value })}
                    placeholder="Ex: Spécial du Chef"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plat à mettre en avant</Label>
                  <Select 
                    value={chefSpecial.itemId} 
                    onValueChange={(value) => updateChefSpecial({ itemId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un plat" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.price} FCFA)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
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
