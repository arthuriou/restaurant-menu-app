"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Invoice } from "@/types";
import { TicketPDF } from "./TicketPDF";

// Dynamically import PDFViewer to avoid SSR/hydration issues with @react-pdf/renderer
const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full w-full bg-zinc-100 dark:bg-zinc-900 text-sm text-muted-foreground">
        Chargement du PDF...
      </div>
    ),
  },
);

interface TicketPreviewProps {
  invoice: Invoice;
  settings?: {
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    taxId?: string;
    logoUrl?: string;
    footerMessage?: string;
    showLogo: boolean;
    showTaxId: boolean;
  };
}

const TicketPreview = ({ invoice, settings }: TicketPreviewProps) => {
  return (
    <PDFViewer
      width="100%"
      height="100%"
      className="border-none"
      showToolbar={true}
    >
      <TicketPDF invoice={invoice} settings={settings} />
    </PDFViewer>
  );
};

export default TicketPreview;
