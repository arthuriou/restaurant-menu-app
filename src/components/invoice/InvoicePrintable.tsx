"use client";

import { forwardRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Invoice } from "@/types";
import { formatCurrency, getInvoiceTypeLabel, getPaymentMethodLabel } from "@/lib/invoice-utils";
import { cn } from "@/lib/utils";

interface InvoicePrintableProps {
  invoice: Invoice;
  templateType?: 'a4' | 'ticket';
}

export const InvoicePrintable = forwardRef<HTMLDivElement, InvoicePrintableProps>(
  ({ invoice, templateType = 'a4' }, ref) => {
    const { restaurantInfo, items, subtotal, tax, total, discount } = invoice;
    const isTicket = templateType === 'ticket';

    return (
      <div 
        ref={ref} 
        className={cn(
          "bg-white text-black mx-auto font-sans leading-relaxed",
          isTicket ? "max-w-[80mm] p-4 text-xs" : "max-w-4xl p-12 text-sm"
        )}
      >
        {/* Header */}
        <div className={cn("mb-8", isTicket ? "text-center border-b border-dashed border-black pb-4" : "border-b border-dashed border-gray-300 pb-8")}>
          <div className={cn("flex", isTicket ? "flex-col items-center" : "justify-between items-start")}>
            <div className={cn(isTicket ? "mb-2" : "")}>
              {restaurantInfo.logo && (
                <img 
                  src={restaurantInfo.logo} 
                  alt={restaurantInfo.name}
                  className={cn("object-contain mb-4", isTicket ? "h-16 mx-auto" : "h-24")}
                />
              )}
              <h1 className={cn("font-bold uppercase tracking-wider", isTicket ? "text-lg" : "text-2xl text-primary")}>
                {restaurantInfo.name}
              </h1>
              <div className="text-gray-500 mt-1 space-y-0.5">
                <p>{restaurantInfo.address}</p>
                <p>Tél: {restaurantInfo.phone}</p>
                {restaurantInfo.email && <p>{restaurantInfo.email}</p>}
                {restaurantInfo.taxId && <p>N° TVA: {restaurantInfo.taxId}</p>}
              </div>
            </div>

            {!isTicket && (
              <div className="text-right">
                <h2 className="text-4xl font-black text-gray-900 mb-2">FACTURE</h2>
                <p className="text-lg font-mono text-gray-600">#{invoice.number}</p>
                <div className="mt-4 text-gray-500">
                  <p className="font-medium text-gray-900">Date d'émission</p>
                  <p>{format(new Date(invoice.createdAt.seconds * 1000), 'PPP', { locale: fr })}</p>
                  <p>{format(new Date(invoice.createdAt.seconds * 1000), 'p', { locale: fr })}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ticket Info (Date/Number) */}
        {isTicket && (
          <div className="mb-4 text-center border-b border-dashed border-black pb-4">
            <p className="font-bold text-sm">FACTURE #{invoice.number}</p>
            <p className="text-gray-500">
              {format(new Date(invoice.createdAt.seconds * 1000), 'Pp', { locale: fr })}
            </p>
          </div>
        )}

        {/* Customer Info */}
        <div className={cn("mb-8", isTicket ? "text-center" : "bg-gray-50 p-6 rounded-xl")}>
          {!isTicket && <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-3">Client</h3>}
          <div className={cn(isTicket ? "" : "flex justify-between items-center")}>
            <div>
              <p className="font-bold text-lg">
                {invoice.type === 'table' ? invoice.tableId : invoice.customerName || 'Client Comptoir'}
              </p>
              <p className="text-gray-500">
                {getInvoiceTypeLabel(invoice.type)}
              </p>
            </div>
            {invoice.serverName && (
              <div className={cn(isTicket ? "mt-1" : "text-right")}>
                <p className="text-gray-500">Serveur</p>
                <p className="font-medium">{invoice.serverName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className={cn("border-b border-dashed border-black", isTicket ? "text-[10px]" : "text-xs uppercase tracking-wider text-gray-500")}>
                <th className="text-left py-2 font-semibold">Article</th>
                <th className="text-center py-2 font-semibold w-12">Qté</th>
                {!isTicket && <th className="text-right py-2 font-semibold w-24">P.U.</th>}
                <th className="text-right py-2 font-semibold w-24">Total</th>
              </tr>
            </thead>
            <tbody className={cn(isTicket ? "text-[11px]" : "text-sm")}>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-dashed border-gray-200 last:border-0">
                  <td className="py-3">
                    <div className="font-medium">{item.name}</div>
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <div className="text-gray-500 text-[10px] mt-0.5">
                        {item.selectedOptions.map(opt => opt.name).join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="text-center py-3 align-top">{item.qty}</td>
                  {!isTicket && <td className="text-right py-3 align-top text-gray-500">{formatCurrency(item.price)}</td>}
                  <td className="text-right py-3 align-top font-medium">
                    {formatCurrency(item.price * item.qty)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className={cn("flex flex-col", isTicket ? "border-t border-dashed border-black pt-4" : "items-end")}>
          <div className={cn("space-y-2", isTicket ? "w-full" : "w-64")}>
            <div className="flex justify-between text-gray-600">
              <span>Sous-total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Remise</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>TVA ({invoice.taxRate}%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className={cn("flex justify-between font-black text-xl pt-4 border-t border-dashed border-black mt-4", isTicket ? "" : "text-2xl")}>
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        {restaurantInfo.footerMessage && (
          <div className={cn("mt-12 text-center text-gray-500", isTicket ? "text-[10px]" : "text-sm")}>
            <p>{restaurantInfo.footerMessage}</p>
            <p className="mt-2 font-mono text-[10px]">Généré par RestaurantOS</p>
          </div>
        )}

        {/* Print Styles */}
        <style jsx>{`
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            @page {
              margin: ${isTicket ? '0' : '1cm'};
              size: ${isTicket ? '80mm auto' : 'A4'};
            }
          }
        `}</style>
      </div>
    );
  }
);

InvoicePrintable.displayName = "InvoicePrintable";
