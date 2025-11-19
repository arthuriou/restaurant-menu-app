"use client";

import { useState } from "react";
import { Plus, QrCode, Trash2, Download, Copy, Armchair, Users } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Mock Data
const initialTables = [
  { id: "t1", label: "1", status: "available", seats: 2, shape: "circle" },
  { id: "t2", label: "2", status: "occupied", seats: 4, shape: "square" },
  { id: "t3", label: "3", status: "available", seats: 4, shape: "square" },
  { id: "t4", label: "4", status: "reserved", seats: 6, shape: "rectangle" },
  { id: "t5", label: "5", status: "available", seats: 2, shape: "circle" },
  { id: "t6", label: "6", status: "available", seats: 8, shape: "rectangle" },
];

export default function AdminTablesPage() {
  const [tables, setTables] = useState(initialTables);
  const [qrOpen, setQrOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<{id: string, label: string} | null>(null);
  const [baseUrl] = useState("https://restaurant-app.com"); // Replace with actual domain

  const handleOpenQr = (table: {id: string, label: string}) => {
    setSelectedTable(table);
    setQrOpen(true);
  };

  const getQrUrl = () => {
    if (!selectedTable) return "";
    return `${baseUrl}?table=Table ${selectedTable.label}`;
  };

  const downloadQr = () => {
    const svg = document.getElementById("qr-code-svg");
    if (svg) {
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
          downloadLink.download = `QR-Table-${selectedTable?.label}.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
        }
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
      toast.success("QR Code téléchargé");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Plan de Salle</h2>
          <p className="text-muted-foreground mt-1">Gérez la disposition et les QR codes de vos tables.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Ajouter une table
        </Button>
      </div>

      <div className="bg-zinc-50/50 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 min-h-[600px]">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {tables.map((table) => (
            <div key={table.id} className="relative group flex flex-col items-center justify-center gap-3">
              {/* Table Shape Visual */}
              <div 
                onClick={() => handleOpenQr(table)}
                className={`
                  relative flex items-center justify-center cursor-pointer transition-all duration-300
                  ${table.shape === 'circle' ? 'rounded-full w-24 h-24' : table.shape === 'rectangle' ? 'rounded-xl w-32 h-20' : 'rounded-2xl w-24 h-24'}
                  ${table.status === 'available' ? 'bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:border-primary hover:shadow-lg hover:shadow-primary/10' : ''}
                  ${table.status === 'occupied' ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800' : ''}
                  ${table.status === 'reserved' ? 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800' : ''}
                `}
              >
                <span className={`text-xl font-bold ${
                  table.status === 'available' ? 'text-zinc-700 dark:text-zinc-200' : 
                  table.status === 'occupied' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {table.label}
                </span>
                
                {/* Seats Indicators */}
                <div className="absolute -bottom-2 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-[10px] font-medium text-muted-foreground border border-zinc-200 dark:border-zinc-700 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {table.seats}
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 backdrop-blur-[1px] rounded-[inherit]">
                  <QrCode className="w-6 h-6 text-primary" />
                </div>
              </div>

              {/* Status Badge */}
              <Badge variant="secondary" className={`
                text-[10px] uppercase tracking-wider font-semibold
                ${table.status === 'available' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                ${table.status === 'occupied' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                ${table.status === 'reserved' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : ''}
              `}>
                {table.status === 'available' ? 'Libre' : table.status === 'occupied' ? 'Occupée' : 'Réservée'}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Table {selectedTable?.label}
            </DialogTitle>
            <DialogDescription className="text-center">
              QR Code unique pour cette table.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-zinc-100 shadow-inner my-4">
            <QRCodeSVG 
              id="qr-code-svg"
              value={getQrUrl()} 
              size={200}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "/logo-placeholder.png",
                x: undefined,
                y: undefined,
                height: 24,
                width: 24,
                excavate: true,
              }}
            />
            <p className="mt-4 text-xs text-muted-foreground font-mono bg-zinc-100 px-3 py-1 rounded-full">
              {getQrUrl()}
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto rounded-xl" onClick={() => {
              navigator.clipboard.writeText(getQrUrl());
              toast.success("Lien copié !");
            }}>
              <Copy className="w-4 h-4 mr-2" /> Copier Lien
            </Button>
            <Button className="w-full sm:w-auto rounded-xl" onClick={downloadQr}>
              <Download className="w-4 h-4 mr-2" /> Télécharger PNG
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Table Dialog (Mock) */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter une table</DialogTitle>
            <DialogDescription>Configurez la nouvelle table.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Numéro</Label>
              <Input id="name" defaultValue="7" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="seats" className="text-right">Places</Label>
              <Input id="seats" defaultValue="4" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={() => {
              toast.success("Table ajoutée");
              setAddOpen(false);
            }}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
