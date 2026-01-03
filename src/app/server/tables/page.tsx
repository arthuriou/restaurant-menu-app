"use client";

import { useState, CSSProperties, useEffect } from "react";
import { useTableStore } from "@/stores/tables";
import { useOrderStore } from "@/stores/orders";
import { useInvoiceStore } from "@/stores/invoices";
import { useRestaurantStore } from "@/stores/restaurant";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  Check,
  Printer,
  BanknoteIcon,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  generateInvoiceNumber,
  calculateTax,
  calculateTotal,
} from "@/lib/invoice-utils";
import { Invoice } from "@/types";
import { OrderBill } from "@/components/order/OrderBill";

export default function ServerTablesPage() {
  const { tables, resolveServiceRequest, closeTable, subscribeToTables, error } = useTableStore();
  const { orders } = useOrderStore();
  const { addInvoice } = useInvoiceStore();
  const { invoiceSettings } = useRestaurantStore();
  const { user } = useAuthStore();

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<boolean>(false);

  // Subscribe to tables updates
  useEffect(() => {
    console.log("[ServerTables] Subscribing to tables...");
    const unsubscribe = subscribeToTables();
    return () => unsubscribe();
  }, [subscribeToTables]);

  useEffect(() => {
    console.log("[ServerTables] Tables updated:", tables);
  }, [tables]);

  const handleTableClick = (tableId: string, status: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    if (status === "needs_service") {
      resolveServiceRequest(tableId);
      toast.success(`Service rendu à la Table ${table.label}`);
    } else {
      handleOpenTableDetails(tableId);
    }
  };

  const handleOpenTableDetails = async (tableId: string) => {
    setSelectedTableId(tableId);
    setActiveSheet(true);
  };

  const handleGenerateInvoice = async () => {
    const table = tables.find((t) => t.id === selectedTableId);
    if (!table) return;

    // 1. Gather orders using the shared logic
    const tableOrders = getTableOrders(table.label);

    if (tableOrders.length === 0) {
      toast.error("Aucune commande trouvée pour cette table");
      return;
    }

    // 2. Consolidate items
    const allItems: any[] = [];
    tableOrders.forEach((order) => {
      order.items.forEach((item: any) => {
        // Try to find existing identical item to merge
        const existingItemIndex = allItems.findIndex(
          (existing) =>
            existing.name === item.name &&
            existing.price === item.price &&
            JSON.stringify(existing.options || {}) ===
              JSON.stringify(item.options || {}),
        );

        if (existingItemIndex >= 0) {
          allItems[existingItemIndex].qty += item.qty;
        } else {
          allItems.push({
            menuId: item.id || "unknown",
            name: item.name,
            price: item.price,
            qty: item.qty,
            imageUrl: item.image || null,
            options: item.options || null,
          });
        }
      });
    });

    // 3. Calculate totals
    const subtotal = tableOrders.reduce((acc, o) => acc + o.total, 0);
    const taxRate = invoiceSettings.taxRate;
    const tax = calculateTax(subtotal, taxRate);
    const total = calculateTotal(subtotal, taxRate);

    // 4. Create Invoice Object
    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      number: generateInvoiceNumber(),
      type: "table",
      tableId: `Table ${table.label}`,
      items: allItems,
      subtotal,
      tax,
      taxRate,
      total,
      status: "paid",
      paymentMethod: "cash",
      serverName: user?.name || "Serveur",
      createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      paidAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      restaurantInfo: {
        name: invoiceSettings.companyName,
        address: invoiceSettings.companyAddress,
        phone: invoiceSettings.companyPhone,
        email: invoiceSettings.companyEmail,
        taxId: invoiceSettings.taxId,
        footerMessage: invoiceSettings.footerMessage,
        ...(invoiceSettings.logoUrl ? { logo: invoiceSettings.logoUrl } : {}),
      },
    };

    // 5. Add to store
    await addInvoice(newInvoice);

    // 5b. Mark all orders as PAID
    const { updateOrderStatus } = useOrderStore.getState();
    tableOrders.forEach((o) => {
      updateOrderStatus(o.id, "paid");
    });

    // 6. Feedback & Update UI
    toast.success(`Facture ${newInvoice.number} générée !`);
    closeTable(selectedTableId!);
    setActiveSheet(false);
  };

  const getTableOrders = (tableLabel: string): any[] => {
    if (!tableLabel) return [];
    const normalizedLabel = tableLabel
      .toLowerCase()
      .replace("table ", "")
      .trim();

    // Find the table object to check sessionStartTime
    const tableObj = tables.find(
      (t) =>
        t.label.toLowerCase() === normalizedLabel ||
        t.label.toLowerCase() === `table ${normalizedLabel}` ||
        t.label === tableLabel
    );
    const sessionStart = tableObj?.sessionStartTime || 0;
    const tableId = tableObj?.id;

    return Object.values(orders)
      .flat()
      .filter((o: any) => {
        // Filter by session time
        if (o.createdAt?.seconds && o.createdAt.seconds * 1000 < sessionStart) {
          return false;
        }

        // Check by UUID first (most reliable)
        if (tableId && o.tableDocId && o.tableDocId === tableId) {
          return o.status !== "cancelled";
        }

        // Fallback to label matching
        const orderTableVal = o.tableId || o.table;
        if (!orderTableVal) return false;

        const orderTable = orderTableVal.toLowerCase().trim();
        // Check for "5", "Table 5", "table 5", "Table  5"
        const isMatch =
          orderTable === normalizedLabel ||
          orderTable === `table ${normalizedLabel}` ||
          orderTable.replace("table ", "").trim() === normalizedLabel;
        
        return isMatch && o.status !== "cancelled";
      });
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col bg-zinc-50 dark:bg-black p-4">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Mes Tables
        </h1>
        <p className="text-sm text-muted-foreground">
          Vue d'ensemble et gestion temps réel
        </p>
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200 mt-2">
            Erreur de connexion: {error}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="flex flex-wrap gap-12 p-8 justify-center items-start min-h-[50vh]">
          {tables.map((table) => {
            const isOccupied = table.status === "occupied";
            const isService = table.status === "needs_service";
            const isBill = table.status === "requesting_bill";
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
            
            let activeChairColor = "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]";
            let tableColor = "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100";
            let pulseColor = "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]";

            if (isService) {
               activeChairColor = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]";
               tableColor = "bg-amber-950 border-amber-500/50 text-amber-400";
               pulseColor = "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]";
            } else if (isBill) {
               activeChairColor = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]";
               tableColor = "bg-red-950 border-red-500/50 text-red-400";
               pulseColor = "bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]";
            } else if (isOccupied) {
               activeChairColor = "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]";
               tableColor = "bg-cyan-950 border-cyan-500/50 text-cyan-400";
               pulseColor = "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]";
            }

            const getChairColor = (isActive: boolean) =>
              isActive
                ? activeChairColor
                : "bg-zinc-300 dark:bg-zinc-600";

            const tableBase =
              "relative flex items-center justify-center rounded-2xl shadow-md transition-all duration-300 border-4";

            return (
              <div
                key={table.id}
                className="relative flex flex-col items-center justify-center p-2 group transition-transform hover:scale-105 cursor-pointer"
                onClick={() => handleTableClick(table.id, table.status)}
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
                      {(isOccupied || isService || isBill) && (
                        <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full animate-pulse ${pulseColor}`} />
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
                
                {/* Status Label below table */}
                <div className="mt-3 font-medium text-sm">
                   {isService ? (
                     <span className="text-amber-500 animate-pulse">Service demandé</span>
                   ) : isBill ? (
                     <span className="text-red-500 animate-pulse">Addition demandée</span>
                   ) : isOccupied ? (
                     <span className="text-cyan-500">Occupée</span>
                   ) : (
                     <span className="text-muted-foreground">Libre</span>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Table Details Sheet (Invoice View) */}
      <Sheet open={activeSheet} onOpenChange={setActiveSheet}>
        <SheetContent
          side="right"
          className="w-[400px] sm:w-[540px] p-0 border-l border-zinc-200 dark:border-zinc-800"
        >
          {selectedTableId &&
            (() => {
              const table = tables.find((t) => t.id === selectedTableId);
              const tableOrders = getTableOrders(table?.label || "");
              const hasOrders = tableOrders.length > 0;

              return (
                <div className="h-full flex flex-col bg-zinc-50 dark:bg-black">
                  <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center">
                    <div>
                      <SheetTitle className="text-xl font-bold">
                        Table {table?.label}
                      </SheetTitle>
                      <p className="text-sm text-muted-foreground">
                        {hasOrders
                          ? `${tableOrders.length} commandes`
                          : "Table libre"}
                      </p>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 p-6 h-[calc(100vh-200px)]">
                    {hasOrders ? (
                      (() => {
                        // Sort orders to ensure correct order in the bill view
                        const sortedOrders = [...tableOrders].sort((a, b) => {
                          const timeA = a.createdAt?.seconds || 0;
                          const timeB = b.createdAt?.seconds || 0;
                          return timeA - timeB;
                        });

                        // We pass the last order as the "main" one, and the rest as "otherOrders"
                        // The OrderBill component will display them all sequentially
                        const lastOrder = sortedOrders[sortedOrders.length - 1];
                        const previousOrders = sortedOrders.slice(
                          0,
                          sortedOrders.length - 1,
                        );

                        return (
                          <OrderBill
                            order={lastOrder}
                            otherOrders={previousOrders}
                            companyName={invoiceSettings.companyName}
                            showActions={false}
                          />
                        );
                      })()
                    ) : (
                      <div className="text-center py-20 text-muted-foreground">
                        <Utensils className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Aucune commande</p>
                        {table?.status === "occupied" && (
                          <div className="mt-6">
                            <Button
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                if (
                                  confirm("Forcer la libération de la table ?")
                                ) {
                                  closeTable(table.id);
                                  toast.success("Table libérée");
                                  setActiveSheet(false);
                                }
                              }}
                            >
                              Forcer "Libérer"
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>

                  {hasOrders && table?.status === "requesting_bill" && (
                    <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                        <div className="flex items-center gap-3 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50 mb-3">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <div className="text-sm font-medium">Le client demande l'addition</div>
                        </div>
                        <div className="flex flex-col gap-3">
                          <Button
                            className="h-12 rounded-lg font-bold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black shadow-sm"
                            onClick={handleGenerateInvoice}
                          >
                            <BanknoteIcon className="mr-2 w-4 h-4" />
                            Encaisser
                          </Button>
                        </div>
                    </div>
                  )}
                </div>
              );
            })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
