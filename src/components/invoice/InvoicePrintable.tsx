"use client";

import { forwardRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Invoice } from "@/types";
import { formatCurrency, getInvoiceTypeLabel, getPaymentMethodLabel } from "@/lib/invoice-utils";

interface InvoicePrintableProps {
  invoice: Invoice;
}

export const InvoicePrintable = forwardRef<HTMLDivElement, InvoicePrintableProps>(
  ({ invoice }, ref) => {
    const { restaurantInfo, items, subtotal, tax, taxRate, total, discount } = invoice;

    return (
      <div ref={ref} className="bg-white text-black p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b-2 border-black pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              {restaurantInfo.logo && (
                <img 
                  src={restaurantInfo.logo} 
                  alt={restaurantInfo.name}
                  className="h-16 w-auto mb-4"
                />
              )}
              <h1 className="text-3xl font-bold mb-2">{restaurantInfo.name}</h1>
              <p className="text-sm text-gray-600">{restaurantInfo.address}</p>
              <p className="text-sm text-gray-600">Tél: {restaurantInfo.phone}</p>
              {restaurantInfo.email && (
                <p className="text-sm text-gray-600">Email: {restaurantInfo.email}</p>
              )}
              {restaurantInfo.taxId && (
                <p className="text-sm text-gray-600">N° TVA: {restaurantInfo.taxId}</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold mb-2">FACTURE</h2>
              <p className="text-lg font-mono">{invoice.number}</p>
              <p className="text-sm text-gray-600 mt-2">
                {format(new Date(invoice.createdAt.seconds * 1000), 'PPP', { locale: fr })}
              </p>
              <p className="text-sm text-gray-600">
                {format(new Date(invoice.createdAt.seconds * 1000), 'p', { locale: fr })}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8">
          <h3 className="font-bold text-sm uppercase mb-2 text-gray-700">Client</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold">
              {invoice.type === 'table' ? `Table ${invoice.tableId}` : invoice.customerName || 'Client'}
            </p>
            <p className="text-sm text-gray-600">
              Type: {getInvoiceTypeLabel(invoice.type)}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="text-left py-3 font-bold">Article</th>
              <th className="text-center py-3 font-bold w-20">Qté</th>
              <th className="text-right py-3 font-bold w-32">Prix Unit.</th>
              <th className="text-right py-3 font-bold w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3">
                  <div className="font-medium">{item.name}</div>
                  {item.note && (
                    <div className="text-sm text-gray-600 italic mt-1">Note: {item.note}</div>
                  )}
                  {item.options && Object.keys(item.options).length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      {Object.entries(item.options).map(([key, value]) => (
                        <span key={key} className="mr-3">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="text-center py-3">{item.qty}</td>
                <td className="text-right py-3">{formatCurrency(item.price)}</td>
                <td className="text-right py-3 font-semibold">
                  {formatCurrency(item.price * item.qty)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Sous-total</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            
            {discount && discount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-200 text-green-600">
                <span>Remise</span>
                <span className="font-semibold">- {formatCurrency(discount)}</span>
              </div>
            )}
            
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">TVA ({taxRate}%)</span>
              <span className="font-semibold">{formatCurrency(tax)}</span>
            </div>
            
            <div className="flex justify-between py-4 border-t-2 border-gray-800">
              <span className="text-xl font-bold">TOTAL</span>
              <span className="text-2xl font-bold">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        {invoice.paymentMethod && (
          <div className="mb-8 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-sm uppercase mb-2 text-gray-700">Paiement</h3>
            <div className="flex justify-between items-center">
              <span>Méthode de paiement:</span>
              <span className="font-semibold">{getPaymentMethodLabel(invoice.paymentMethod)}</span>
            </div>
            {invoice.paidAt && (
              <div className="flex justify-between items-center mt-2">
                <span>Payé le:</span>
                <span className="font-semibold">
                  {format(new Date(invoice.paidAt.seconds * 1000), 'PPp', { locale: fr })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-8">
            <h3 className="font-bold text-sm uppercase mb-2 text-gray-700">Notes</h3>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-lg font-semibold mb-2">Merci de votre visite !</p>
          <p className="text-sm text-gray-600">
            À bientôt au {restaurantInfo.name}
          </p>
        </div>

        {/* Print Styles */}
        <style jsx>{`
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
            @page {
              margin: 1cm;
              size: A4;
            }
          }
        `}</style>
      </div>
    );
  }
);

InvoicePrintable.displayName = "InvoicePrintable";
