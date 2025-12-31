"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  Printer,
  Download,
  Share2,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "@/types";
import { InvoicePrintable } from "@/components/invoice/InvoicePrintable";
import { useRestaurantStore } from "@/stores/restaurant";
import {
  formatCurrency,
  formatInvoiceNumber,
  getInvoiceTypeLabel,
  getInvoiceStatusConfig,
  getPaymentMethodLabel,
} from "@/lib/invoice-utils";
import { toast } from "sonner";
import { useInvoiceStore } from "@/stores/invoices";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generatePDF } from "@/lib/pdf-utils";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const { invoices } = useInvoiceStore();
  const { invoiceSettings } = useRestaurantStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!params.id) return;
      const id = params.id as string;

      // Try to find in store first
      const found = invoices.find((i) => i.id === id);
      if (found) {
        setInvoice(found);
        setLoading(false);
        return;
      }

      // Fetch from Firestore if not in store
      try {
        const docRef = doc(db, "invoices", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setInvoice({ id: docSnap.id, ...docSnap.data() } as Invoice);
        } else {
          toast.error("Facture introuvable");
          router.push("/admin/invoices");
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
        toast.error("Erreur lors du chargement de la facture");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [params.id, invoices, router]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    try {
      toast.info("Génération du PDF en cours...");
      await generatePDF(
        "admin-invoice-content",
        `facture-${invoice.number}.pdf`,
      );
      toast.success("PDF téléchargé !");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  const handleShare = async () => {
    if (!invoice) return;
    const url = `${window.location.origin}/invoice/${invoice.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Facture ${invoice.number}`,
          text: `Facture - ${invoice.restaurantInfo.name}`,
          url: url,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Chargement...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Facture introuvable
      </div>
    );
  }

  const statusConfig = getInvoiceStatusConfig(invoice.status);

  // Helper for safe date formatting
  const formatDate = (dateValue: any, formatStr: string) => {
    if (!dateValue) return "-";
    try {
      let date: Date;
      if (dateValue instanceof Date) date = dateValue;
      else if (dateValue.toDate) date = dateValue.toDate();
      else if (dateValue.seconds) date = new Date(dateValue.seconds * 1000);
      else date = new Date(dateValue);

      return format(date, formatStr, { locale: fr });
    } catch (e) {
      return "-";
    }
  };

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
                {formatDate(invoice.createdAt, "PPP à p")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={`${statusConfig.color} font-semibold px-4 py-2`}
            >
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
          <CardContent className="p-0 flex justify-center">
            <InvoicePrintable
              id="admin-invoice-content"
              ref={printRef}
              invoice={invoice}
              templateType={invoiceSettings.templateType}
            />
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
                {invoice.type === "table"
                  ? invoice.tableId
                  : invoice.customerName}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Paiement</div>
              <div className="text-lg font-semibold">
                {invoice.paymentMethod
                  ? getPaymentMethodLabel(invoice.paymentMethod)
                  : "Non payée"}
              </div>
              {invoice.paidAt && (
                <div className="text-sm text-muted-foreground mt-1">
                  Payé le {formatDate(invoice.paidAt, "PPp")}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground mb-2">
                Montant total
              </div>
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
