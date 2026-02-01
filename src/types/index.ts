export type Role = "ADMIN" | "MANAGER" | "STAFF" | "WATCHER";

export interface User {
  uid: string;
  username: string; // Changed from email for staff convenience
  email?: string;
  mobile?: string;
  name?: string;
  role: Role;
  profileStatus?: "COMPLETED" | "SKIPPED";
  createdAt: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  unit: string; // e.g., 'pieces', 'sets'
  createdAt?: string;
  updatedAt?: string;
}

export interface Event {
  id: string;
  name: string; // Booker Name
  mobile: string;
  email?: string; // Booker Email (Optional)
  occasionDate: string; // ISO Date string
  occasionDay?: string; // Added optional
  occasionTime: string;
  description: string; // Booking for / Description
  hall: string | string[]; // 1st Floor, etc.
  catererName: string;
  catererPhone: string;

  // Essentials
  thaalCount: number;
  totalThaalsDone?: number; // Actual thaals served (filled after event)
  sarkariThaalSet: number;
  bhaiSaabIzzan: boolean;
  benSaabIzzan: boolean;
  extraChilamchiLota: number;
  tablesAndChairs: number;
  mic: boolean;
  crockeryRequired: boolean;
  thaalForDevri: boolean;
  paat: boolean;
  masjidLight: boolean;
  crockeryStatus?: "PENDING" | "NOT_REQUIRED" | "COMPLETED";

  // Add-ons
  acStartTime?: string;
  partyTime?: string;
  decorations?: boolean;
  gasCount?: number;

  menu: string;

  eventType?: "PUBLIC" | "PRIVATE";
  hallCounts?: Record<string, number>;

  createdAt: string;
  updatedAt?: string;
  createdBy?: string; // User UID
  status?: "BOOKED" | "CANCELLED" | "COMPLETED";
}

export interface InventoryLog {
  id: string;
  eventId: string;
  itemId: string;
  itemName: string;
  action: "ISSUE" | "RETURN" | "LOSS";
  quantity: number;
  userId: string;
  userName: string;
  timestamp: Date;
}
