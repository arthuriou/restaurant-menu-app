"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// import { doc, onSnapshot } from "firebase/firestore";
// import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { OrderStatus } from "@/components/menu/OrderStatus";
import type { Order } from "@/types";

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;

    const orderId = params.id as string;

    // Mode Démo : Si l'ID commence par "demo-order-", on affiche une fausse commande
    if (orderId.startsWith("demo-order-")) {
      setOrder({
        id: orderId,
        tableId: "Table 12",
        items: [
          { menuId: "chicken_01", name: "Poulet braisé", price: 4500, qty: 2, options: { cuisson: "Bien cuit" } },
          { menuId: "soda_01", name: "Coca Cola", price: 1000, qty: 2 }
        ],
        total: 11000,
        status: "preparing",
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
      });
      setLoading(false);
      return;
    }

    // Mode Réel : Firestore (seulement si Firebase est configuré)
    // Désactivé pour le moment - Firebase non configuré
    /*
    const unsub = onSnapshot(doc(db, "orders", orderId), (doc) => {
      if (doc.exists()) {
        setOrder({ id: doc.id, ...doc.data() } as Order);
      }
      setLoading(false);
    });

    return () => unsub();
    */
    
    // En l'absence de Firebase configuré, on affiche une commande de démo
    setOrder({
      id: orderId,
      tableId: "Table 12",
      items: [
        { menuId: "chicken_01", name: "Poulet braisé", price: 4500, qty: 2 },
        { menuId: "soda_01", name: "Coca Cola", price: 1000, qty: 2 }
      ],
      total: 11000,
      status: "preparing",
      createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
    });
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Commande introuvable</h1>
        <p className="text-muted-foreground mb-4">Cette commande n'existe pas ou a été supprimée.</p>
        <Button onClick={() => router.push('/')}>Retour au menu</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-8">
      <header className="bg-white dark:bg-zinc-900 border-b p-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg">Suivi de commande</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl">Table {order.tableId.replace('Table ', '')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <OrderStatus status={order.status} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Récapitulatif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-sm">
                <div>
                  <p className="font-medium">{item.qty}x {item.name}</p>
                  {item.options && Object.values(item.options).length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {Object.values(item.options).join(', ')}
                    </p>
                  )}
                </div>
                <p className="font-medium">{(item.price * item.qty).toLocaleString()} FCFA</p>
              </div>
            ))}
            <div className="border-t pt-4 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{order.total.toLocaleString()} FCFA</span>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center text-xs text-muted-foreground">
          Commande #{order.id.slice(0, 8)}
        </div>
      </main>
    </div>
  );
}
