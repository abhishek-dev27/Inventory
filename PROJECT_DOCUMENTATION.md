# ☀️ Sologix Energy - Inventory & Commercials ERP
## Complete Technical Architecture, Directory Structure & Operational Manual

---

## 1. Executive Summary & Purpose

**Sologix Energy Inventory & Commercials System** is an enterprise-grade ERP designed specifically for solar engineering, procurement, and construction (EPC) companies and industrial equipment distributors.

The system tracks high-value solar hardware (Inverters, Mono-PERC Panels, Batteries, Structures, Distribution Boxes, and Balance of System components) through their complete lifecycle:
- Vendor Procurement & Inward Restocking (**Stock In**)
- Barcode & Unit Serial Number Tracking
- Multi-Warehouse Stock Segregation (**Godowns**)
- Project Site & Customer Dispatch Manifests (**Stock Out**)
- Official GST Tax Invoices & Delivery Challans / Gate Passes
- Immutable Movement Ledger & Historical Audit Trail
- Automated Midnight Google Drive Cloud Disaster Recovery

---

## 2. Complete Project Directory Structure

```text
inventory/
│
├── .git/                            # Git Version Control metadata
├── .gitignore                       # Git exclusion rules (node_modules, .env, dist)
├── deploy.sh                        # Automated deployment script for cloud VM
├── setup-permanent.sh               # System-level server initialization script
├── README.md                        # Project landing & quickstart documentation
├── PROJECT_DOCUMENTATION.md         # Full technical architecture & operational manual
├── package.json                     # Root npm script orchestrator
│
├── client/                          # FRONTEND APPLICATION (React 18 + Vite)
│   ├── dist/                        # Compiled production frontend (served by backend)
│   ├── public/                      # Static assets, favicon, logos
│   ├── src/
│   │   ├── components/              # Modular, reusable UI components
│   │   │   ├── common/              # Button, Input, Modal, Loader, Badge, StickyTable
│   │   │   ├── layout/              # Sidebar navigation, Header, Navbar, Breadcrumbs
│   │   │   ├── dashboard/           # Metrics cards, Stock chart widgets, Branch summaries
│   │   │   ├── products/            # ProductCard, ProductModal, BarcodeScannerModal
│   │   │   └── stock/               # StockInForm, StockOutForm, TaxInvoiceModal, TransactionTable
│   │   ├── context/                 # React Context State Providers
│   │   │   ├── AuthContext.jsx      # Global user login state, JWT tokens, logout
│   │   │   └── GodownContext.jsx    # Dynamic warehouse list & active branch state
│   │   ├── hooks/                   # Custom React hooks (useAuth, useFetch)
│   │   ├── pages/                   # Application Route Views
│   │   │   ├── auth/Login.jsx       # Security login portal with role toggle
│   │   │   ├── dashboard/           # Executive KPI dashboard & inventory summaries
│   │   │   ├── products/            # Catalog management, filtering, SKU generation
│   │   │   ├── stock/               # StockIn, StockOut, and StockHistory ledger
│   │   │   ├── users/               # Staff operator & admin user governance
│   │   │   ├── godowns/             # Multi-branch warehouse management
│   │   │   └── logs/                # Audit trails & login security logs
│   │   ├── services/                # Axios REST API connectors with auto-refresh JWT
│   │   │   ├── api.js               # Central Axios instance with request/response interceptors
│   │   │   ├── authService.js       # Login, token refresh, and profile endpoints
│   │   │   ├── productService.js   # Catalog CRUD operations
│   │   │   └── stockService.js      # Stock in, out, edit, and ledger transactions
│   │   ├── utils/                   # Helper functions and business logic
│   │   │   ├── constants.js         # Product types, godown locations, units
│   │   │   ├── exportPdf.js         # jsPDF Delivery Challan, Tax Invoice & Ledger PDF exporter
│   │   │   ├── formatCurrency.js    # INR (₹) Indian numbering currency formatter
│   │   │   └── formatDate.js        # Datetime formatters and relative time calculator
│   │   ├── App.jsx                  # Main routing definition & Protected Route guards
│   │   ├── index.css                # Global CSS design system & custom tokens
│   │   └── main.jsx                 # React root DOM hydration
│   ├── package.json                 # Frontend dependencies (Recharts, jsPDF, html5-qrcode)
│   └── vite.config.js               # Vite build bundler, chunking, and dev proxy config
│
└── server/                          # BACKEND APPLICATION (Node.js + Express + MySQL)
    ├── config/
    │   └── db.js                    # MySQL Connection Pool & Sequelize ORM initialization
    ├── controllers/                 # REST API Request Controllers (Business Logic)
    │   ├── authController.js        # Admin/Staff login, JWT signing, password checks
    │   ├── productController.js     # Catalog filtering, search, low-stock threshold queries
    │   ├── stockController.js       # Inward/Outward movements, atomic stock adjustments
    │   ├── godownController.js      # Multi-branch warehouse CRUD operations
    │   ├── userController.js        # User management, role elevation, password resets
    │   └── activityLogController.js # Security event logging & IP audit queries
    ├── middleware/
    │   ├── authMiddleware.js        # JWT token verification and user extraction
    │   ├── roleMiddleware.js        # Admin-only route authorization guard
    │   └── errorMiddleware.js       # Global Express error catching & JSON formatting
    ├── models/                      # Sequelize Relational Database Models
    │   ├── User.js                  # User schema, roles, password hashes, history
    │   ├── Product.js               # Solar catalog schema (SKU, brand, ratings, qty)
    │   ├── StockTransaction.js      # Immutable inward/outward ledger records
    │   ├── Godown.js                # Branch warehouses schema (code, city, state)
    │   └── ActivityLog.js           # Audit trail logs schema (action, IP, status)
    ├── routes/                      # API Route Definitions
    │   ├── authRoutes.js            # POST /api/auth/login, POST /api/auth/refresh
    │   ├── productRoutes.js         # GET, POST, PUT, DELETE /api/products
    │   ├── stockRoutes.js           # POST /api/stock/in, POST /api/stock/out, GET /api/stock/transactions
    │   ├── godownRoutes.js          # GET, POST, DELETE /api/godowns
    │   ├── userRoutes.js            # User management endpoints
    │   └── activityLogRoutes.js     # Audit log streaming endpoints
    ├── scripts/
    │   ├── import-bom-data.js       # Automated 915-line Solar BOM catalog importer
    │   ├── seed-all-data.js         # Realistic dummy data generator for demos
    │   ├── reset-database.js        # Clean production data reset utility
    │   └── view-db.js               # CLI table inspector for live MySQL data
    ├── backup-service.sh            # Midnight MySQL automated backup + Google Drive sync
    ├── setup-gdrive-backup.sh       # Rclone installation & Cron setup orchestrator
    ├── ecosystem.config.js          # PM2 production cluster management configuration
    ├── cluster.js                   # Multi-worker CPU load balancer launcher
    ├── app.js                       # Express app configuration, security headers, CORS
    ├── server.js                    # Server entrypoint & static frontend SPA delivery
    ├── package.json                 # Backend dependencies (express, sequelize, mysql2, bcrypt)
    └── .env                         # Server environment variables & credentials
```

