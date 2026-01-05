"use client";

import { forwardRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Invoice } from "@/types";
import {
  formatCurrency,
  getInvoiceTypeLabel,
  getPaymentMethodLabel,
} from "@/lib/invoice-utils";
import { cn } from "@/lib/utils";

interface InvoicePrintableProps {
  invoice: Invoice;
  templateType?: "a4" | "ticket";
  id?: string;
}

export const InvoicePrintable = forwardRef<
  HTMLDivElement,
  InvoicePrintableProps
>(({ invoice, templateType = "a4", id }, ref) => {
  const { restaurantInfo, items, subtotal, tax, total, discount } = invoice;
  const isTicket = templateType === "ticket";

  return (
    <div
      ref={ref}
      id={id}
      className={cn(
        "bg-white text-black font-sans leading-relaxed",
        isTicket
          ? "w-[80mm] p-2 text-[11px] bg-white text-black"
          : "max-w-4xl mx-auto p-12 text-sm bg-white text-black",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "mb-2",
          isTicket
            ? "text-center border-b border-dashed border-black pb-2 mb-2"
            : "border-b border-dashed border-gray-300 pb-8 mb-8",
        )}
      >
        <div
          className={cn(
            "flex",
            isTicket ? "flex-col items-center" : "justify-between items-start",
          )}
        >
          <div className={cn(isTicket ? "mb-1" : "")}>
            {restaurantInfo.logo && (
              <img
                src={restaurantInfo.logo}
                alt={restaurantInfo.name}
                className={cn(
                  "object-contain mb-2",
                  isTicket ? "h-12 mx-auto" : "h-24 mb-4",
                )}
              />
            )}
            <h1
              className={cn(
                "font-bold uppercase tracking-wider",
                isTicket ? "text-sm mb-1" : "text-2xl text-primary",
              )}
            >
              {restaurantInfo.name}
            </h1>
            <div
              className={cn(
                "text-gray-600 space-y-0.5",
                isTicket ? "text-[10px]" : "mt-1",
              )}
            >
              <p>{restaurantInfo.address}</p>
              <p>Tél: {restaurantInfo.phone}</p>
              {restaurantInfo.email && <p>{restaurantInfo.email}</p>}
              {restaurantInfo.taxId && <p>N° TVA: {restaurantInfo.taxId}</p>}
            </div>
          </div>

          {!isTicket && (
            <div className="text-right">
              <h2 className="text-4xl font-black text-gray-900 mb-2">
                FACTURE
              </h2>
              <p className="text-lg font-mono text-gray-600">
                #{invoice.number}
              </p>
              <div className="mt-4 text-gray-500">
                <p className="font-medium text-gray-900">Date d'émission</p>
                <p>
                  {format(new Date(invoice.createdAt.seconds * 1000), "PPP", {
                    locale: fr,
                  })}
                </p>
                <p>
                  {format(new Date(invoice.createdAt.seconds * 1000), "p", {
                    locale: fr,
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Info (Date/Number) */}
      {isTicket && (
        <div className="mb-2 text-center border-b border-dashed border-black pb-2">
          <p className="font-bold text-sm">#{invoice.number}</p>
          <p className="text-gray-600 text-[10px]">
            {format(new Date(invoice.createdAt.seconds * 1000), "Pp", {
              locale: fr,
            })}
          </p>
        </div>
      )}

      {/* Customer Info */}
      <div
        className={cn("mb-2", isTicket ? "" : "bg-gray-50 p-6 rounded-xl mb-8")}
      >
        {isTicket ? (
          <div className="flex justify-between text-[11px] mb-2 font-bold">
            <div className="text-left">
              {invoice.type === "table" ? (
                <>
                  <span>Table: </span>
                  <span>{invoice.tableId?.replace("Table ", "")}</span>
                </>
              ) : (
                <span>À emporter</span>
              )}
            </div>
            <div className="text-right">
              <span>Serveur: </span>
              <span>{invoice.serverName || "-"}</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                {invoice.type === "table" ? "Table" : "Mode"}
              </p>
              <p className="font-bold text-xl">
                {invoice.type === "table"
                  ? invoice.tableId
                  : "À emporter"}
              </p>
            </div>
            {invoice.serverName && (
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Serveur</p>
                <p className="font-bold text-xl">{invoice.serverName}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="mb-2">
        <table className="w-full">
          <thead>
            <tr
              className={cn(
                "border-b border-dashed border-black",
                isTicket
                  ? "text-[11px] pb-1 mb-1"
                  : "text-xs uppercase tracking-wider text-gray-500",
              )}
            >
              <th
                className={cn(
                  "text-left font-bold",
                  isTicket ? "pb-1 w-[55%]" : "py-1",
                )}
              >
                Article
              </th>
              <th
                className={cn(
                  "text-center font-bold",
                  isTicket ? "pb-1 w-[15%]" : "py-1 w-8",
                )}
              >
                Qté
              </th>
              {!isTicket && (
                <th className="text-right py-1 font-semibold w-24">P.U.</th>
              )}
              <th
                className={cn(
                  "text-right font-bold",
                  isTicket ? "pb-1 w-[30%]" : "py-1 w-16",
                )}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody className={cn(isTicket ? "text-[11px]" : "text-sm")}>
            {items.map((item, index) => (
              <tr
                key={index}
                className={cn(
                  isTicket
                    ? "mb-1"
                    : "border-b border-dashed border-gray-200 last:border-0",
                )}
              >
                <td className={cn("align-top", isTicket ? "pb-1" : "py-2")}>
                  <div className="font-medium leading-tight">{item.name}</div>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <div className="text-gray-600 text-[9px] mt-0.5 leading-tight">
                      {item.selectedOptions.map((opt) => opt.name).join(", ")}
                    </div>
                  )}
                </td>
                <td
                  className={cn(
                    "text-center align-top",
                    isTicket ? "pb-1" : "py-2",
                  )}
                >
                  {item.qty}
                </td>
                {!isTicket && (
                  <td className="text-right py-2 align-top text-gray-500">
                    {formatCurrency(item.price)}
                  </td>
                )}
                <td
                  className={cn(
                    "text-right align-top font-medium",
                    isTicket ? "pb-1" : "py-2",
                  )}
                >
                  {formatCurrency(item.price * item.qty)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div
        className={cn(
          "flex flex-col",
          isTicket
            ? "border-t border-dashed border-black pt-2 mt-1"
            : "items-end",
        )}
      >
        <div
          className={cn(
            "space-y-1",
            isTicket ? "w-full text-[11px]" : "w-64 space-y-2",
          )}
        >
          <div className="flex justify-between text-gray-600">
            <span>Sous-total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {(discount || 0) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Remise</span>
              <span>-{formatCurrency(discount || 0)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>TVA ({invoice.taxRate}%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div
            className={cn(
              "flex justify-between font-black pt-2 border-t border-dashed border-black mt-2",
              isTicket ? "text-base" : "text-2xl",
            )}
          >
            <span>TOTAL</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      {restaurantInfo.footerMessage && (
        <div
          className={cn(
            "text-center text-gray-500",
            isTicket ? "mt-4 text-[10px]" : "mt-12 text-sm",
          )}
        >
          <p>{restaurantInfo.footerMessage}</p>
          <p
            className={cn(
              "font-mono text-gray-400",
              isTicket ? "mt-1 text-[8px]" : "mt-2",
            )}
          >
            Généré par RestaurantOS
          </p>
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            margin: 0;
            padding: 0;
          }
          @page {
            margin: ${isTicket ? "0" : "1cm"};
            size: ${isTicket ? "80mm auto" : "A4"};
          }
        }
      `}</style>
    </div>
  );
});

InvoicePrintable.displayName = "InvoicePrintable";
