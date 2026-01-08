"use client";

import { useState, useEffect, useCallback, memo } from "react";
import Image from "next/image";
import { useAuthStore } from "@/stores/auth";
import { useOrderStore } from "@/stores/orders";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useMenuStore } from "@/stores/menu";
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Utensils,
  BellRing,
  AlertTriangle,
  ShoppingBag,
  UtensilsCrossed,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { UserAvatar } from "@/components/user-avatar";
import { ModeToggle } from "@/components/mode-toggle";
import type { DashboardOrder } from "@/stores/orders";
import { MenuItem } from "@/types";

const columns = {
  pending: {
    title: "À Faire",
    icon: BellRing,
  },
  preparing: {
    title: "En Préparation",
    icon: ChefHat,
  },
  ready: {
    title: "Prêt à Servir",
    icon: Utensils,
  },
} as const;

type ColumnId = keyof typeof columns;

// Memoized Order Card Component
const OrderCard = memo(function OrderCard({
  order,
  columnId,
  elapsed,
  tableInfo,
  onAdvance,
  menuItems,
}: {
  order: DashboardOrder;
  columnId: ColumnId;
  elapsed: number;
  tableInfo: { label: string; isTakeaway: boolean } | null;
  onAdvance: (orderId: string, status: string) => void;
  menuItems: MenuItem[];
}) {
  // Get option/variant details from menu
  const getOptionDetails = (
    orderItem: DashboardOrder["items"][0],
    optionName: string,
  ) => {
    const menuItem = menuItems.find((m) => m.id === orderItem.menuId);
    return menuItem?.options?.find((opt) => opt.name === optionName);
  };

  // Get menu item image
  const getItemImage = (orderItem: DashboardOrder["items"][0]) => {
    if (orderItem.imageUrl) return orderItem.imageUrl;
    const menuItem = menuItems.find((m) => m.id === orderItem.menuId);
    return menuItem?.imageUrl || null;
  };

  return (
    <Card className="p-4 bg-card border border-border rounded-xl">
      {/* Header with table and time */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {/* Table Badge */}
          {tableInfo && (
            <Badge
              className={cn(
                "text-xs font-bold px-2.5 py-1 rounded-lg",
                tableInfo.isTakeaway
                  ? "bg-orange-900/30 text-orange-400 border border-orange-800"
                  : "bg-secondary text-foreground border border-border",
              )}
            >
              {tableInfo.isTakeaway ? (
                <ShoppingBag className="w-3 h-3 mr-1.5" />
              ) : (
                <UtensilsCrossed className="w-3 h-3 mr-1.5" />
              )}
              {tableInfo.label}
              {order.customerName && <span className="ml-1 opacity-90 font-normal border-l border-white/20 pl-2 ml-2">{order.customerName}</span>}
            </Badge>
          )}
          {/* Order ID */}
          <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">
            #{order.id.slice(0, 4)}
          </span>
        </div>
        {/* Timer */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {elapsed} min
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {order.items.map((item, idx) => {
          const itemImage = getItemImage(item);

          return (
            <div key={idx} className="flex items-start gap-3">
              {/* Item Image */}
              <div className="relative w-12 h-12 rounded-lg bg-secondary overflow-hidden shrink-0 border border-border">
                {itemImage ? (
                  <Image
                    src={itemImage}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* Item name */}
                <div className="font-bold text-foreground text-sm">
                  <span className="text-primary mr-1">{item.qty}x</span>
                  {item.name}
                </div>

                {/* Options, variants, supplements */}
                {item.options && Object.keys(item.options).length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {Object.entries(item.options)
                      .filter(([key]) => key !== "note")
                      .map(([key, value]) => {
                        const optionDetails = getOptionDetails(item, key);

                        return (
                          <div
                            key={key}
                            className="flex items-center gap-2 text-xs bg-secondary/60 p-1.5 rounded-md"
                          >
                            {/* Option image */}
                            {optionDetails?.imageUrl && (
                              <div className="relative w-8 h-8 rounded overflow-hidden shrink-0 border border-border">
                                <Image
                                  src={optionDetails.imageUrl}
                                  alt={key}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="text-foreground font-medium">
                                {value === true || value === "true"
                                  ? key
                                  : `${key}: ${value}`}
                              </span>
                              {optionDetails?.description && (
                                <p className="text-muted-foreground text-[10px] truncate">
                                  {optionDetails.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Note */}
                {item.note && (
                  <div className="flex items-start gap-1 text-orange-400 text-xs mt-2 bg-orange-950/30 px-2 py-1.5 rounded-md border border-orange-900/30">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                    <span className="italic">&ldquo;{item.note}&rdquo;</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action button */}
      <div className="mt-4 pt-3 border-t border-border">
        {columnId === "ready" ? (
          <div className="text-green-400 text-sm font-bold flex items-center justify-center gap-2 py-2">
            <CheckCircle2 className="w-4 h-4" />
            En attente du serveur
          </div>
        ) : (
          <Button
            className="w-full font-bold"
            onClick={() => onAdvance(order.id, columnId)}
          >
            {columnId === "pending"
              ? "Lancer la préparation"
              : "Marquer comme prêt"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </Card>
  );
});

export default function KitchenPage() {
  const { user, logout } = useAuthStore();
  const { orders, updateOrderStatus } = useOrderStore();
  const { items: menuItems } = useMenuStore();
  const router = useRouter();

  const [enabled, setEnabled] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEnabled(true));
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push("/login");
  }, [logout, router]);

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination) return;

      const sourceId = result.source.droppableId as ColumnId;
      const destId = result.destination.droppableId as ColumnId;

      if (sourceId !== destId) {
        await updateOrderStatus(result.draggableId, destId);
        toast.success(`Commande passée en ${columns[destId].title}`);
      }
    },
    [updateOrderStatus],
  );

  const advanceOrder = useCallback(
    async (orderId: string, status: string) => {
      const next =
        status === "pending"
          ? "preparing"
          : status === "preparing"
            ? "ready"
            : null;
      if (!next) return;
      await updateOrderStatus(orderId, next);
      toast.success("Statut mis à jour");
    },
    [updateOrderStatus],
  );

  const getElapsedTime = useCallback(
    (createdAt: { seconds?: number; _seconds?: number }) => {
      if (!createdAt) return 0;
      const ms = createdAt.seconds
        ? createdAt.seconds * 1000
        : createdAt._seconds
          ? createdAt._seconds * 1000
          : now;
      return Math.floor((now - ms) / 60000);
    },
    [now],
  );

  // Get table display info
  const getTableDisplay = useCallback((order: DashboardOrder) => {
    const orderTable = order.tableId || order.table || "";
    const isTakeaway =
      orderTable.toLowerCase().includes("emporter") ||
      order.type === "takeaway";

    if (isTakeaway) {
      return { label: "Emporter", isTakeaway: true };
    }

    // Extract table number
    let tableNumber = orderTable;
    const match = orderTable.match(/(\d+)/);
    if (match) {
      tableNumber = match[1];
    }

    if (tableNumber) {
      return { label: `Table ${tableNumber}`, isTakeaway: false };
    }

    return null;
  }, []);

  if (!enabled) return null;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header with user info and logout */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} size="lg" />
          <div className="flex flex-col">
            <span className="text-foreground font-bold text-base">
              {user?.name || "Cuisinier"}
            </span>
            <span className="text-muted-foreground text-xs">
              {user?.role === "kitchen" ? "Cuisine" : user?.role || "Staff"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-red-900/30 text-red-500 hover:text-red-400 hover:bg-red-950/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      <div className="flex-1 p-4 overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {(
              Object.entries(columns) as [
                ColumnId,
                (typeof columns)[ColumnId],
              ][]
            ).map(([columnId, col]) => (
              <div
                key={columnId}
                className="flex flex-col border border-border rounded-xl bg-card overflow-hidden"
              >
                <div className="p-3 border-b border-border flex justify-between items-center">
                  <h3 className="font-bold text-foreground">{col.title}</h3>
                  <Badge className="bg-primary text-primary-foreground">
                    {orders[columnId]?.length || 0}
                  </Badge>
                </div>

                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 overflow-y-auto p-2 space-y-2",
                        snapshot.isDraggingOver && "bg-primary/10",
                      )}
                    >
                      {orders[columnId]?.map((order, index) => {
                        const elapsed = getElapsedTime(order.createdAt);
                        const tableInfo = getTableDisplay(order);

                        return (
                          <Draggable
                            key={order.id}
                            draggableId={order.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  snapshot.isDragging &&
                                    "ring-2 ring-primary rounded-xl",
                                )}
                                style={provided.draggableProps.style}
                              >
                                <OrderCard
                                  order={order}
                                  columnId={columnId}
                                  elapsed={elapsed}
                                  tableInfo={tableInfo}
                                  onAdvance={advanceOrder}
                                  menuItems={menuItems}
                                />
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
