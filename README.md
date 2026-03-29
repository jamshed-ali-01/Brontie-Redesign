# Brontie - Send Small Surprises

Brontie is a Next.js-based platform that allows users to send small surprises like coffee, cake, tickets or passes. Delivered instantly, redeemed locally at partner merchant locations using a unique QR code.

## Features

- Browse categories and gift items from partner merchants
- Send digital gift vouchers instantly to friends and family
- Generate unique redemption links and QR codes
- Validate and redeem vouchers at merchant locations
- **Admin authentication system with secure login/logout**
- **User management with role-based access control**
- **Enhanced admin dashboard with user management**
- Admin dashboard with analytics and reporting
- **Fathom analytics integration for usage tracking**

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB database

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NEXT_PUBLIC_FATHOM_SITE_ID=your_fathom_site_id (optional)
```

### Installation

```bash
# Install dependencies
npm install

# Seed the database with sample data
npm run seed

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `/src/app` - Next.js App Router pages and API routes
- `/src/models` - MongoDB models (Category, Merchant, MerchantLocation, GiftItem, Voucher, RedemptionLog, **User**)
- `/src/lib` - Utility functions including database connection **and authentication**
- `/src/scripts` - Scripts for database seeding and maintenance
- `/src/middleware.ts` - **Route protection middleware for admin areas**

## Key Pages

- `/` - Home page
- `/categories` - Browse all gift categories
- `/categories/[id]` - View category and its gift items
- `/gift-items/[id]` - View gift item details and create voucher
- `/voucher/[id]` - View and redeem gift voucher
- `/validate/[id]` - Merchant staff validation page for vouchers
- **`/login` - Admin authentication page**
- `/admin` - Admin dashboard with analytics
- **`/admin/users` - User management interface**
- **`/admin/transactions` - Enhanced transaction management**

## API Routes

### Public Routes
- `/api/categories` - Get all categories or create new category
- `/api/categories/[id]` - Get, update or delete specific category
- `/api/merchants` - Get all merchants or create new merchant
- `/api/merchants/[id]` - Get, update or delete specific merchant
- `/api/merchant-locations` - Get all merchant locations or create new merchant location
- `/api/merchant-locations/[id]` - Get, update or delete specific merchant location
- `/api/gift-items` - Get all gift items or create new gift item
- `/api/gift-items/[id]` - Get, update or delete specific gift item
- `/api/voucher/create` - Create new gift voucher
- `/api/voucher/[id]` - Get voucher details
- `/api/voucher/[id]/redeem` - Redeem a voucher

### Authentication Routes
- **`/api/auth/login` - Admin login endpoint**
- **`/api/auth/logout` - Admin logout endpoint**

### Admin Routes (Protected)
- `/api/admin/summary` - Get admin dashboard summary data
- **`/api/admin/users` - Get all users or create new user**
- **`/api/admin/users/[id]` - Get, update, delete, or toggle user status**
- **`/api/admin/transactions` - Enhanced transaction management with filtering**

## Authentication & Security

The application now includes a comprehensive authentication system.

Test keys env
