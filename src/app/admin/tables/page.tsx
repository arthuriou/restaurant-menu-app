"use client";

import { useState } from "react";
import { Plus, QrCode, Trash2, Download, Copy, Users, Pencil, Receipt } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useTableStore, Table } from "@/stores/tables";

export default function AdminTablesPage() {
  const { tables, addTable, updateTable, deleteTable } = useTableStore();
  const [qrOpen, setQrOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [baseUrl] = useState("https://restaurant-app.com"); // Replace with actual domain
  
  // Form states
  const [newTableLabel, setNewTableLabel] = useState("");
  const [newTableSeats, setNewTableSeats] = useState("4");

  const handleOpenQr = (table: Table) => {
    setSelectedTable(table);
    setQrOpen(true);
  };

  const handleEdit = (table: Table) => {
    setSelectedTable(table);
    setNewTableLabel(table.label);
    setNewTableSeats(table.seats.toString());
    setEditOpen(true);
  };

  const handleDelete = (tableId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette table ?")) {
      deleteTable(tableId);
      toast.success("Table supprimée");
    }
  };

  const handleAddTable = () => {
    if (!newTableLabel.trim()) {
      toast.error("Le numéro de table est requis");
      return;
    }
    
    addTable({
      label: newTableLabel,
      seats: parseInt(newTableSeats) || 4,
      status: 'available'
    });
    
    setNewTableLabel("");
    setNewTableSeats("4");
    setAddOpen(false);
    toast.success("Table ajoutée avec succès");
  };

  const handleUpdateTable = () => {
    if (!selectedTable) return;
    
    updateTable(selectedTable.id, {
      label: newTableLabel,
      seats: parseInt(newTableSeats) || 4
    });

    setEditOpen(false);
    toast.success("Table mise à jour");
  };

  const getQrUrl = () => {
    if (!selectedTable) return "";
    return `${baseUrl}?table=Table ${selectedTable.label}`;
  };

  const downloadQr = () => {
    const svg = document.getElementById("qr-code-svg");
    if (svg && selectedTable) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const pngFile = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.download = `QR-Table-${selectedTable.label}.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
        }
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
      toast.success("QR Code téléchargé");
    }
  };

  const downloadAllQrs = () => {
    toast.info("Téléchargement de tous les QR codes...");
    // This would need to be implemented with a zip library
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Tables & QR Codes</h2>
        <p className="text-muted-foreground mt-1">Gérez vos tables et générez les QR codes pour vos clients.</p>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          {tables.length} table{tables.length > 1 ? 's' : ''} configurée{tables.length > 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={downloadAllQrs}
            className="rounded-xl"
          >
            <Download className="w-4 h-4 mr-2" /> Télécharger tous les QR
          </Button>
          <Button 
            onClick={() => setAddOpen(true)} 
            className="rounded-xl shadow-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus className="w-4 h-4 mr-2" /> Ajouter une table
          </Button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map((table) => (
          <Card 
            key={table.id} 
            className="group relative overflow-hidden rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-lg transition-all duration-300"
          >
            <CardContent className="p-6">
              {/* Table Info */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Table {table.label}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{table.seats} places</span>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleEdit(table)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => handleDelete(table.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* QR Code Preview */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 mb-4 border border-zinc-100 dark:border-zinc-700">
                <div className="flex items-center justify-center">
                  <QRCodeSVG 
                    value={`${baseUrl}?table=Table ${table.label}`}
                    size={120}
                    level="M"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => handleOpenQr(table)}
                >
                  <QrCode className="w-4 h-4 mr-1.5" /> Voir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => {
                    setSelectedTable(table);
                    setTimeout(downloadQr, 100);
                  }}
                >
                  <Download className="w-4 h-4 mr-1.5" /> Télécharger
                </Button>
              </div>
              
              <Button
                className="w-full mt-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                onClick={() => {
                  toast.info(`Génération de la facture consolidée pour la Table ${table.label}...`);
                  // Simulation: In real app, fetch all unpaid orders for this table
                  // const orders = await getOrdersForTable(table.id);
                  // const invoice = generateConsolidatedInvoice(orders, restaurantInfo);
                  // router.push(`/admin/invoices/${invoice.id}`);
                }}
              >
                <Receipt className="w-4 h-4 mr-2" />
                Facturer la table
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* QR Code Detail Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Table {selectedTable?.label}
            </DialogTitle>
            <DialogDescription className="text-center">
              QR Code unique pour cette table
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 my-4">
            <QRCodeSVG 
              id="qr-code-svg"
              value={getQrUrl()} 
              size={240}
              level="H"
              includeMargin={true}
            />
            <p className="mt-6 text-xs text-muted-foreground font-mono bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg max-w-full break-all">
              {getQrUrl()}
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto rounded-xl" 
              onClick={() => {
                navigator.clipboard.writeText(getQrUrl());
                toast.success("Lien copié !");
              }}
            >
              <Copy className="w-4 h-4 mr-2" /> Copier Lien
            </Button>
            <Button 
              className="w-full sm:w-auto rounded-xl bg-primary hover:bg-primary/90" 
              onClick={downloadQr}
            >
              <Download className="w-4 h-4 mr-2" /> Télécharger PNG
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Table Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Ajouter une table</DialogTitle>
            <DialogDescription>Créez une nouvelle table pour votre restaurant.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="table-number">Numéro de table</Label>
              <Input 
                id="table-number" 
                placeholder="Ex: 12" 
                className="rounded-xl"
                value={newTableLabel}
                onChange={(e) => setNewTableLabel(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="table-seats">Nombre de places</Label>
              <Input 
                id="table-seats" 
                type="number" 
                placeholder="4" 
                className="rounded-xl"
                value={newTableSeats}
                onChange={(e) => setNewTableSeats(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button onClick={handleAddTable} className="rounded-xl bg-primary hover:bg-primary/90">
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Modifier la table</DialogTitle>
            <DialogDescription>Modifiez les informations de la table.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-table-number">Numéro de table</Label>
              <Input 
                id="edit-table-number" 
                placeholder="Ex: 12" 
                className="rounded-xl"
                value={newTableLabel}
                onChange={(e) => setNewTableLabel(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-table-seats">Nombre de places</Label>
              <Input 
                id="edit-table-seats" 
                type="number" 
                placeholder="4" 
                className="rounded-xl"
                value={newTableSeats}
                onChange={(e) => setNewTableSeats(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button onClick={handleUpdateTable} className="rounded-xl bg-primary hover:bg-primary/90">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
