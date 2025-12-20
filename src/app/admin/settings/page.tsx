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
import { Save, Store, Palette, Megaphone, QrCode, Copy, ExternalLink, Download, Check, Plus, Trash2, Receipt, Upload } from "lucide-react";
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
    specialHours, addSpecialHour, removeSpecialHour,
    invoiceSettings, updateInvoiceSettings,
    saveSettings
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

  const handleSave = async () => {
    try {
      await saveSettings();
      toast.success("Paramètres enregistrés avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
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
          <TabsTrigger value="billing" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm">
            <Receipt className="w-4 h-4 mr-2" /> Facturation
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
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Logo du Restaurant</Label>
                <div className="flex items-start gap-4">
                  {invoiceSettings.logoUrl && (
                    <div className="relative group">
                      <img 
                        src={invoiceSettings.logoUrl} 
                        alt="Logo" 
                        className="h-24 w-24 object-contain border rounded-lg bg-white shadow-sm" 
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => updateInvoiceSettings({ logoUrl: undefined })}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        className="cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 1024 * 1024) {
                              toast.error("L'image est trop volumineuse (max 1Mo)");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              updateInvoiceSettings({ logoUrl: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Format recommandé : PNG ou JPG (fond transparent). Max 1Mo.
                      Ce logo sera affiché sur l'en-tête du site et les factures.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nom du Restaurant</Label>
                  <Input 
                    value={invoiceSettings.companyName}
                    onChange={(e) => updateInvoiceSettings({ companyName: e.target.value })}
                    placeholder="Ex: Chez Koffi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email de contact</Label>
                  <Input 
                    value={invoiceSettings.companyEmail}
                    onChange={(e) => updateInvoiceSettings({ companyEmail: e.target.value })}
                    placeholder="contact@restaurant.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input 
                    value={invoiceSettings.companyPhone}
                    onChange={(e) => updateInvoiceSettings({ companyPhone: e.target.value })}
                    placeholder="+225 ..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Input 
                    value={invoiceSettings.companyAddress}
                    onChange={(e) => updateInvoiceSettings({ companyAddress: e.target.value })}
                    placeholder="Adresse complète"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="url">URL du Site (Technique)</Label>
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
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="USD">Dollar ($)</SelectItem>
                    </SelectContent>
                  </Select>
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
              <div className="space-y-3">
                <div>
                  <Label className="text-base font-semibold">Couleur du thème</Label>
                  <p className="text-sm text-muted-foreground mt-1">Choisissez la couleur principale de votre site.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setPrimaryColor(color.value)}
                      className={cn(
                        "relative w-12 h-12 rounded-full transition-all hover:scale-110 focus:outline-none",
                        color.class
                      )}
                      title={color.name}
                      aria-label={`Couleur ${color.name}`}
                    >
                      {primaryColor === color.value && (
                        <Check className="w-6 h-6 text-white absolute inset-0 m-auto drop-shadow-md" strokeWidth={3} />
                      )}
                    </button>
                  ))}
                  <div className="relative flex flex-col items-center gap-1">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 hover:scale-110 transition-all">
                      <input
                        type="color"
                        value={primaryColor.startsWith('hsl') ? '#FF6B35' : primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer border-0"
                        title="Couleur personnalisée"
                      />
                      {!PRESET_COLORS.some(c => c.value === primaryColor) && (
                        <Check className="w-6 h-6 text-white absolute inset-0 m-auto pointer-events-none drop-shadow-md" strokeWidth={3} />
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">PERSO</span>
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
                  <Label className="text-base">Thème de l'Administration</Label>
                  <p className="text-sm text-muted-foreground">
                    {theme === 'dark' ? 'Mode Sombre' : 'Mode Clair'} activé.
                    <br/>
                    <span className="text-xs opacity-80 italic">N'affecte que l'interface admin.</span>
                  </p>
                </div>
                <Switch 
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
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
                        <Label>Image (Bannière)</Label>
                        <div className="flex items-start gap-4">
                          {offer.imageUrl && (
                            <div className="relative h-16 w-24 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0">
                              <img src={offer.imageUrl} alt={offer.title} className="h-full w-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1">
                            <Input 
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 2 * 1024 * 1024) {
                                    toast.error("L'image est trop volumineuse (max 2Mo)");
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    updateSpecialOffer(offer.id, { imageUrl: reader.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="cursor-pointer"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Format recommandé : 16:9 ou paysage large.
                            </p>
                          </div>
                        </div>
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
                <CardTitle>Section "À la une"</CardTitle>
                <CardDescription>Personnalisez le titre de la section des plats mis en avant.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Titre de la section</Label>
                  <Input 
                    value={chefSpecial.title} 
                    onChange={(e) => updateChefSpecial({ title: e.target.value })}
                    placeholder="Ex: Nos Spécialités, Plats du jour..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Ce titre s'affichera au-dessus de la liste des plats marqués comme "Vedette" dans le menu.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader>
              <CardTitle>Configuration Facturation</CardTitle>
              <CardDescription>Gérez les informations légales et fiscales de vos factures.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Numéro Fiscal (CC / N° Compte Contribuable)</Label>
                  <Input 
                    value={invoiceSettings.taxId}
                    onChange={(e) => updateInvoiceSettings({ taxId: e.target.value })}
                    placeholder="CI-123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Taux de TVA (%)</Label>
                  <div className="relative">
                    <Input 
                      type="number"
                      value={invoiceSettings.taxRate}
                      onChange={(e) => updateInvoiceSettings({ taxRate: Number(e.target.value) })}
                      placeholder="0"
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Mettez 0 si vous n'êtes pas assujetti à la TVA.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Message de pied de page</Label>
                <Input 
                  value={invoiceSettings.footerMessage}
                  onChange={(e) => updateInvoiceSettings({ footerMessage: e.target.value })}
                  placeholder="Merci de votre visite !"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <Label className="text-base">Afficher le logo</Label>
                  <p className="text-sm text-muted-foreground">Inclure le logo sur les factures imprimées.</p>
                </div>
                <Switch 
                  checked={invoiceSettings.showLogo}
                  onCheckedChange={(checked) => updateInvoiceSettings({ showLogo: checked })}
                />
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
