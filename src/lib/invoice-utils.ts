import { Invoice, InvoiceType, InvoiceStatus, PaymentMethod } from "@/types";

// Generate sequential invoice number
// Format: INV-2024-00001
export const generateInvoiceNumber = (): string => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 99999) + 1;
  const paddedNum = randomNum.toString().padStart(5, "0");
  return `INV-${year}-${paddedNum}`;
};

// Calculate tax amount from subtotal
export const calculateTax = (
  subtotal: number,
  taxRate: number = 20,
): number => {
  return Math.round(((subtotal * taxRate) / 100) * 100) / 100;
};

// Calculate total with tax and optional discount
// Assumes subtotal is already TTC (Tax Inclusive)
export const calculateTotal = (
  subtotal: number,
  taxRate: number = 20,
  discount: number = 0,
): number => {
  return Math.round((subtotal - discount) * 100) / 100;
};

// Format currency (FCFA)
export const formatCurrency = (amount: number): string => {
  // `toLocaleString('fr-FR')` may emit narrow/no-break spaces (U+202F/U+00A0).
  // Some PDF renderers/fonts can display those incorrectly (e.g. as "/").
  const formatted = amount
    .toLocaleString("fr-FR")
    .replace(/\u202F|\u00A0/g, " ");
  return `${formatted} FCFA`;
};

// Format invoice number for display
export const formatInvoiceNumber = (number: string): string => {
  return number.toUpperCase();
};

// Get invoice type label
export const getInvoiceTypeLabel = (type: InvoiceType): string => {
  return type === "table" ? "Table" : "À emporter";
};

// Get status label and color
export const getInvoiceStatusConfig = (status: InvoiceStatus) => {
  const configs = {
    pending: {
      label: "En attente",
      color:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    paid: {
      label: "Payée",
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    cancelled: {
      label: "Annulée",
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
  };

  return configs[status];
};

// Get payment method label
export const getPaymentMethodLabel = (method?: PaymentMethod): string => {
  if (!method) return "-";

  const labels = {
    cash: "Espèces",
    card: "Carte bancaire",
    mobile: "Mobile Money",
  };

  return labels[method] || method;
};

// Mock restaurant info (to be replaced with Firebase data)
export const getRestaurantInfo = () => {
  return {
    name: "Restaurant Le Gourmet",
    address: "123 Avenue des Saveurs, Abidjan, Côte d'Ivoire",
    phone: "+225 27 XX XX XX XX",
    email: "contact@legourmet.ci",
    taxId: "CI-123456789",
    logo: undefined, // Will be from Cloudinary
  };
};
