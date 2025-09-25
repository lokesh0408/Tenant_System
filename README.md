# Event Booking System

This is a multi-tenant event booking backend built with Payload CMS and a Neon Postgres database.

## Architecture Overview

- **Core Framework**: Payload CMS
- **Database**: Neon Serverless Postgres
- **Key Features**:
  - **Multi-Tenancy**: Data is strictly isolated between tenants using a `tenant` relationship on every collection.
  - **Automated Booking Logic**: Payload `afterChange` hooks manage the entire booking lifecycle, from confirmation and waitlisting to cancellations and promotions.
  - **Role-Based Access Control (RBAC)**: Payload access control functions secure all collections and endpoints based on user roles (`admin`, `organizer`, `attendee`) and tenant membership.

### File Structure

- `src/collections/`: Contains definitions for all 6 collections.
- `src/hooks/`: Holds the core business logic for booking status changes.
- `src/endpoints/`: Defines the 6 custom REST API endpoints.
- `src/access/`: Contains reusable access control functions for RBAC and tenant isolation.
- `src/seed.ts`: The script to populate the database with initial test data.

## Tech Stack

- **Backend Framework**: [Payload CMS](https://payloadcms.com/)
- **Database**: [Neon Serverless Postgres](https://neon.tech/)
- **Language**: TypeScript
- **Authentication**: Payload local auth

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <repo-url>
    ```
2.  **Install dependencies:**
    ```bash
    npm install or pnpm install
    # or
    yarn install
    ```
3.  **Set up environment variables:**
    - Copy `.env.example` to a new file named `.env`.
    - Add your Neon database connection string and a strong `PAYLOAD_SECRET`.
    ```env
    PAYLOAD_SECRET=...
    DATABASE_URI=...
    ```
4.  **Run the database seed script:**
    ```bash
    npm run seed or pnpm run seed
    ```
5.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The admin panel will be available at `http://localhost:3000/admin`.

## Testing

1. **Login as Admin**:
   - Email: `admin@example.com`
   - Password: `password`
2. **Create an Event** from the Payload admin panel (`/admin`).
3. **Book Seats** using `/api/bookings/create` until the event reaches capacity.
4. **Check Waitlist Behavior**:
   - Continue booking beyond capacity to test waitlist logic.
5. **Cancel a Booking** and verify that the first waitlisted booking is promoted automatically.

## Notes

1. **Authentication & Authorization**:

- All endpoints require the user to be authenticated via ensureAuthenticated(req).
- Data access is tenant-scoped — users can only interact with events, bookings, and waitlists within their tenant.

2. **Booking Rules**:

- Booking capacity is enforced automatically; bookings beyond capacity go to waitlist.
- If a confirmed booking is cancelled, the earliest waitlisted booking is promoted.
- All data is scoped to the authenticated user's tenant.

3. **Event Management**:

- Event creation and editing are restricted to authorized users only.
- Capacity updates are reflected in real-time, and booking promotions are triggered automatically if capacity increases.

4. **Error Handling**:

- All API responses follow a consistent JSON structure with error and message fields in case of failures.
- Meaningful HTTP status codes are returned (200, 400, 401, 403, 404, 409, 500).

5. **Testing & Deployment**:

- API tested via Postman with authenticated requests.
- Deployed on Vercel, ensuring public accessibility for review.
