# WeframeTech Backend Hiring Task - Event Booking System

This is a multi-tenant event booking backend built with Payload CMS and a Neon Postgres database, as part of the WeframeTech recruitment process.

## Architecture Overview

- **Core Framework**: Payload CMS (vX.X)
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
- `src/seed.mts`: The script to populate the database with initial test data.

## ⚙️ Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
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
    npm run seed
    ```
5.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The admin panel will be available at `http://localhost:3000/admin`.
