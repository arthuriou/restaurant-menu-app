"use client";

import { useParams } from "next/navigation";
import { useState, useRef } from "react";
import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Invoice } from "@/types";
import { InvoicePrintable } from "@/components/invoice/InvoicePrintable";
import { toast } from "sonner";

// Mock invoice - Will be fetched from Firebase using invoice ID from params
const mockInvoice: Invoice = {
  id: "inv_1",
  number: "INV-2024-00001",
  type: "table",
  tableId: "Table 5",
  items: [
    { menuId: "1", name: "Poulet Braisé", price: 4500, qty: 2 },
    { menuId: "2", name: "Coca Cola", price: 1000, qty: 2 }
  ],
  subtotal: 11000,
  tax: 2200,
  taxRate: 20,
  total: 13200,
  status: "paid",
  paymentMethod: "card",
  createdAt: { seconds: Date.now() / 1000 - 3600, nanoseconds: 0 } as any,
  paidAt: { seconds: Date.now() / 1000 - 3500, nanoseconds: 0 } as any,
  restaurantInfo: {
    name: "Restaurant Le Gourmet",
    address: "123 Avenue des Saveurs, Abidjan, Côte d'Ivoire",
    phone: "+225 27 XX XX XX XX",
    email: "contact@legourmet.ci",
    taxId: "CI-123456789"
  }
};

export default function PublicInvoicePage() {
  const params = useParams();
  const printRef = useRef<HTMLDivElement>(null);
  const [invoice] = useState<Invoice>(mockInvoice);
  const [loading, setLoading] = useState(false);

  // TODO: Fetch invoice from Firebase using params.id
  // useEffect(() => {
  //   const fetchInvoice = async () => {
  //     const invoiceDoc = await getDoc(doc(db, 'invoices', params.id as string));
  //     setInvoice(invoiceDoc.data() as Invoice);
  //   };
  //   fetchInvoice();
  // }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    toast.info("Téléchargement PDF en cours...");
    // TODO: Implement PDF generation
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de la facture...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Action Buttons - Not printed */}
        <div className="flex justify-end gap-3 mb-6 no-print">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl bg-white dark:bg-zinc-900"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimer
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl bg-white dark:bg-zinc-900"
            onClick={handleDownloadPDF}
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger PDF
          </Button>
        </div>

        {/* Invoice */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <InvoicePrintable ref={printRef} invoice={invoice} />
        </div>

        {/* Footer - Not printed */}
        <div className="text-center mt-8 text-muted-foreground text-sm no-print">
          <p>Cette facture a été générée par {invoice.restaurantInfo.name}</p>
          <p className="mt-1">Pour toute question, contactez-nous au {invoice.restaurantInfo.phone}</p>
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
          .rounded-2xl {
            border-radius: 0 !important;
          }
          .shadow-lg {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
