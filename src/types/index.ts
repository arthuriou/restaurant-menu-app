import type { Timestamp } from "firebase/firestore";

export type Role = "admin" | "server" | "kitchen";

export type Category = {
  id: string;
  name: string;
  order: number;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  available: boolean;
  options?: {
    name: string;
    price: number;
    type: 'addon' | 'variant';
  }[];
};

export type OrderItem = {
  menuId: string;
  name: string;
  price: number;
  qty: number;
  options?: Record<string, string | number | boolean>;
  note?: string;
  imageUrl?: string;
};

export type OrderStatus = "pending" | "preparing" | "ready" | "served";

export type Order = {
  id: string;
  tableId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Timestamp;
};

// Invoice Types
export type InvoiceType = "table" | "takeaway";
export type PaymentMethod = "cash" | "card" | "mobile";
export type InvoiceStatus = "pending" | "paid" | "cancelled";

export type RestaurantInfo = {
  name: string;
  address: string;
  phone: string;
  email?: string;
  taxId?: string;
  logo?: string;
};

export type Invoice = {
  id: string;
  number: string;              // Format: INV-2024-XXXXX
  type: InvoiceType;
  
  // Customer/Table info
  tableId?: string;            // For type "table"
  customerName?: string;       // For type "takeaway"
  
  // Order details
  items: OrderItem[];
  subtotal: number;
  tax: number;                 // TVA amount
  taxRate: number;             // TVA percentage (e.g., 20 for 20%)
  discount?: number;           // Optional discount
  total: number;
  
  // Payment
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  serverName?: string;
  paidAt?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  createdBy?: string;          // User ID who created
  notes?: string;
  
  // Restaurant snapshot (immutable)
  restaurantInfo: RestaurantInfo;
};

export type StaffMember = {
  id: string;
  name: string;
  role: Role;
  pin: string;
  active: boolean;
  createdAt: number;
};
