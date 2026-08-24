# 📦 Inventory Management System (InventoryPro)

A modern full-stack web application for warehouse stock tracking, product management, transactional audit logging, and analytics.

---

## 🚀 Tech Stack

### **Frontend**
- **React 18** (Vite)
- **React Router v6**
- **Recharts** (Area & Bar Charts)
- **Axios** (JWT interceptor with automatic token refresh)
- **React Hot Toast**
- **React Icons**
- **Custom Dark Glassmorphic Design System**

### **Backend**
- **Node.js & Express**
- **MySQL & Sequelize ORM**
- **JWT Authentication** (Short-lived access token + long-lived refresh token)
- **Bcrypt.js** (Password hashing)
- **Helmet, CORS, Morgan** (Security & Logging)

---

## 🛠️ Project Structure

```
inventory-management-system/
├── client/                         # Frontend - React + Vite
│   ├── public/
│   ├── src/
│   │   ├── components/             # Common, Layout, Dashboard, Products, Stock, Users, Reports
│   │   ├── context/                # AuthContext
│   │   ├── hooks/                  # useAuth, useFetch
│   │   ├── pages/                  # Login, Dashboard, Products, Stock, Users, Reports
│   │   ├── services/               # Axios API services
│   │   ├── utils/                  # Formatters and constants
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                         # Backend - Node.js + Express
│   ├── config/                     # Database connection (Sequelize)
│   ├── controllers/                # Auth, User, Product, Stock, Transaction, Report
│   ├── middleware/                 # Auth, Role-based, and Error middleware
│   ├── models/                     # User, Product, StockTransaction
│   ├── routes/                     # REST API endpoints
│   ├── utils/                      # Token generation, report utilities
│   ├── app.js
│   ├── server.js
│   ├── .env
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## ⚙️ Quick Start Setup

### 1. Database Configuration (MySQL)
Make sure MySQL is running on your machine and create the database:
```sql
CREATE DATABASE IF NOT EXISTS inventory_db;
```

Update `server/.env` if your MySQL username or password is not the default:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=inventory_db
PORT=5000
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
```

---

### 2. Start the Backend Server
```bash
cd server
npm install
npm run dev   # Or: npm start
```
> 💡 *On first startup, Sequelize automatically syncs database tables and seeds a default administrator account:*
> - **Email**: `admin@inventory.com`
> - **Password**: `admin123`

---

### 3. Start the Frontend Client
```bash
cd client
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🔑 Key Features

- 🔐 **Secure Role-Based Authentication**: Admin and Staff permissions with auto token refreshing.
- 📊 **Real-Time Operational Dashboard**: Key KPIs, low stock threshold warnings, 7/14/30 day inflow vs outflow charts, and recent activity logs.
- 📦 **Comprehensive Product Catalog**: SKU tracking, dynamic category management, real-time search, unit pricing, and minimum stock threshold alerts.
- 🔄 **Inward & Outward Stock Management**: Atomic stock additions and deductions with transaction reason categorization and reference notes.
- 📜 **Full Audit Trail**: Chronological transaction history ledger with date range and transaction type filtering.
- 👥 **User Management (Admin)**: Add, edit, role assignment, and user deletion.
- 📈 **Advanced Reports & Analytics**:
  - **Daily Statement**: Net stock change statement for any chosen calendar date.
  - **Monthly Summary**: Volume distribution bar charts and monthly inflow/outflow metrics.
  - **Usage / Velocity Report**: Ranking most consumed and most restocked SKUs over customizable time ranges.
