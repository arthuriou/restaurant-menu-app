import { Invoice, Order, RestaurantInfo } from "@/types";
import { generateInvoiceNumber, calculateTax, calculateTotal } from "./invoice-utils";

/**
 * Generate an invoice from an order
 * This function can be called when an order is marked as "served" or when payment is confirmed
 */
export const generateInvoiceFromOrder = (
  order: Order,
  restaurantInfo: RestaurantInfo,
  paymentMethod?: "cash" | "card" | "mobile",
  taxRate: number = 0
): Invoice => {
  const subtotal = order.total;
  // Prices are TTC (Tax Inclusive)
  const total = subtotal;
  const tax = calculateTax(total, taxRate);

  // Determine type based on explicit "emporter" label
  const orderAny = order as any;
  const isTakeaway = orderAny.table?.toLowerCase().includes('emporter') || orderAny.type === 'takeaway';

  const invoice: Invoice = {
    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    number: generateInvoiceNumber(),
    type: isTakeaway ? "takeaway" : "table",
    tableId: order.tableId,
    items: order.items,
    subtotal: subtotal,
    tax: tax,
    taxRate: taxRate,
    total: total,
    status: paymentMethod ? "paid" : "pending",
    paymentMethod: paymentMethod,
    createdAt: order.createdAt,
    paidAt: paymentMethod ? ({ seconds: Date.now() / 1000, nanoseconds: 0 } as any) : undefined,
    restaurantInfo: restaurantInfo
  };

  return invoice;
};

/**
 * Generate an invoice for a takeaway order (walk-in customer)
 */
export const generateTakeawayInvoice = (
  items: Invoice['items'],
  restaurantInfo: RestaurantInfo,
  customerName?: string,
  paymentMethod?: "cash" | "card" | "mobile",
  taxRate: number = 0
): Invoice => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  // Prices are TTC
  const total = subtotal;
  const tax = calculateTax(total, taxRate);

  const invoice: Invoice = {
    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    number: generateInvoiceNumber(),
    type: "takeaway",
    customerName: customerName || "Client",
    items: items,
    subtotal: subtotal,
    tax: tax,
    taxRate: taxRate,
    total: total,
    status: paymentMethod ? "paid" : "pending",
    paymentMethod: paymentMethod,
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    paidAt: paymentMethod ? ({ seconds: Date.now() / 1000, nanoseconds: 0 } as any) : undefined,
    restaurantInfo: restaurantInfo
  };

  return invoice;
};

/**
 * Generate a consolidated invoice from multiple orders for the same table
 */
export const generateConsolidatedInvoice = (
  orders: Order[],
  restaurantInfo: RestaurantInfo,
  paymentMethod?: "cash" | "card" | "mobile",
  taxRate: number = 20
): Invoice => {
  // Merge items from all orders
  const allItems = orders.flatMap(order => order.items);
  
  // Calculate totals
  const subtotal = orders.reduce((sum, order) => sum + order.total, 0);
  // Prices are TTC
  const total = subtotal;
  const tax = Math.round((total * taxRate / (100 + taxRate)) * 100) / 100;

  // Use the table ID from the first order (assuming all are from same table)
  const tableId = orders[0]?.tableId || "Unknown";

  const invoice: Invoice = {
    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    number: generateInvoiceNumber(),
    type: "table",
    tableId: tableId,
    items: allItems,
    subtotal: subtotal,
    tax: tax,
    taxRate: taxRate,
    total: total,
    status: paymentMethod ? "paid" : "pending",
    paymentMethod: paymentMethod,
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    paidAt: paymentMethod ? ({ seconds: Date.now() / 1000, nanoseconds: 0 } as any) : undefined,
    restaurantInfo: restaurantInfo
  };

  return invoice;
};

/**
 * Save invoice to Firestore
 * TODO: Implement with Firebase
 */
export const saveInvoice = async (invoice: Invoice): Promise<void> => {
  // TODO: Implement Firebase Firestore save
  // import { doc, setDoc } from 'firebase/firestore';
  // import { db } from '@/lib/firebase';
  // 
  // await setDoc(doc(db, 'invoices', invoice.id), invoice);
  
  console.log("Invoice would be saved:", invoice);
};

/**
 * Fetch invoice from Firestore
 * TODO: Implement with Firebase
 */
export const getInvoice = async (invoiceId: string): Promise<Invoice | null> => {
  // TODO: Implement Firebase Firestore fetch
  // import { doc, getDoc } from 'firebase/firestore';
  // import { db } from '@/lib/firebase';
  // 
  // const invoiceDoc = await getDoc(doc(db, 'invoices', invoiceId));
  // return invoiceDoc.exists() ? invoiceDoc.data() as Invoice : null;
  
  console.log("Fetching invoice:", invoiceId);
  return null;
};

/**
 * Update invoice status
 * TODO: Implement with Firebase
 */
export const updateInvoiceStatus = async (
  invoiceId: string,
  status: Invoice['status'],
  paymentMethod?: Invoice['paymentMethod']
): Promise<void> => {
  // TODO: Implement Firebase Firestore update
  // import { doc, updateDoc } from 'firebase/firestore';
  // import { db } from '@/lib/firebase';
  // 
  // const updateData: any = { status };
  // if (status === 'paid' && paymentMethod) {
  //   updateData.paymentMethod = paymentMethod;
  //   updateData.paidAt = { seconds: Date.now() / 1000, nanoseconds: 0 };
  // }
  //
  // await updateDoc(doc(db, 'invoices', invoiceId), updateData);
  
  console.log("Invoice status would be updated:", { invoiceId, status, paymentMethod });
};
