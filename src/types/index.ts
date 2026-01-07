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
  featured?: boolean; // Item vedette dans la section spécialités
  featuredOrder?: number; // Ordre d'affichage (optionnel)
  averageRating?: number; // Moyenne des avis (0-5)
  reviewCount?: number; // Nombre d'avis
  recommendations?: string[]; // IDs de menu items recommandés (boissons, vins, etc.)
  promotion?: {
    price: number; // Prix promotionnel
    startDate: number; // Timestamp début promo
    endDate: number; // Timestamp fin promo
  };
  options?: {
    name: string;
    price: number;
    type: "addon" | "variant";
    imageUrl?: string; // Image de l'option/variante
    description?: string; // Description optionnelle
  }[];
};

export type OrderItem = {
  menuId: string;
  name: string;
  price: number;
  qty: number;
  options?: Record<string, string | number | boolean>;
  selectedOptions?: { name: string; price: number }[]; // Added for ReviewDialog and UI
  note?: string;
  imageUrl?: string;
};

export type OrderStatus =
  | "pending"
  | "awaiting-payment"
  | "preparing"
  | "ready"
  | "served"
  | "paid"
  | "cancelled";

export type Order = {
  id: string;
  tableId: string;
  tableDocId?: string;
  customerName?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentStatus?: "pending" | "paid";
  createdAt: Timestamp;
};

// Review Type
export type Review = {
  id: string;
  itemId: string;
  orderId: string;
  tableId: string;
  rating: number;
  comment?: string;
  createdAt: number;
  itemName?: string;
  customerName?: string;
  customerPhone?: string;
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
  footerMessage?: string;
};

export type Invoice = {
  id: string;
  number: string; // Format: INV-2024-XXXXX
  type: InvoiceType;

  // Customer/Table info
  tableId?: string; // For type "table"
  customerName?: string; // For type "takeaway"

  // Order details
  items: OrderItem[];
  subtotal: number;
  tax: number; // TVA amount
  taxRate: number; // TVA percentage (e.g., 20 for 20%)
  discount?: number; // Optional discount
  total: number;

  // Payment
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  serverName?: string;
  paidAt?: Timestamp;

  // Metadata
  createdAt: Timestamp;
  createdBy?: string; // User ID who created
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
  avatar?: string; // Added for custom avatars
  createdAt: number;
};

export type MediaItem = {
  id: string;
  url: string;
  publicId: string; // Cloudinary public_id
  fileName: string;
  format: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: number;
};
