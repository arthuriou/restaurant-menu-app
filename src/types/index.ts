 import type { Timestamp } from "firebase/firestore";
export type Role = "admin" | "server";

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
};

export type Table = {
  id: string;
  label: string;
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