---

## 3. How the System Works (End-to-End Workflow)

```mermaid
flowchart TD
    subgraph S1 [1. Procurement & Receiving]
        Supplier[Solar Manufacturer / Supplier] -->|Vendor Invoice| StockIn[Stock In Form]
        StockIn -->|Attach Serial Numbers & Godown| AddInventory[Inventory Qty Increases (+)]
    end

    subgraph S2 [2. Warehousing & Storage]
        AddInventory --> CentralStock[(Multi-Branch Godown Pool)]
        CentralStock --> Ranchi[Ranchi Hub]
        CentralStock --> Jamshedpur[Jamshedpur Depot]
        CentralStock --> Others[Other Regional Branches]
    end

    subgraph S3 [3. Project Dispatch & Supply]
        CentralStock --> StockOut[Stock Out Manifest]
        StockOut --> PickSerials[Pick FIFO Serial Numbers]
        PickSerials --> Logistics[Verify Driver & Vehicle Details]
        Logistics --> SubtractInventory[Inventory Qty Decreases (-)]
    end

    subgraph S4 [4. Commercial Documentation]
        SubtractInventory --> DeliveryChallan[Official Delivery Challan & Gate Pass]
        DeliveryChallan --> PDFExport[Download PDF / Print Voucher]
    end

    subgraph S5 [5. Governance & Disaster Recovery]
        SubtractInventory --> Ledger[Stock History Audit Ledger]
        Ledger --> MidnightCron[12:00 AM Midnight Cron Job]
        MidnightCron --> GDriveSync[Google Drive 7-Day Rolling Backup]
    end
```

---

### Step-by-Step Breakdown of Daily Operations:

