"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRestaurantStore } from "@/stores/restaurant";
import { InvoicePrintable } from "@/components/invoice/InvoicePrintable";
import { Button } from "@/components/ui/button";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { Invoice } from "@/types";
import dynamic from "next/dynamic";

// Dynamically import PDF components to avoid SSR issues
const TicketPreview = dynamic(
  () => import("@/components/invoice/TicketPreview"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    ),
  },
);

export default function PublicInvoicePrintPage() {
  const params = useParams();
  const { invoiceSettings, loadSettings } = useRestaurantStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!params.id) return;

      try {
        const docRef = doc(db, "invoices", params.id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setInvoice({ id: docSnap.id, ...docSnap.data() } as Invoice);
        } else {
          setError("Facture introuvable");
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError("Erreur lors du chargement de la facture");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse">
          Chargement de la facture...
        </p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <X className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Erreur
          </h1>
          <p className="text-muted-foreground">
            {error || "Facture introuvable"}
          </p>
        </div>
        <Button onClick={() => window.close()} variant="outline">
          Fermer la fenêtre
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100/50 dark:bg-zinc-950 flex flex-col print:bg-white print:block">
      {/* Header - Hidden when printing */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 print:hidden">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                Facture #{invoice.number}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Prête à être imprimée
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.close()}
              className="text-muted-foreground hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Fermer
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto print:p-0 print:overflow-visible">
        {invoiceSettings.templateType === "ticket" ? (
          <div className="max-w-4xl mx-auto h-[80vh]">
            <div className="h-full border rounded-xl overflow-hidden shadow-xl bg-zinc-900">
              <TicketPreview
                invoice={invoice}
                settings={{
                  companyName: invoiceSettings.companyName,
                  companyAddress: invoiceSettings.companyAddress,
                  companyPhone: invoiceSettings.companyPhone,
                  taxId: invoiceSettings.taxId,
                  logoUrl: invoiceSettings.logoUrl,
                  footerMessage: invoiceSettings.footerMessage,
                  showLogo: invoiceSettings.showLogo,
                  showTaxId: invoiceSettings.showTaxId,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-[80mm] sm:max-w-md mx-auto print:mx-0 print:max-w-none transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white shadow-xl rounded-none sm:rounded-sm overflow-hidden print:shadow-none print:rounded-none">
              <InvoicePrintable
                invoice={invoice}
                templateType={invoiceSettings.templateType}
              />
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6 print:hidden">
              Aperçu du ticket de caisse (HTML)
            </p>
          </div>
        )}
      </main>

      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
          }
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
