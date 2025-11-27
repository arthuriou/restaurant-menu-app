import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Invoice } from '@/types';

interface InvoiceState {
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
}

// Mock data
const initialInvoices: Invoice[] = [
  {
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
      address: "123 Avenue des Saveurs",
      phone: "+225 27 XX XX XX XX"
    }
  },
  {
    id: "inv_2",
    number: "INV-2024-00002",
    type: "takeaway",
    customerName: "Jean Dupont",
    items: [
      { menuId: "3", name: "Burger Classic", price: 3500, qty: 3 }
    ],
    subtotal: 10500,
    tax: 2100,
    taxRate: 20,
    total: 12600,
    status: "paid",
    paymentMethod: "cash",
    createdAt: { seconds: Date.now() / 1000 - 1800, nanoseconds: 0 } as any,
    paidAt: { seconds: Date.now() / 1000 - 1700, nanoseconds: 0 } as any,
    restaurantInfo: {
      name: "Restaurant Le Gourmet",
      address: "123 Avenue des Saveurs",
      phone: "+225 27 XX XX XX XX"
    }
  }
];

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set) => ({
      invoices: initialInvoices,

      addInvoice: (invoice) => set((state) => ({
        invoices: [invoice, ...state.invoices]
      })),

      updateInvoice: (id, updates) => set((state) => ({
        invoices: state.invoices.map((inv) => inv.id === id ? { ...inv, ...updates } : inv)
      })),

      deleteInvoice: (id) => set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id)
      }))
    }),
    {
      name: 'restaurant-invoices-storage',
    }
  )
);
