"use client";

import { useState } from "react";
import { Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useRestaurantStore } from "@/stores/restaurant";
import { InvoicePrintable } from "@/components/invoice/InvoicePrintable";
import { Invoice } from "@/types";
import { toast } from "sonner";

// Sample invoice for preview
const getSampleInvoice = (settings: any): Invoice => ({
  id: "sample",
  number: "INV-2024-00001",
  type: "table",
  tableId: "Table 5",
  items: [
    { menuId: "1", name: "Poulet Braisé", price: 4500, qty: 2 },
    { menuId: "2", name: "Coca Cola", price: 1000, qty: 2 }
  ],
  subtotal: 11000,
  tax: 11000 * settings.taxRate / 100,
  taxRate: settings.taxRate,
  total: 11000 + (11000 * settings.taxRate / 100),
  status: "paid",
  paymentMethod: "card",
  createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
  paidAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
  restaurantInfo: {
    name: settings.companyName,
    address: settings.companyAddress,
    phone: settings.companyPhone,
    email: settings.companyEmail,
    taxId: settings.showTaxId ? settings.taxId : undefined,
    logo: settings.showLogo ? settings.logoUrl : undefined
  }
});

export default function InvoiceTemplatePage() {
  const { invoiceSettings, updateInvoiceSettings } = useRestaurantStore();
  const [showPreview, setShowPreview] = useState(true);
  
  // Local state for form
  const [formData, setFormData] = useState(invoiceSettings);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = () => {
    updateInvoiceSettings(formData);
    toast.success("Template de facture sauvegardé !");
  };

  const sampleInvoice = getSampleInvoice(formData);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Template de Facture</h2>
          <p className="text-muted-foreground mt-1">Personnalisez l'apparence de vos factures et reçus.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Masquer' : 'Afficher'} l'aperçu
          </Button>
          <Button onClick={handleSave} className="rounded-xl">
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Form */}
        <div className="space-y-6">
          {/* Company Info */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Informations Entreprise</CardTitle>
              <CardDescription>Ces informations apparaîtront sur toutes les factures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName">Nom de l'entreprise</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="rounded-xl mt-2"
                />
              </div>

              <div>
                <Label htmlFor="companyAddress">Adresse</Label>
                <Textarea
                  id="companyAddress"
                  value={formData.companyAddress}
                  onChange={(e) => handleChange('companyAddress', e.target.value)}
                  className="rounded-xl mt-2"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyPhone">Téléphone</Label>
                  <Input
                    id="companyPhone"
                    value={formData.companyPhone}
                    onChange={(e) => handleChange('companyPhone', e.target.value)}
                    className="rounded-xl mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => handleChange('companyEmail', e.target.value)}
                    className="rounded-xl mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="taxId">Numéro de TVA</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => handleChange('taxId', e.target.value)}
                  className="rounded-xl mt-2"
                  placeholder="CI-123456789"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tax & Calculation */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Calculs & Taxes</CardTitle>
              <CardDescription>Configuration de la TVA et des calculs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="taxRate">Taux de TVA (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.taxRate}
                  onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                  className="rounded-xl mt-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Taux actuel : {formData.taxRate}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Apparence</CardTitle>
              <CardDescription>Personnalisez l'affichage de vos factures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logoUrl">URL du Logo</Label>
                <Input
                  id="logoUrl"
                  value={formData.logoUrl || ''}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  className="rounded-xl mt-2"
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Utilisez Cloudinary pour héberger votre logo
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900">
                <div>
                  <Label htmlFor="showLogo" className="text-base">Afficher le logo</Label>
                  <p className="text-sm text-muted-foreground">Le logo apparaît en haut de la facture</p>
                </div>
                <Switch
                  id="showLogo"
                  checked={formData.showLogo}
                  onCheckedChange={(checked) => handleChange('showLogo', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900">
                <div>
                  <Label htmlFor="showTaxId" className="text-base">Afficher le N° TVA</Label>
                  <p className="text-sm text-muted-foreground">Affiche le numéro de TVA sur la facture</p>
                </div>
                <Switch
                  id="showTaxId"
                  checked={formData.showTaxId}
                  onCheckedChange={(checked) => handleChange('showTaxId', checked)}
                />
              </div>

              <div>
                <Label htmlFor="footerMessage">Message de pied de page</Label>
                <Textarea
                  id="footerMessage"
                  value={formData.footerMessage}
                  onChange={(e) => handleChange('footerMessage', e.target.value)}
                  className="rounded-xl mt-2"
                  rows={2}
                  placeholder="Merci de votre visite !"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="lg:sticky lg:top-8 h-fit">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Aperçu en temps réel</CardTitle>
                <CardDescription>Voici à quoi ressemblera votre facture</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[800px] overflow-y-auto">
                  <div className="scale-75 origin-top">
                    <InvoicePrintable invoice={sampleInvoice} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