### Phase 1: Product Catalog Setup
1. **Catalog Definition**: Each solar asset (e.g. Inverter, Solar Panel, Battery, ACDB Box) is registered with:
   - Unique SKU (`OGI-66582`, `PAN-RAY-590WP`).
   - Manufacturer Brand (`Growatt`, `Rayzon`, `Waaree`, `Deye`).
   - Technical Ratings: Capacity (`5 kW`, `590 Wp`) and Phase (`1-Phase`, `3-Phase`, `DC`).
   - Storage Bin Location within the designated Godown.
   - Low Stock Threshold: Automatically alerts operators when physical stock drops below safe operational buffer.

---

### Phase 2: Inward Stock Inflow (Restocking)
1. When materials arrive from suppliers or factory consignments, staff opens **Stock In**.
2. Selects the equipment, target godown, received quantity, and supplier invoice reference.
3. Unit Barcodes / Serial Numbers are scanned via webcam/barcode reader or typed in comma-separated batches.
4. On submission:
   - MySQL atomically increments product stock: `quantity = quantity + inwardQty`.
   - Records an immutable Inward transaction entry.
   - An Inward Goods Receipt Voucher is rendered with serial number tags.

---

### Phase 3: Outward Stock Outflow (Dispatches & Gate Passes)
1. When equipment is scheduled for dispatch to a project site or customer:
   - Staff opens **Stock Out**.
   - Multiple items can be added to a single bill (e.g., 1 Inverter + 12 Solar Modules + 1 ACDB Box).
   - Staff selects the exact unit serial numbers being handed over.
2. **Logistics & Buyer Details**:
   - `Billed To` buyer name, contact, place of supply, and GSTIN.
   - `Consignee` delivery site address.
   - `Logistics verification`: Driver name, driver phone number, transporter name, and vehicle registration number.
3. **Execution**:
   - Database atomically decrements stock: `quantity = quantity - dispatchedQty`.
   - Prevents negative inventory (blocks dispatch if requested quantity exceeds available stock).
   - Generates an auto-incrementing FY bill number (`DC/2026-27/XXXX`).
4. **Official Delivery Challan & Gate Pass**:
   - Renders a formal Sologix Energy Delivery Challan with item descriptions, HSN codes, GST summary, transport details, and gate security authorization.
   - Provides a client-side generated PDF download and clean print layout.

---

### Phase 4: Stock History Ledger & Audit Trail
1. **Transaction Ledger**:
   - Every movement is indexed by reference number, timestamp, godown, party, and operator.
   - Visual badges distinguish **Stock In** (Green badge) vs. **Stock Out** (Red badge).
   - Multi-product dispatches display an expandable manifest drawer showing every equipment line item and associated serial numbers.
2. **Action Controls**:
   - Outward supply records provide instant access to the **Invoice / Delivery Challan**.
   - Inward movements show **Details** and **Edit** options (preventing accidental challan printing for receipts).
   - Admins can edit transaction remarks, logistics, and party details if corrections are needed.
   - Full ledger exportable to **Excel (CSV)** or **PDF Report**.

---

### Phase 5: Automated Cloud Disaster Recovery (Google Drive)
1. **Schedule**: Linux cron runs the backup engine automatically **every night at 12:00 AM (00:00)** (`0 0 * * *`).
2. **Database Dump**: `mysqldump --no-tablespaces` creates a compressed archive named by date: `inventory_backup_YYYY-MM-DD.sql.gz`.
3. **Google Drive Sync**: `rclone` securely uploads the archive to your Google Drive in the **`Inventory_Backups`** folder.
4. **7-Day Retention Window**:
   - On the 8th day, the oldest backup is automatically pruned both locally and on Google Drive.
   - Ensures you always have the last 7 full daily backups with zero manual storage bloat.

---

## 4. Production Deployment & Process Management

### Single-Port Architecture:
- Express backend serves the API on `/api/*` and simultaneously serves the compiled React production frontend from `client/dist/` on port `5000`.
- Nginx sits in front on port `80`, routing all incoming traffic to the Node.js application.

### PM2 Clustering:
- Utilizes all available CPU cores via PM2 cluster mode (`inventory-api-cluster`).
- Provides **zero-downtime hot reloads** (`pm2 reload all`) during git updates.
- Auto-restarts any worker process that experiences an unhandled failure.

---

## 5. Maintenance Commands Reference

| Operation | Command |
| :--- | :--- |
| **Check PM2 Workers** | `pm2 status` |
| **Stream Live Logs** | `pm2 logs` |
| **Hot-Reload Server** | `cd ~/Inventory/server && pm2 reload all` |
| **Run Manual Backup** | `bash ~/Inventory/server/backup-service.sh` |
| **View Backup Log** | `cat ~/backups/backup.log` |
| **Deploy GitHub Updates** | `cd ~/Inventory && git pull origin main && cd client && npm run build && cd ../server && pm2 reload all` |
