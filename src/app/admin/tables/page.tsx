"use client";

import { useState, useEffect, CSSProperties } from "react";
import {
  Plus,
  QrCode,
  Trash2,
  Download,
  Copy,
  Users,
  Pencil,
  ScanLine,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "qrcode";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useTableStore, Table } from "@/stores/tables";

export default function AdminTablesPage() {
  const {
    tables,
    addTable,
    updateTable,
    deleteTable,
    subscribeToTables,
    closeTable,
  } = useTableStore();
  const [qrOpen, setQrOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [baseUrl] = useState("http://192.168.1.83:3000");

  // Form states
  const [newTableLabel, setNewTableLabel] = useState("");
  const [newTableSeats, setNewTableSeats] = useState("4");

  // Subscribe to tables
  useEffect(() => {
    const unsubscribe = subscribeToTables();
    return () => unsubscribe();
  }, [subscribeToTables]);

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

  const handleDelete = async (tableId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette table ?")) {
      try {
        await deleteTable(tableId);
        toast.success("Table supprimée");
      } catch (error) {
        console.error("Error deleting table:", error);
        toast.error("Erreur lors de la suppression de la table");
      }
    }
  };

  const handleAddTable = async () => {
    if (!newTableLabel.trim()) {
      toast.error("Le numéro de table est requis");
      return;
    }

    // Check if table label already exists
    const existingTable = tables.find(
      (t) => t.label.toLowerCase() === newTableLabel.trim().toLowerCase()
    );
    if (existingTable) {
      toast.error("Une table avec ce numéro existe déjà");
      return;
    }

    try {
      await addTable({
        label: newTableLabel,
        seats: parseInt(newTableSeats) || 4,
      });

      setNewTableLabel("");
      setNewTableSeats("4");
      setAddOpen(false);
      toast.success("Table ajoutée avec succès");
    } catch (error) {
      console.error("Error adding table:", error);
      toast.error("Erreur lors de l'ajout de la table");
    }
  };

  const handleUpdateTable = async () => {
    if (!selectedTable) return;

    try {
      await updateTable(selectedTable.id, {
        label: newTableLabel,
        seats: parseInt(newTableSeats) || 4,
      });

      setEditOpen(false);
      toast.success("Table mise à jour");
    } catch (error) {
      console.error("Error updating table:", error);
      toast.error("Erreur lors de la mise à jour de la table");
    }
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

  const downloadAllQrs = async () => {
    if (tables.length === 0) {
      toast.error("Aucune table configurée");
      return;
    }

    const toastId = toast.loading("Génération des QR codes...");
    const zip = new JSZip();
    const folder = zip.folder("qr-codes");

    try {
      const promises = tables.map(async (table) => {
        const url = `${baseUrl}?table=Table ${table.label}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 512,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        
        // Remove the data:image/png;base64, prefix
        const base64Data = dataUrl.split(",")[1];
        folder?.file(`QR-Table-${table.label}.png`, base64Data, { base64: true });
      });

      await Promise.all(promises);

      const content = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "restaurant-qr-codes.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      toast.success("Téléchargement terminé", { id: toastId });
    } catch (error) {
      console.error("Error generating QR codes:", error);
      toast.error("Erreur lors de la génération des QR codes", { id: toastId });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Tables & QR Codes
        </h2>
        <p className="text-muted-foreground mt-1">
          Gérez vos tables et générez les QR codes pour vos clients.
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          {tables.length} table{tables.length > 1 ? "s" : ""} configurée
          {tables.length > 1 ? "s" : ""}
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

      {/* Tables Grid - Floor Plan Style */}
      <div className="flex flex-wrap gap-12 p-8 justify-center items-start min-h-[50vh]">
        {tables.map((table) => {
          const isOccupied = table.status === "occupied";
          const seats = table.seats || 4;

          // Table visualization logic
          let widthClass = "w-24";
          let heightClass = "h-24";
          let customStyle: CSSProperties = {};

          // Chair distribution logic
          let top = 0,
            bottom = 0,
            left = 0,
            right = 0;

          if (seats == 1) {
            widthClass = "w-20";
            heightClass = "h-20";
            top = 1;
            bottom = 0;
            left = 0;
            right = 0;
          } else if (seats <= 2) {
            widthClass = "w-20";
            heightClass = "h-20";
            top = 1;
            bottom = 1;
          } else if (seats <= 3) {
            widthClass = "w-24";
            heightClass = "h-20";
            top = 1;
            bottom = 0;
            left = 1;
            right = 1;
          } else if (seats <= 4) {
            widthClass = "w-24";
            heightClass = "h-24";
            top = 1;
            bottom = 1;
            left = 1;
            right = 1;
          } else if (seats <= 6) {
            widthClass = "w-40";
            heightClass = "h-24";
            top = 2;
            bottom = 2;
            left = 1;
            right = 1;
          } else if (seats <= 8) {
            widthClass = "w-56";
            heightClass = "h-24";
            top = 3;
            bottom = 3;
            left = 1;
            right = 1;
          } else {
            // Dynamic width for large tables
            const sides = 2;
            const remaining = seats - sides;
            top = Math.ceil(remaining / 2);
            bottom = Math.floor(remaining / 2);
            left = 1;
            right = 1;

            // Calculate width based on chair count to ensure table covers all chairs
            // 1 chair = w-10 (2.5rem) + gap-2 (0.5rem) = 3rem per unit
            const widthRem = Math.max(14, top * 3);
            customStyle = { width: `${widthRem}rem` };
            heightClass = "h-24";
          }

          // Occupants distribution logic (Active chairs)
          let activeTop = 0,
            activeBottom = 0,
            activeLeft = 0,
            activeRight = 0;
          let remainingOccupants = table.occupants || 0;

          while (remainingOccupants > 0) {
            let placed = false;
            // Fill Top/Bottom first (balanced)
            if (activeTop < top || activeBottom < bottom) {
              if (activeTop <= activeBottom && activeTop < top) {
                activeTop++;
                placed = true;
              } else if (activeBottom < bottom) {
                activeBottom++;
                placed = true;
              }
            }
            // Then Left/Right
            else if (activeLeft < left || activeRight < right) {
              if (activeLeft <= activeRight && activeLeft < left) {
                activeLeft++;
                placed = true;
              } else if (activeRight < right) {
                activeRight++;
                placed = true;
              }
            }
            if (!placed) break;
            remainingOccupants--;
          }

          // Styles matching the "Obypay" aesthetic (Chunky & Rounded)
          const chairBase =
            "rounded-full shadow-sm transition-colors duration-300";
          const getChairColor = (isActive: boolean) =>
            isActive
              ? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
              : "bg-zinc-300 dark:bg-zinc-600";

          const tableBase =
            "relative flex items-center justify-center rounded-2xl shadow-md transition-all duration-300 border-4";
          const tableColor = isOccupied
            ? "bg-cyan-950 border-cyan-500/50 text-cyan-400"
            : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100";

          return (
            <div
              key={table.id}
              className="relative flex flex-col items-center justify-center p-2 group transition-transform hover:scale-105"
              onClick={() => handleOpenQr(table)}
            >
              <div className="relative flex flex-col items-center">
                {/* Top Chairs */}
                {top > 0 && (
                  <div className="flex gap-2 mb-1.5">
                    {Array.from({ length: top }).map((_, i) => (
                      <div
                        key={`t-${i}`}
                        className={`w-10 h-3 ${chairBase} ${getChairColor(
                          i < activeTop
                        )}`}
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  {/* Left Chairs */}
                  {left > 0 && (
                    <div className="flex flex-col gap-2 mr-0.5">
                      {Array.from({ length: left }).map((_, i) => (
                        <div
                          key={`l-${i}`}
                          className={`w-3 h-10 ${chairBase} ${getChairColor(
                            i < activeLeft
                          )}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* The Table */}
                  <div
                    className={`${
                      !customStyle.width ? widthClass : ""
                    } ${heightClass} ${tableBase} ${tableColor}`}
                    style={customStyle}
                  >
                    <span className="text-2xl font-black tracking-tight">
                      {table.label}
                    </span>
                    {isOccupied && (
                      <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                    )}
                  </div>

                  {/* Right Chairs */}
                  {right > 0 && (
                    <div className="flex flex-col gap-2 ml-0.5">
                      {Array.from({ length: right }).map((_, i) => (
                        <div
                          key={`r-${i}`}
                          className={`w-3 h-10 ${chairBase} ${getChairColor(
                            i < activeRight
                          )}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Chairs */}
                {bottom > 0 && (
                  <div className="flex gap-2 mt-1.5">
                    {Array.from({ length: bottom }).map((_, i) => (
                      <div
                        key={`b-${i}`}
                        className={`w-10 h-3 ${chairBase} ${getChairColor(
                          i < activeBottom
                        )}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Hover Actions */}
              <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-white dark:bg-zinc-800 shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(table);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-white dark:bg-zinc-800 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 border border-zinc-200 dark:border-zinc-700 text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(table.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                {isOccupied && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 border border-red-200 dark:border-red-900/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Libérer cette table ?"))
                        closeTable(table.id);
                    }}
                  >
                    Libérer
                  </Button>
                )}
              </div>
            </div>
          );
        })}
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
            <DialogDescription>
              Créez une nouvelle table pour votre restaurant.
            </DialogDescription>
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
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddTable}
              className="rounded-xl bg-primary hover:bg-primary/90"
            >
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
            <DialogDescription>
              Modifiez les informations de la table.
            </DialogDescription>
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
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdateTable}
              className="rounded-xl bg-primary hover:bg-primary/90"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
