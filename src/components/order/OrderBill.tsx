"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Clock, ChefHat, UtensilsCrossed, XCircle, ShoppingBag, Loader2 } from "lucide-react";
import { Order, OrderStatus } from "@/types";
import { useMenuStore } from "@/stores/menu";

interface OrderBillProps {
  order: Order;
  otherOrders?: Order[]; // Previous orders in the same session
  companyName?: string;
  showActions?: boolean; // Show pay/cancel buttons?
  onCancelOrder?: (orderId: string) => void;
  cancellingId?: string | null;
}

const STATUS_CONFIG = {
  pending: { icon: Clock, label: "En attente" },
  preparing: { icon: ChefHat, label: "En cuisine" },
  ready: { icon: UtensilsCrossed, label: "Prête" },
  served: { icon: CheckCircle2, label: "Servie" },
  cancelled: { icon: XCircle, label: "Annulée" },
  paid: { icon: CheckCircle2, label: "Payée" }
};

export function OrderBill({ 
  order, 
  otherOrders = [], 
  companyName = "RESTAURANT", 
  showActions = false,
  onCancelOrder,
  cancellingId
}: OrderBillProps) {
  const { items: allMenuItems, loadMenu } = useMenuStore();

  useEffect(() => {
    if (allMenuItems.length === 0) {
      loadMenu();
    }
  }, [allMenuItems.length, loadMenu]);

  const allSessionOrders = [...otherOrders, order].sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  const sessionTotal = allSessionOrders.reduce((acc, o) => acc + o.total, 0);

  // Calculate global status
  const allServed = allSessionOrders.every(o => o.status === 'served' || o.status === 'paid');
  const anyReady = allSessionOrders.some(o => o.status === 'ready');
  const anyPreparing = allSessionOrders.some(o => o.status === 'preparing');
  
  let globalStatus = 'pending';
  if (allServed) globalStatus = 'served';
  else if (anyReady) globalStatus = 'ready';
  else if (anyPreparing) globalStatus = 'preparing';

  const getOptionDetails = (orderItem: any, optionName: string) => {
    const menuItem = allMenuItems.find(m => m.id === orderItem.menuId);
    return menuItem?.options?.find(opt => opt.name === optionName);
  };

  return (
    <div className="relative filter drop-shadow-xl w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-t-xl relative z-10 print:shadow-none print:drop-shadow-none">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-6 border-b-2 border-dashed border-zinc-200 dark:border-zinc-800 pb-6">
          <h2 className="font-black text-2xl uppercase tracking-widest text-zinc-900 dark:text-white">
            {companyName}
          </h2>
          <div className="flex flex-col text-xs text-muted-foreground uppercase tracking-wide font-medium">
            <span>{order.tableId}</span>
            <span>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span>{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          
          <div className="pt-2">
            {globalStatus === 'served' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider">Servie</span>
              </div>
            )}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {allSessionOrders.map((ord) => {
            const orderStatusConfig = STATUS_CONFIG[ord.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
            
            return (
              <div key={ord.id} className="space-y-4">
                <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span>Commande {ord.id.slice(0, 4)}</span>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400`}>
                      <orderStatusConfig.icon className="w-2.5 h-2.5" />
                      <span className="font-bold">{orderStatusConfig.label}</span>
                    </div>
                  </div>
                  
                  {showActions && ord.status === 'pending' && onCancelOrder && (
                    <button 
                      onClick={() => onCancelOrder(ord.id)}
                      disabled={cancellingId === ord.id}
                      className="text-red-500 hover:text-red-600 px-2 py-0.5 rounded flex items-center gap-1 disabled:opacity-50"
                    >
                      {cancellingId === ord.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      <span>Annuler</span>
                    </button>
                  )}
                </div>

                {ord.items.map((item, idx) => (
                  <div key={`${ord.id}-${idx}`} className="flex gap-3">
                    <div className="relative h-12 w-12 shrink-0 rounded overflow-hidden bg-zinc-100 dark:bg-zinc-800 mt-1">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-zinc-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200 leading-tight">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs mr-1.5">
                              {item.qty}
                            </span>
                            {item.name}
                          </p>
                        </div>
                        <p className="font-bold text-sm text-zinc-900 dark:text-white whitespace-nowrap">
                          {(item.price * item.qty).toLocaleString()}
                        </p>
                      </div>

                      {item.options && Object.keys(item.options).length > 0 && (
                        <div className="mt-3 space-y-3 pl-1">
                          {Object.entries(item.options).map(([optName, optVal]) => {
                            // 1. Handle Notes separately or exclude
                            if (optName === 'note') {
                              return (
                                <div key={optName} className="text-[10px] text-muted-foreground italic bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded border border-zinc-100 dark:border-zinc-800 flex items-start gap-1.5">
                                  <span className="font-bold not-italic">Note:</span> {optVal as string}
                                </div>
                              );
                            }

                            // 2. Handle Standard Options
                            if (optVal === true || typeof optVal === 'string') {
                              const details = getOptionDetails(item, optName);
                              
                              return (
                                <div key={optName} className="flex items-start gap-3 text-xs text-muted-foreground bg-zinc-50/50 dark:bg-zinc-800/20 p-2 rounded-lg border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800 transition-colors">
                                  {/* Option Image */}
                                  {details?.imageUrl && (
                                    <div className="relative h-10 w-10 shrink-0 rounded overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-700">
                                      <Image 
                                        src={details.imageUrl} 
                                        alt={optName} 
                                        fill 
                                        className="object-cover" 
                                      />
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="flex flex-col">
                                        <span className={`font-medium text-zinc-700 dark:text-zinc-200 ${details?.imageUrl ? 'text-sm' : ''}`}>
                                          {optVal === true ? optName : <>{optName}: <span className="font-normal">{optVal}</span></>}
                                        </span>
                                        {details?.description && (
                                          <span className="text-[10px] text-zinc-400 leading-tight mt-0.5 max-w-[150px] truncate">
                                            {details.description}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {details && details.price > 0 && (
                                        <span className="font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded shadow-sm">
                                          +{details.price.toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="mt-8 pt-6 border-t-2 border-dashed border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Sous-total</span>
            <span>{sessionTotal.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="font-black text-xl uppercase text-zinc-900 dark:text-white">Total à payer</span>
            <span className="font-black text-2xl text-primary">{sessionTotal.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">FCFA</span></span>
          </div>
        </div>

        <div className="mt-8 text-center print:hidden">
          <p className="font-handwriting text-lg text-zinc-400 rotate-[-2deg]">Merci de votre visite !</p>
        </div>

      </div>

      {/* Ticket Tear Effect */}
      <div 
        className="h-4 w-full bg-white dark:bg-zinc-900 relative z-10 print:hidden"
        style={{
          maskImage: 'linear-gradient(45deg, transparent 50%, black 50%), linear-gradient(-45deg, transparent 50%, black 50%)',
          maskSize: '20px 20px',
          maskRepeat: 'repeat-x',
          maskPosition: 'bottom',
          WebkitMaskImage: 'linear-gradient(45deg, transparent 50%, black 50%), linear-gradient(-45deg, transparent 50%, black 50%)',
          WebkitMaskSize: '20px 20px',
          WebkitMaskRepeat: 'repeat-x',
          WebkitMaskPosition: 'bottom',
        }}
      />
    </div>
  );
}
