# 🏛️ Jamaat Inventory Management System

A comprehensive, enterprise-grade inventory and event management system built for Jamaat organizations. This system streamlines event planning, inventory tracking, user management, and provides detailed audit logs with role-based access control.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Admin-orange?logo=firebase)
![License](https://img.shields.io/badge/License-Private-red)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
- [Environment Setup](#-environment-setup)
- [Authentication & Security](#-authentication--security)
- [User Roles & Permissions](#-user-roles--permissions)
- [Core Modules](#-core-modules)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)

---

## ✨ Features

### 🎨 Interactive Floor Plan Designer
- **Drag & Drop Interface** for visual event plotting
- **Customizable Hall Dimensions**
- **Library of Items** (Tables, Chairs, Mics, Lights) with specific dimensions
- **Real-time Collision Detection** to prevent overlaps
- **Public Shareable Links** for read-only client viewing
- **Save & Load** multiple layouts per event
- **PDF Export** of layouts for setup teams

### 🔐 Authentication & User Management
- **Secure Login System** with credential-based authentication (NextAuth v5)
- **Forgot Password Flow** with OTP verification via email
- **OTP-Protected Password Changes** for enhanced security
- **Profile Management** with mandatory profile completion
- **Role-Based Access Control (RBAC)** with 4 user roles
- **Activity Logging** for all login/logout events

### 📦 Inventory Management
- **Real-time Inventory Tracking** across all events
- **Bulk Import/Export** via Excel (XLSX)
- **Item Categorization** with units and descriptions
- **Automatic Balance Updates** based on event allocations
- **Inventory Loss Tracking** with detailed logs
- **Search & Filter** capabilities

### 🎉 Event Management
- **Event Creation & Planning** with multi-step forms
- **Hall & Caterer Management** via master data
- **Thaal Count Tracking**
- **Event-Specific Inventory Allocation**
- **Public Event Pages** for external viewing
- **Print-Optimized Details** for physical handouts
- **Email Notifications** for new events

### 📊 Reporting & Analytics
- **Comprehensive Ledger View** of all inventory movements
- **System Audit Logs** with real-time updates
- **Export Capabilities** (Excel & JSON)
  - Events data
  - Inventory snapshots
  - User lists
  - System logs
  - Ledger transactions
- **Data Restore** from backup files

### 🎨 Modern UI/UX
- **Glass-morphism Design** with premium aesthetics
- **Responsive Layout** optimized for all devices
- **Dark Mode Support** via theme system
- **Real-time Updates** with auto-refresh
- **Loading States** with NProgress bar
- **Toast Notifications** for user feedback

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality component library
- **Radix UI** - Headless UI primitives
- **dnd-kit** - Drag and drop primitives for Floor Plan
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **date-fns** - Date manipulation

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **NextAuth v5** - Authentication framework
- **Firebase Admin SDK** - Server-side Firebase operations
  - **Firestore** - User & inventory data
  - **Realtime Database** - Logs & audit trail
  - **Firebase Storage** (configured, if needed)

### Email & Communications
- **Nodemailer** - Email delivery
- **Gmail SMTP** - Email transport

### Data Processing
- **XLSX (SheetJS)** - Excel file handling
- **jspre** & **jspdf-autotable** - PDF generation

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│  Next.js App Router │ React Components │ TailwindCSS        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js API Routes                         │
│  /api/auth/*  │  /api/events/*  │  /api/inventory/*        │
│  /api/admin/* │  /api/user/*    │  /api/logs/*             │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌──────────────────┐         ┌──────────────────┐
│   Firestore DB   │         │  Realtime DB     │
│  - users         │         │  - logs          │
│  - events        │         │  - event_logs    │
│  - inventory     │         │  - otps          │
│  - master_data   │         └──────────────────┘
│  - floor_plans   │
│  - floor_item_types
└──────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.x or later
- **npm/yarn/pnpm** package manager
- **Firebase Project** with Firestore and Realtime Database enabled
- **Gmail Account** for SMTP (or alternative email service)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jamaat-inventory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (see [Environment Setup](#-environment-setup))

4. **Initialize Firebase**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Firestore and Realtime Database
   - Download service account key and save as `jamaat-inventory-firebase-adminsdk.json`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - First-time setup wizard will guide you through creating the admin account

---

## 🔧 Environment Setup

Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
AUTH_SECRET=<same-as-nextauth-secret>

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Email Configuration (Gmail SMTP)
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Generating Secrets
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

### Gmail SMTP Setup
1. Enable 2-Factor Authentication on your Google Account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use the 16-character password as `SMTP_PASSWORD`

---

## 🔐 Authentication & Security

### Authentication Flow
1. **Initial Setup** (`/setup`)
   - First-time users create admin account
   - System verifies no existing users

2. **Login** (`/login`)
   - Credential-based authentication
   - Session creation via NextAuth
   - Login action logged to audit trail

3. **Profile Completion** (`/complete-profile`)
   - Mandatory for users without email/mobile
   - Skippable with explicit action
   - Prevents access until completed/skipped

4. **Forgot Password** (`/forgot-password`)
   - Username-based OTP delivery
   - 10-minute OTP validity
   - Email verification required
   - Fallback contact for users without email

### Password Security
- **OTP Verification** required for password changes
- **6-digit OTP** sent to registered email
- **10-minute expiration** for security
- **Attempt tracking** to prevent brute force

### Session Management
- **JWT-based sessions** with secure cookies
- **Automatic session refresh** on profile updates
- **Self-healing sessions** fetch missing data from database
- **Logout logging** for audit compliance

---

## 👥 User Roles & Permissions

| Role               | Permissions                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| **ADMIN**          | Full system access, user management, data export/restore, system reset     |
| **MANAGER**        | Event & inventory management, bulk operations, cannot manage users         |
| **VIEWER**         | Read-only access to events and inventory                                   |
| **ATTENDANCE_INCHARGE** | Limited access (role defined for future attendance features)          |

### Role-Based Feature Access

| Feature                  | ADMIN | MANAGER | VIEWER | ATTENDANCE_INCHARGE |
|--------------------------|-------|---------|--------|---------------------|
| Create Events            | ✅    | ✅      | ❌     | ❌                  |
| Edit Events              | ✅    | ✅      | ❌     | ❌                  |
| Add Inventory Items      | ✅    | ✅      | ❌     | ❌                  |
| Bulk Import              | ✅    | ✅      | ❌     | ❌                  |
| Create Users             | ✅    | ❌      | ❌     | ❌                  |
| Delete Users             | ✅    | ❌      | ❌     | ❌                  |
| Edit Other Users         | ✅    | ❌      | ❌     | ❌                  |
| Export Data              | ✅    | ❌      | ❌     | ❌                  |
| Restore Data             | ✅    | ❌      | ❌     | ❌                  |
| System Reset             | ✅    | ❌      | ❌     | ❌                  |
| View Logs                | ✅    | ✅      | ✅     | ✅                  |

---

## 📦 Core Modules

### 1. **Events Module**
#### Features
- Create and manage events with detailed information
- Allocate inventory to events
- Track event status and completion
- Generate public event pages
- Print-optimized event details

#### Event Workflow
1. Create event via `/events/new`
2. Fill event details (name, date, hall, caterer, thaal count)
3. Allocate inventory items
4. System automatically deducts from main inventory
5. Return unused items or mark as lost
6. View ledger for complete transaction history

#### Files
- `src/app/(dashboard)/events/` - Event pages
- `src/app/api/events/` - Event API routes

### 2. **Inventory Module**
#### Features
- Add/edit/delete inventory items
- Bulk import via Excel
- Real-time balance tracking
- Category management
- Search and filter

#### Inventory Actions
- **ISSUE**: Allocate to event (reduces balance)
- **RETURN**: Return from event (increases balance)
- **LOSS**: Mark as lost (logged separately)

#### Files
- `src/app/(dashboard)/inventory/` - Inventory pages
- `src/app/api/inventory/` - Inventory API routes

### 3. **Floor Plan Module**
#### Features
- Interactive drag-and-drop designer
- Save multiple layouts per event
- Public shareable links (read-only)
- PDF Export

#### Files
- `src/app/(dashboard)/events/floor-plan/` - Designer UI
- `src/app/public/floor-plan/` - Public viewer
- `src/app/api/floor-plans/` - Server Actions & API

### 4. **User Management**
#### Features
- Create users with roles
- Edit user details (ADMIN only)
- Delete users (ADMIN only)
- Profile management
- Password reset via OTP

#### Files
- `src/app/(dashboard)/settings/users/` - User management UI
- `src/app/api/users/` - User API routes
- `src/app/(dashboard)/profile/` - User profile page

### 5. **Logging & Audit Trail**
#### Logged Actions
- `USER_LOGIN` - Successful login
- `USER_LOGOUT` - User logout
- `USER_CREATED` - New user creation
- `EVENT_CREATED` - New event creation
- `EVENT_UPDATED` - Event modification
- `INVENTORY_ADDED` - New inventory item
- `INVENTORY_REMOVED` - Inventory deletion
- `INVENTORY_RETURNED` - Return from event
- `INVENTORY_LOSS` - Loss reporting
- `SYSTEM_ACTION` - Admin actions

#### Files
- `src/lib/logger.ts` - Logging utility
- `src/app/api/logs/` - Logs API
- `src/app/(dashboard)/logs/` - Logs viewer

### 6. **Data Export & Restore**
#### Export Formats
- **Excel (.xlsx)** - Events, Inventory, Users, Logs, Ledger
- **JSON (.json)** - Raw data exports

#### Export Types
- **Events**: All event data with relationships
- **Inventory**: Current inventory snapshot
- **Users**: User list with roles
- **Logs**: System audit logs
- **Ledger**: Complete transaction history
- **Master Data**: All master data in one export

#### Restore Capabilities
- Upload JSON backup files
- Merge or replace existing data
- Validation before restore

#### Files
- `src/app/api/admin/export/` - Export API
- `src/app/api/admin/restore/` - Restore API
- `src/app/(dashboard)/settings/config/` - Export/Restore UI

---

## 🔌 API Documentation

### Authentication Endpoints

#### `POST /api/auth/otp/send`
Send OTP to user's email for password change (profile page).
- **Auth**: Required (session)
- **Body**: None (uses session user)
- **Response**: `{ success: true }`
- **Email**: Sends 6-digit OTP valid for 10 minutes

#### `POST /api/user/update-password`
Verify OTP and update password.
- **Auth**: Required (session)
- **Body**: `{ otp: string, newPassword: string }`
- **Response**: `{ success: true }`
- **Validation**: OTP expiry and attempts

#### `POST /api/auth/forgot-password/init`
Initiate forgot password flow (login page).
- **Auth**: None (public)
- **Body**: `{ username: string }`
- **Response**: `{ success: true, email: string }` (masked)
- **Error**: `{ error: "NO_EMAIL" }` if no email linked
- **Email**: Sends 6-digit OTP

#### `POST /api/auth/forgot-password/complete`
Complete forgot password with OTP and new password.
- **Auth**: None (public)
- **Body**: `{ username: string, otp: string, newPassword: string }`
- **Response**: `{ success: true }`

#### `POST /api/auth/logout`
Logout user with audit logging.
- **Auth**: Required (session)
- **Body**: None
- **Response**: `{ success: true }`
- **Action**: Logs `USER_LOGOUT` before signing out

### User Endpoints

#### `POST /api/user/update`
Update current user or other users (ADMIN).
- **Auth**: Required
- **Body**: `{ name?, email?, mobile?, password?, userId? }`
- **Response**: `{ success: true }`
- **RBAC**: userId requires ADMIN role

#### `POST /api/user/complete-profile`
Complete or skip profile.
- **Auth**: Required
- **Body**: `{ email?, mobile?, skip?: boolean }`
- **Response**: `{ success: true }`
- **Action**: Sets `profileStatus` to "COMPLETED" or "SKIPPED"

### Event Endpoints

#### `GET /api/events`
Get all events.
- **Auth**: Required
- **Response**: `Event[]`

#### `POST /api/events`
Create new event.
- **Auth**: ADMIN or MANAGER
- **Body**: Event details
- **Email**: Sends notification to admin
- **Logging**: `EVENT_CREATED`

#### `GET /api/events/[id]`
Get event by ID.
- **Auth**: Required
- **Response**: Single event

#### `POST /api/events/[id]/inventory`
Manage event inventory (issue/return/loss).
- **Auth**: ADMIN or MANAGER
- **Body**: `{ action: "ISSUE"|"RETURN"|"LOSS", items: {...} }`
- **Logging**: `INVENTORY_*` actions

### Admin Endpoints

#### `POST /api/admin/export`
Export system data.
- **Auth**: ADMIN only
- **Query**: `?type=events|inventory|users|logs|ledger|master`
- **Query**: `&format=excel|json`
- **Response**: File download

#### `POST /api/admin/restore`
Restore data from backup.
- **Auth**: ADMIN only
- **Body**: JSON file upload
- **Validation**: Schema validation before restore

#### `POST /api/admin/reset`
Reset entire system (danger zone).
- **Auth**: ADMIN only
- **Action**: Deletes all data except current admin
- **Confirmation**: Required in UI

### Logs Endpoints

#### `GET /api/logs`
Get system logs (last 100).
- **Auth**: Required
- **Response**: `Log[]` (newest first)
- **Source**: Firebase Realtime Database

---

## 🗄️ Database Schema

### Firestore Collections

#### `users`
```typescript
{
  id: string (auto-generated)
  username: string (unique)
  password: string (plain - should be hashed in production)
  email?: string
  mobile?: string
  name?: string
  role: "ADMIN" | "MANAGER" | "VIEWER" | "ATTENDANCE_INCHARGE"
  profileStatus?: "COMPLETED" | "SKIPPED"
  createdAt: Timestamp
}
```

#### `events`
```typescript
{
  id: string
  name: string
  bookerName: string
  bookerMobile: string
  occasionDate: string
  occasionTime: string
  hall: string | string[]
  caterer: string
  thaalCount: number
  status: "PENDING" | "COMPLETED"
  createdBy: string (userId)
  createdAt: Timestamp
  allocatedInventory?: {
    [itemId: string]: {
      name: string
      quantity: number
      returned?: number
      lost?: number
    }
  }
}
```

#### `inventory`
```typescript
{
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  description?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### `master_data`
```typescript
{
  id: "master" (single document)
  halls: string[]
  caterers: string[]
  categories: string[]
  updatedAt: Timestamp
}
```

#### `otps` (temporary)
```typescript
{
  id: string (userId)
  otp: string (6 digits)
  expiresAt: number (timestamp)
  attempts: number
  createdAt: Date
}
```

### Realtime Database

#### `/logs`
```json
{
  "logId": {
    "action": "USER_LOGIN",
    "details": { "loginMethod": "credentials" },
    "userId": "string",
    "userName": "string",
    "timestamp": 1234567890,
    "createdAt": "ISO string"
  }
}
```

#### `/event_logs/{eventId}`
Event-specific logs (fan-out from `/logs`)

---

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Configure environment variables (all from `.env.local`)

3. **Configure Build**
   - Framework: Next.js
   - Build Command: `next build`
   - Output Directory: `.next`

4. **Environment Variables**
   - Add all variables from `.env.local`
   - Update `NEXTAUTH_URL` to production URL
   - Update `NEXT_PUBLIC_APP_URL` to production URL

5. **Deploy**
   - Vercel will auto-deploy on push to main

### Firebase Security Rules

#### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow server-side access only
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

#### Realtime Database Rules
```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "logs": {
      ".indexOn": "timestamp"
    }
  }
}
```

---

## 📝 Development Notes

### Code Structure
- `src/app/` - Next.js App Router pages
  - `(dashboard)/` - Protected routes
  - `api/` - API routes
- `src/components/` - React components
  - `ui/` - shadcn/ui components
  - `layout/` - Layout components
- `src/lib/` - Utilities and configurations
- `src/types/` - TypeScript type definitions

### Key Files
- `src/lib/auth.ts` - NextAuth configuration
- `src/lib/firebase.ts` - Firebase initialization
- `src/lib/logger.ts` - Logging utility
- `src/lib/email.ts` - Email templates and sender
- `src/middleware.ts` - NextAuth middleware

### Design System
- **Primary Color**: Amber (#d4af37)
- **Glass Effect**: `glass-card` class
- **Typography**: Geist Sans & Geist Mono
- **Icons**: Lucide React

---

## 🤝 Contributing

This is a private project for Jamaat organizations. For feature requests or bug reports, please contact the system administrator.

---

## 📄 License

Private - All rights reserved

---

## 🔍 Troubleshooting

### Common Issues

**Issue: Redirect loop on profile page**
- **Cause**: Stale session without `profileStatus`
- **Fix**: System now auto-heals sessions by fetching from database

**Issue: Logout button not working**
- **Cause**: Missing onClick handler
- **Fix**: Now properly calls logout API with logging

**Issue: System logs empty**
- **Cause**: Path mismatch between logger and API
- **Fix**: Both now use `/logs` path in Realtime Database

**Issue: Forgot password page redirects to login**
- **Cause**: Middleware blocking unauthenticated access
- **Fix**: `/forgot-password` now explicitly allowed in auth config

**Issue: Email delivery fails**
- **Cause**: Incorrect SMTP credentials or 2FA not enabled
- **Fix**: Use Gmail App Password, not account password

---

## 📧 Contact & Support

For system administration or technical support, please contact:
- **Administrator**: Aziz Bhai Fakkad
- **Email**: SMTP_EMAIL configured in environment

---

**Built with ❤️ by AL AQMAR**

*Last Updated: December 2025*
