# Solrac Moto

## Overview

Solrac Moto is a full-stack web application for managing a motorcycle rental fleet. The system serves as an administrative panel for tracking motorcycles, customers, rental contracts, payments, and maintenance orders. It's designed to be responsive for both desktop and mobile use.

The application manages:
- Motorcycle fleet with status tracking (available, rented, maintenance, blocked)
- Customer/tenant records with scoring and documentation
- Rental contracts with different plans (daily, weekly, monthly)
- Payment tracking with installment support
- Maintenance orders (preventive and corrective)
- Dashboard with KPIs, alerts, and overdue rental tracking
- Maintenance cost reporting by motorcycle and month
- Financial control with weekly/monthly/annual views, fixed costs per vehicle, income/expense/net result reporting

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite

The frontend follows a page-based structure under `client/src/pages/` with shared components in `client/src/components/`. The app uses a sidebar navigation layout for authenticated users and a landing page for unauthenticated visitors.

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Style**: RESTful JSON API under `/api/*` prefix
- **Authentication**: Replit Auth integration using OpenID Connect with Passport.js
- **Session Management**: Express sessions stored in PostgreSQL via connect-pg-simple

The server follows a modular structure:
- `server/routes.ts` - API endpoint definitions
- `server/storage.ts` - Data access layer interface
- `server/db.ts` - Database connection setup
- `server/seed.ts` - Sample data seeding

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)
- **Validation**: Zod schemas generated from Drizzle schemas via drizzle-zod
- **Migrations**: Drizzle Kit with `db:push` command

Key database tables:
- `users` and `sessions` - Authentication (required for Replit Auth)
- `customers` - Rental customers with CPF, contact info, scoring
- `motorcycles` - Fleet vehicles with status, pricing, GPS location
- `rentals` - Active and historical rental contracts
- `rental_installments` - Payment schedule for rentals
- `payments` - Payment records
- `maintenance_orders` - Service and repair tracking
- `service_catalog` - Pre-configured maintenance services/parts with costs (name, category, partsCost, laborCost, active flag)
- `fixed_costs` - Recurring fixed costs per vehicle (insurance, IPVA, etc.)
- `extra_revenues` - Extra income separate from rental payments
- `extra_expenses` - Extra expenses with optional motorcycle link (category, date, amount)
- `contract_templates` - Uploaded contract document templates (base64 file storage, active flag)
- `customer_debits` - Customer charges for damages/broken parts (pending/paid status, optional maintenance order link)
- `allowed_emails` - Email whitelist for access control

### Access Control
- **Email Whitelist**: Only emails in the `allowed_emails` table can log in
- **Auto-seeding**: First user to log in when the list is empty is automatically added (with race condition protection)
- **Settings Page**: Authenticated users can manage the allowed email list via /settings
- **Access Denied**: Unauthorized users are redirected to landing page with denial message

### Role-Based Access Control
The system supports three user roles defined in the schema:
- **admin**: Full system access
- **operator**: Customer and rental management
- **mechanic**: Maintenance operations

### Build System
- Development: `tsx` for TypeScript execution with Vite dev server
- Production: Custom build script using esbuild (server) and Vite (client)
- Output: `dist/` directory with `index.cjs` server bundle and `public/` static assets

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- Session storage uses the `sessions` table directly

### Authentication
- **Replit Auth**: OpenID Connect integration via `ISSUER_URL` (defaults to Replit OIDC)
- Requires `REPL_ID` and `SESSION_SECRET` environment variables

### Third-Party Libraries
- **Radix UI**: Accessible component primitives for dialogs, dropdowns, forms
- **date-fns**: Date formatting and manipulation (Portuguese locale support)
- **Lucide React**: Icon library
- **TanStack Query**: Server state management and caching

### Development Tools
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner (dev only)
- **Drizzle Kit**: Database schema management and migrations