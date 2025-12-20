"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useInvoiceStore } from "@/stores/invoices";
import { useRestaurantStore } from "@/stores/restaurant";
import { InvoicePrintable } from "@/components/invoice/InvoicePrintable";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function InvoicePrintPage() {
  const params = useParams();
  const router = useRouter();
  const { invoices } = useInvoiceStore();
  const { invoiceSettings } = useRestaurantStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const invoice = invoices.find(inv => inv.id === params.id);

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-xl font-semibold">Facture introuvable</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" /> Imprimer
        </Button>
      </div>
      
      <div className="shadow-lg print:shadow-none flex justify-center">
        <InvoicePrintable 
          invoice={invoice} 
          templateType={invoiceSettings.templateType}
        />
      </div>

      <style jsx global>{`
        @media print {
          @page { margin: 0; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}
