import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { Invoice } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency } from "@/lib/invoice-utils";

// Styles compacts pour ticket de caisse (80mm)
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 10,
    backgroundColor: "#ffffff",
    flexDirection: "column",
  },
  header: {
    marginBottom: 5,
    textAlign: "center",
  },
  logo: {
    width: 40,
    height: 40,
    marginBottom: 2,
    alignSelf: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 9,
    color: "#000000",
    marginBottom: 1,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    borderBottomStyle: "dashed",
    marginTop: 2,
    marginBottom: 2,
  },
  invoiceInfo: {
    marginTop: 2,
    marginBottom: 2,
    textAlign: "center",
  },
  invoiceNumber: {
    fontSize: 11,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  tableHeader: {
    flexDirection: "row",
    marginTop: 2,
    marginBottom: 2,
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    marginBottom: 1,
    fontSize: 9,
  },
  colItem: { width: "55%" },
  colQty: { width: "15%", textAlign: "center" },
  colPrice: { width: "30%", textAlign: "right" },

  totals: {
    marginTop: 2,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
    fontWeight: "bold",
    fontSize: 12,
  },

  spacer: {
    flexGrow: 1,
  },

  footer: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 8,
    color: "#444444",
  },
});

interface TicketPDFProps {
  invoice: Invoice;
  settings?: {
    // Source de vérité live (template)
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

export const TicketPDF = ({ invoice, settings }: TicketPDFProps) => {
  const { items, subtotal, tax, total, discount } = invoice;

  // Template settings (live) are the source of truth for header/footer
  const showLogo = settings?.showLogo ?? true;
  const showTaxId = settings?.showTaxId ?? true;

  const companyName =
    (settings?.companyName && settings.companyName.trim()) || "Restaurant";
  const companyAddress = (settings?.companyAddress || "").trim();
  const companyPhone = (settings?.companyPhone || "").trim();
  const taxId = (settings?.taxId || "").trim();
  const logoSrc = (settings?.logoUrl || "").trim();

  const footerMessage = (settings?.footerMessage || "").trim();

  // Height estimation:
  // We keep the page *tight* to content, but we also reserve a tiny fixed area for the footer to sit "at the bottom".
  // The trick: small extra bottom + a flex spacer. This avoids huge whitespace while still anchoring the footer low.
  const pagePadding = 10; // must match styles.page.padding
  const headerHeight = 120; // logo/name/address/phone/tax
  const infoHeight = 65; // invoice number + date + separators
  const tableServerHeight = 20;
  const itemsHeaderHeight = 22;

  // Totals block: tighten to reduce remaining blank space.
  const totalsHeight = 50;

  const footerBlockHeight = footerMessage ? 26 : 0;

  // Per item:
  // - base row for name/qty/price
  // - +1 extra line when options are present
  const perItemBase = 14;
  const perOptionsLine = 9;

  const optionsLines = items.reduce((acc, item) => {
    if (!item.selectedOptions || item.selectedOptions.length === 0) return acc;
    return acc + 1;
  }, 0);

  const contentHeight =
    pagePadding * 2 +
    headerHeight +
    infoHeight +
    tableServerHeight +
    itemsHeaderHeight +
    items.length * perItemBase +
    optionsLines * perOptionsLine +
    totalsHeight +
    footerBlockHeight;

  // Small fixed reserved space to visually place footer at the very bottom without creating a huge blank area.
  const extraBottom = footerMessage ? 6 : 0;

  // Minimal safety so the last line never clips in some PDF viewers.
  const safetyBottom = 2;

  const minHeight = 180;
  const pageHeight = Math.max(
    minHeight,
    contentHeight + extraBottom + safetyBottom,
  );

  return (
    <Document>
      {/* Largeur 80mm ~= 226 points */}
      <Page size={[226, pageHeight]} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {showLogo && !!logoSrc && <Image src={logoSrc} style={styles.logo} />}
          <Text style={styles.title}>{companyName}</Text>
          {!!companyAddress && (
            <Text style={styles.subtitle}>{companyAddress}</Text>
          )}
          {!!companyPhone && (
            <Text style={styles.subtitle}>Tél: {companyPhone}</Text>
          )}
          {showTaxId && !!taxId && (
            <Text style={styles.subtitle}>N° TVA: {taxId}</Text>
          )}
        </View>

        <View style={styles.separator} />

        {/* Invoice Info */}
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceNumber}>#{invoice.number}</Text>
          <Text style={{ fontSize: 8 }}>
            {format(new Date(invoice.createdAt.seconds * 1000), "Pp", {
              locale: fr,
            })}
          </Text>
        </View>

        <View style={styles.separator} />

        {/* Table / Server */}
        <View style={styles.row}>
          <Text>
            {invoice.type === "table"
              ? `Table: ${invoice.tableId?.replace("Table ", "")}`
              : "À emporter"}
          </Text>
          <Text>Serveur: {invoice.serverName || "-"}</Text>
        </View>

        {/* Items Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.colItem}>Article</Text>
          <Text style={styles.colQty}>Qté</Text>
          <Text style={styles.colPrice}>Total</Text>
        </View>

        <View style={styles.separator} />

        {/* Items List */}
        {items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={styles.colItem}>
              <Text>{item.name}</Text>
              {item.selectedOptions && item.selectedOptions.length > 0 && (
                <Text style={{ fontSize: 7, color: "#666" }}>
                  {item.selectedOptions.map((opt) => opt.name).join(", ")}
                </Text>
              )}
            </View>
            <Text style={styles.colQty}>{item.qty}</Text>
            <Text style={styles.colPrice}>
              {formatCurrency(item.price * item.qty)}
            </Text>
          </View>
        ))}

        <View style={styles.separator} />

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.row}>
            <Text>Sous-total</Text>
            <Text>{formatCurrency(subtotal)}</Text>
          </View>
          {(discount || 0) > 0 && (
            <View style={styles.row}>
              <Text>Remise</Text>
              <Text>-{formatCurrency(discount || 0)}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text>TVA ({invoice.taxRate}%)</Text>
            <Text>{formatCurrency(tax)}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Grand Total */}
        <View style={styles.grandTotal}>
          <Text>TOTAL</Text>
          <Text>{formatCurrency(total)}</Text>
        </View>

        {/* Spacer pushes the footer to the bottom of the page (we keep the page height tight so this doesn't create a huge gap) */}
        {!!footerMessage && <View style={styles.spacer} />}

        {/* Footer */}
        {!!footerMessage && (
          <View style={styles.footer}>
            <Text>{footerMessage}</Text>
            <Text style={{ marginTop: 2, fontSize: 6, color: "#888" }}>
              Généré par RestaurantOS
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
};
