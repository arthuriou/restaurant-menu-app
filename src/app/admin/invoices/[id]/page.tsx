"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  ArrowLeft, Printer, Download, Share2, XCircle, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "@/types";
import { InvoicePrintable } from "@/components/invoice/InvoicePrintable";
import {
  formatCurrency,
  formatInvoiceNumber,
  getInvoiceTypeLabel,
  getInvoiceStatusConfig,
  getPaymentMethodLabel
} from "@/lib/invoice-utils";
import { toast } from "sonner";

// Mock invoice - Will be fetched from Firebase
const mockInvoice: Invoice = {
  id: "inv_1",
  number: "INV-2024-00001",
  type: "table",
  tableId: "Table 5",
  items: [
    { menuId: "1", name: "Poulet Braisé", price: 4500, qty: 2 },
    { menuId: "2", name: "Coca Cola", price: 1000, qty: 2 },
    { menuId: "3", name: "Salade César", price: 2500, qty: 1, note: "Sans croûtons" }
  ],
  subtotal: 14500,
  tax: 2900,
  taxRate: 20,
  total: 17400,
  status: "paid",
  paymentMethod: "card",
  createdAt: { seconds: Date.now() / 1000 - 3600, nanoseconds: 0 } as any,
  paidAt: { seconds: Date.now() / 1000 - 3500, nanoseconds: 0 } as any,
  notes: "Merci pour votre visite !",
  restaurantInfo: {
    name: "Restaurant Le Gourmet",
    address: "123 Avenue des Saveurs, Abidjan, Côte d'Ivoire",
    phone: "+225 27 XX XX XX XX",
    email: "contact@legourmet.ci",
    taxId: "CI-123456789"
  }
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [invoice] = useState<Invoice>(mockInvoice);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    toast.info("Téléchargement PDF en cours...");
    // TODO: Implement PDF generation
    // Option: Use jsPDF or react-pdf
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/invoice/${invoice.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Facture ${invoice.number}`,
          text: `Facture - ${invoice.restaurantInfo.name}`,
          url: url
        });
        toast.success("Partagé !");
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Lien copié dans le presse-papier !");
    }
  };

  const handleCancel = () => {
    // TODO: Implement cancel invoice
    toast.info("Annulation de la facture...");
  };

  const statusConfig = getInvoiceStatusConfig(invoice.status);

  return (
    <>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {formatInvoiceNumber(invoice.number)}
              </h2>
              <p className="text-muted-foreground mt-1">
                {format(new Date(invoice.createdAt.seconds * 1000), 'PPP à p', { locale: fr })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className={`${statusConfig.color} font-semibold px-4 py-2`}>
              {statusConfig.label}
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={handleDownloadPDF}
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>

            {invoice.status === "pending" && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleCancel}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            )}
          </div>
        </div>

        {/* Invoice Preview (Printable) */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <CardContent className="p-0">
            <InvoicePrintable ref={printRef} invoice={invoice} />
          </CardContent>
        </Card>

        {/* Additional Info (not printed) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Type</div>
              <div className="text-lg font-semibold">
                {getInvoiceTypeLabel(invoice.type)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {invoice.type === 'table' ? invoice.tableId : invoice.customerName}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Paiement</div>
              <div className="text-lg font-semibold">
                {invoice.paymentMethod ? getPaymentMethodLabel(invoice.paymentMethod) : 'Non payée'}
              </div>
              {invoice.paidAt && (
                <div className="text-sm text-muted-foreground mt-1">
                  Payé le {format(new Date(invoice.paidAt.seconds * 1000), 'PPp', { locale: fr })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Montant total</div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(invoice.total)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                TVA incluse ({invoice.taxRate}%)
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </>
  );
}
