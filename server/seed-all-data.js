/**
 * 🌟 Comprehensive End-to-End Dummy Data Seeder
 * 
 * Populates all fields across:
 * 1. Users (Admin + Staff Technicians)
 * 2. Products / Solar Catalog (Panels, Inverters, Batteries, Structures, Cables, Meters)
 * 3. Stock Transactions (Inward Supplies + Outward Dispatches with Serial Numbers)
 * 4. Customers & BD Pipeline Tracker (Full site details, capacities, BDE visits, bookings)
 * 5. Accounts & Commercial Ledger (Milestone Payments P1-P5, On-Time, Overdue, NPM, Recurring EMIs)
 * 6. Activity Logs (Real audit trail)
 */

require('dotenv').config();
const { sequelize, connectDB } = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const StockTransaction = require('./models/StockTransaction');
const Customer = require('./models/Customer');
const Account = require('./models/Account');
const ActivityLog = require('./models/ActivityLog');

const seedData = async () => {
  try {
    console.log('\n============================================================');
    console.log('🌱 POPULATING REALISTIC DUMMY DATA FOR SOLOGIX ENERGY');
    console.log('============================================================\n');

    await connectDB();
    await sequelize.sync({ alter: true });

    // 1. SEED USERS
    console.log('👤 Seeding Users & Operators...');
    let admin = await User.findOne({ where: { email: 'admin@inventory.com' } });
    if (!admin) {
      admin = await User.create({
        name: 'Admin Director',
        email: 'admin@inventory.com',
        password: 'Admin@12345#',
        role: 'admin',
      });
    }

    let staff1 = await User.findOne({ where: { email: 'rajesh.sharma@sologix.com' } });
    if (!staff1) {
      staff1 = await User.create({
        name: 'Rajesh Sharma',
        email: 'rajesh.sharma@sologix.com',
        password: 'Staff@12345#',
        role: 'staff',
      });
    }

    let staff2 = await User.findOne({ where: { email: 'priya.singh@sologix.com' } });
    if (!staff2) {
      staff2 = await User.create({
        name: 'Priya Singh',
        email: 'priya.singh@sologix.com',
        password: 'Staff@12345#',
        role: 'staff',
      });
    }
    console.log('✅ Users ready.\n');

    // 2. SEED SOLAR PRODUCTS CATALOG
    console.log('📦 Seeding Solar Inventory Catalog Products...');
    const productsData = [
      {
        name: 'Waaree 540W Mono PERC Bifacial Solar Module',
        sku: 'PAN-WAA-540W',
        category: 'Solar Panels',
        productType: 'Solar Panels',
        brand: 'Waaree Energies',
        unit: 'pcs',
        quantity: 180,
        price: 11500,
        costPrice: 9200,
        lowStockThreshold: 30,
        location: 'Warehouse Bay A-01',
        capacity: '540W',
        phase: 'DC',
        dcrType: 'DCR Compliant',
        subType: 'Bifacial Glass-to-Glass',
        serialNumbers: ['WAR-540-1001', 'WAR-540-1002', 'WAR-540-1003', 'WAR-540-1004'],
        senderName: 'Waaree Central Depot',
        senderCompany: 'Waaree Energies Ltd',
        senderPhone: '+91 98200 11223',
        senderAddress: 'MIDC Industrial Estate, Surat, Gujarat',
        senderReason: 'Factory Bulk Supply Q2',
        description: 'High efficiency Tier-1 540W mono crystalline solar panel with 25-year performance warranty',
        userId: admin.id,
      },
      {
        name: 'Growatt 10kW On-Grid 3-Phase Solar Inverter',
        sku: 'INV-GRO-10KW-3P',
        category: 'Inverters',
        productType: 'Inverters',
        brand: 'Growatt',
        unit: 'pcs',
        quantity: 14,
        price: 68000,
        costPrice: 54000,
        lowStockThreshold: 5,
        location: 'Bay B-04',
        capacity: '10kW',
        phase: '3-Phase',
        dcrType: 'Non-DCR',
        subType: 'Dual MPPT Grid-Tied',
        serialNumbers: ['GRO-10K-8801', 'GRO-10K-8802', 'GRO-10K-8803'],
        senderName: 'Shenzhen Growatt Import Hub',
        senderCompany: 'Growatt New Energy',
        senderPhone: '+91 99887 76655',
        senderAddress: 'Logistics Park, Nhava Sheva, Mumbai',
        senderReason: 'Direct Inverter Import Batch',
        description: 'Smart Wi-Fi monitoring enabled 10kW commercial inverter with 98.6% peak efficiency',
        userId: admin.id,
      },
      {
        name: 'Tata Power 5kW Hybrid Inverter 48V',
        sku: 'INV-TAT-5KW-HYB',
        category: 'Inverters',
        productType: 'Inverters',
        brand: 'Tata Power Solar',
        unit: 'pcs',
        quantity: 4, // Low stock demo!
        price: 82000,
        costPrice: 67000,
        lowStockThreshold: 8,
        location: 'Bay B-06',
        capacity: '5kW',
        phase: 'Single Phase',
        dcrType: 'DCR Compliant',
        subType: 'Hybrid with Battery Charging',
        serialNumbers: ['TAT-5K-001', 'TAT-5K-002'],
        senderName: 'Tata Solar Distribution',
        senderCompany: 'Tata Power Solar Systems',
        senderPhone: '+91 91234 56789',
        senderAddress: 'Electronic City, Bengaluru',
        senderReason: 'Emergency Project Stock In',
        description: 'Premium hybrid inverter supporting lithium battery storage and grid feed',
        userId: admin.id,
      },
      {
        name: 'Polycab 4 Sqmm DC Solar Cable (Red/Black)',
        sku: 'CAB-POL-4SQMM',
        category: 'Cables & Wiring',
        productType: 'Cables & Wiring',
        brand: 'Polycab',
        unit: 'meters',
        quantity: 2400,
        price: 48,
        costPrice: 36,
        lowStockThreshold: 500,
        location: 'Drum Rack D-01',
        capacity: '4 sqmm',
        phase: 'DC 1500V',
        dcrType: 'Standard',
        subType: 'Cross-Linked Polyolefin UV Resistant',
        serialNumbers: ['DRUM-POL-4MM-A', 'DRUM-POL-4MM-B'],
        senderName: 'Polycab Regional Depot',
        senderCompany: 'Polycab India Ltd',
        senderPhone: '+91 98450 44332',
        senderAddress: 'Industrial Corridor, Vadodara, Gujarat',
        senderReason: 'Monthly Wiring Restock',
        description: 'TUV certified electron-beam cross-linked solar cable for harsh outdoor environments',
        userId: admin.id,
      },
      {
        name: 'Exide 48V 100Ah Lithium LiFePO4 Energy Storage Pack',
        sku: 'BAT-EXI-48V100AH',
        category: 'Batteries',
        productType: 'Batteries',
        brand: 'Exide Technologies',
        unit: 'pcs',
        quantity: 18,
        price: 135000,
        costPrice: 112000,
        lowStockThreshold: 4,
        location: 'Battery Safety Room C-02',
        capacity: '4.8 kWh',
        phase: 'DC 48V',
        dcrType: 'Standard',
        subType: 'LiFePO4 Wall Mount',
        serialNumbers: ['EXI-LFP-901', 'EXI-LFP-902', 'EXI-LFP-903'],
        senderName: 'Exide Energy Solutions',
        senderCompany: 'Exide Industries Ltd',
        senderPhone: '+91 97788 11223',
        senderAddress: 'Hosur Plant, Tamil Nadu',
        senderReason: 'Lithium Battery Batch',
        description: '6000+ lifecycle smart BMS lithium storage pack with active thermal monitoring',
        userId: admin.id,
      },
      {
        name: 'Hot-Dip Galvanized (HDG) Solar Structure 4-Panel Table',
        sku: 'STR-HDG-4PANEL',
        category: 'Structures',
        productType: 'Structures',
        brand: 'Sologix Heavy Fabrications',
        unit: 'sets',
        quantity: 45,
        price: 4800,
        costPrice: 3400,
        lowStockThreshold: 10,
        location: 'Open Yard Y-02',
        capacity: '4 Modules',
        phase: 'Mechanical',
        dcrType: 'Standard',
        subType: 'Rooftop South Facing 15° Tilt',
        serialNumbers: ['HDG-SET-01', 'HDG-SET-02'],
        senderName: 'Sologix Fabrication Works',
        senderCompany: 'Sologix Energy Pvt Ltd',
        senderPhone: '+91 99000 88776',
        senderAddress: 'Peenya Industrial Area, Bengaluru',
        senderReason: 'In-House Fabrication Inflow',
        description: '80-micron hot dip galvanized structural steel tables rated for 150 km/h wind speeds',
        userId: admin.id,
      },
      {
        name: 'Schneider Electric 3-Phase 10kW ACDB with Class II SPD & 32A MCB',
        sku: 'ACD-SCH-10KW-3P',
        category: 'ACDB & Distribution Boxes',
        productType: 'ACDB',
        brand: 'Schneider Electric',
        unit: 'pcs',
        quantity: 25,
        price: 5400,
        costPrice: 4100,
        lowStockThreshold: 5,
        location: 'Electrical Bay A-2',
        capacity: '3-Phase 5kW - 10kW (32A)',
        phase: '3-Phase (Three Phase AC)',
        dcrType: 'Standard',
        subType: 'IP65 Weatherproof Polycarbonate',
        serialNumbers: ['ACD-SCH-01', 'ACD-SCH-02', 'ACD-SCH-03'],
        senderName: 'Schneider Electric Regional Supply',
        senderCompany: 'Schneider Electric India Pvt Ltd',
        senderPhone: '+91 98111 22334',
        senderAddress: 'Phase IV, Udyog Vihar, Gurugram',
        senderReason: 'Annual Distribution Batch',
        description: 'Heavy duty IP65 AC distribution box with integrated 4-Pole 32A MCB and 40kA Surge Protection Device',
        userId: admin.id,
      },
      {
        name: 'Hensel 2 In 2 Out 1000V DCDB with 1000V DC SPD & Fuses',
        sku: 'DCD-HEN-2IN2OUT',
        category: 'DCDB & Array Junction Boxes',
        productType: 'DCDB',
        brand: 'Hensel',
        unit: 'pcs',
        quantity: 30,
        price: 4800,
        costPrice: 3600,
        lowStockThreshold: 6,
        location: 'DCDB Yard Shelf D-1',
        capacity: '2 In 2 Out (2 String)',
        phase: '1000V DC (1 kV)',
        dcrType: 'Standard',
        subType: 'IP65 UV Resistant Polycarbonate',
        serialNumbers: ['DCD-HEN-101', 'DCD-HEN-102', 'DCD-HEN-103'],
        senderName: 'Hensel India Depot',
        senderCompany: 'Hensel Electric India Pvt Ltd',
        senderPhone: '+91 97222 33445',
        senderAddress: 'Oragadam Industrial Park, Chennai',
        senderReason: 'Solar Array Junction Inward',
        description: 'Premium German design UV stabilized DC distribution box with 1000V DC surge protection and gPV fuses',
        userId: admin.id,
      },
      {
        name: 'Ashlok 14.2mm x 3m Copper Bonded Chemical Earthing Electrode',
        sku: 'ETH-ASH-14MM3M',
        category: 'Earthing & Lightning Protection',
        productType: 'Earthing Material',
        brand: 'Ashlok',
        unit: 'pcs',
        quantity: 50,
        price: 2600,
        costPrice: 1950,
        lowStockThreshold: 10,
        location: 'Ground Yard Bay G-1',
        capacity: '14.2mm x 3 Meter (Copper Bonded)',
        phase: 'Mechanical',
        dcrType: 'Standard',
        subType: 'Copper Bonded Chemical Earthing Rod / Electrode',
        serialNumbers: ['ETH-ASH-01', 'ETH-ASH-02'],
        senderName: 'Ashlok Safe Earth Systems',
        senderCompany: 'Ashlok Safe Earth Pvt Ltd',
        senderPhone: '+91 98333 44556',
        senderAddress: 'Ambattur Industrial Estate, Chennai',
        senderReason: 'Grounding Protection Restock',
        description: '250+ micron pure electrolytic copper bonded high carbon steel rod with UL 467 & IEEE 80 compliance',
        userId: admin.id,
      },
    ];

    const createdProducts = [];
    for (const p of productsData) {
      let prod = await Product.findOne({ where: { sku: p.sku } });
      if (!prod) {
        prod = await Product.create(p);
      } else {
        await prod.update(p);
      }
      createdProducts.push(prod);
    }
    console.log(`✅ ${createdProducts.length} Solar Products ready.\n`);

    // 3. SEED STOCK TRANSACTIONS
    console.log('🔄 Seeding Inward Stock & Outward Dispatches...');
    const transactionsData = [
      {
        productId: createdProducts[0].id,
        userId: admin.id,
        type: 'in',
        quantity: 100,
        reason: 'Supplier Delivery - PO #WAR-8821',
        referenceNo: 'REC/2026/0401',
        personName: 'Ramesh Verma',
        place: 'Surat Depot ➔ Central Warehouse',
        transactionDate: new Date('2026-07-15'),
        senderCompany: 'Waaree Energies Ltd',
        senderPhone: '+91 98200 11223',
        notes: 'Inspected with 0 micro-crack defects. Passed electroluminescence test.',
      },
      {
        productId: createdProducts[1].id,
        userId: staff1.id,
        type: 'out',
        quantity: 2,
        reason: 'Dispatched for Site Installation (Adani Port Logistics)',
        referenceNo: 'DSP/2026/0402',
        personName: 'Suresh Patil (Site Engg)',
        place: 'Navi Mumbai Port Solar Site',
        transactionDate: new Date('2026-08-01'),
        senderCompany: 'Sologix Logistics Fleet',
        senderPhone: '+91 98222 33445',
        notes: 'Dispatched with mounting hardware and Wi-Fi data logger.',
      },
    ];

    for (const t of transactionsData) {
      const existing = await StockTransaction.findOne({ where: { referenceNo: t.referenceNo } });
      if (!existing) {
        await StockTransaction.create(t);
      }
    }
    console.log('✅ Stock Movements recorded.\n');

    // 4. SEED CUSTOMERS & BD PIPELINE
    console.log('👥 Seeding Customers & Business Development Tracker...');
    const customersData = [
      {
        uniqueId: 'CUST/2026-27/0001',
        customerName: 'Adani Logistics Hub',
        contactNo: '+91 98201 55667',
        address: 'Plot 45, Sector 18, JNPT Logistics Park, Navi Mumbai, MH',
        systemType: 'On-Grid',
        capacity: '50 kW Commercial',
        dateOfVisit: '2026-06-10',
        timeOfVisit: '11:00 AM',
        reference: 'Industrial Expo Mumbai',
        bdeEmail: 'rajesh.sharma@sologix.com',
        bdeName: 'Rajesh Sharma',
        comments: 'Roof structural audit completed. 50kW Net-Meter approved by MSEDCL.',
        bookingConfirmed: 'Confirmed',
        bookingAmount: 75000,
        modeOfPayment: 'NEFT / RTGS',
        projectValue: 2450000,
        addOn1: 'Elevated HDG Structure (+2m)',
        addOn2: 'Remote IoT Weather Station',
        addOn3: '5-Year Comprehensive O&M',
        financialYear: '2026-27',
        userId: admin.id,
      },
      {
        uniqueId: 'CUST/2026-27/0002',
        customerName: 'Heritage Textiles Mill',
        contactNo: '+91 94220 88990',
        address: 'Survey 102, GIDC Industrial Estate, Surat, Gujarat',
        systemType: 'On-Grid',
        capacity: '100 kW Industrial',
        dateOfVisit: '2026-07-02',
        timeOfVisit: '02:30 PM',
        reference: 'Direct BD Referral',
        bdeEmail: 'priya.singh@sologix.com',
        bdeName: 'Priya Singh',
        comments: 'Material dispatched to site. Civil foundation work in progress.',
        bookingConfirmed: 'Confirmed',
        bookingAmount: 150000,
        modeOfPayment: 'Cheque',
        projectValue: 4800000,
        addOn1: 'Bi-facial High-Yield Modules',
        addOn2: 'Surge Protection Device Type 1+2',
        addOn3: 'Online Net Metering Gateway',
        financialYear: '2026-27',
        userId: staff1.id,
      },
      {
        uniqueId: 'CUST/2026-27/0003',
        customerName: 'Shree Krishna Agro Cold Storage',
        contactNo: '+91 97230 44556',
        address: 'NH-48 Highway, Anand, Gujarat',
        systemType: 'Hybrid',
        capacity: '30 kW Solar + 20 kWh Battery',
        dateOfVisit: '2026-04-12', // > 3 months inactive!
        timeOfVisit: '10:00 AM',
        reference: 'Website Inquiry',
        bdeEmail: 'rajesh.sharma@sologix.com',
        bdeName: 'Rajesh Sharma',
        comments: 'Client delayed site readiness. Payment overdue for 3+ months.',
        bookingConfirmed: 'Confirmed',
        bookingAmount: 50000,
        modeOfPayment: 'UPI',
        projectValue: 1850000,
        addOn1: 'Lithium Battery Storage 20kWh',
        addOn2: 'Diesel Generator Synchronizer',
        addOn3: 'Automatic Transfer Switch',
        financialYear: '2026-27',
        userId: staff1.id,
      },
      {
        uniqueId: 'CUST/2026-27/0004',
        customerName: 'Dr. Vikram Mehra (Luxury Villa)',
        contactNo: '+91 98450 11998',
        address: 'Bungalow 12, Palm Meadows, Whitefield, Bengaluru, KA',
        systemType: 'Hybrid',
        capacity: '10 kW Residential Hybrid',
        dateOfVisit: '2026-07-20',
        timeOfVisit: '04:00 PM',
        reference: 'Architect Referral',
        bdeEmail: 'priya.singh@sologix.com',
        bdeName: 'Priya Singh',
        comments: 'Opted for 12-Month EMI Payment Schedule.',
        bookingConfirmed: 'Confirmed',
        bookingAmount: 40000,
        modeOfPayment: 'UPI',
        projectValue: 650000,
        addOn1: 'Wall-Mount LiFePO4 Battery Pack',
        addOn2: 'Micro-Inverter Monitoring',
        addOn3: 'App-Based Control System',
        financialYear: '2026-27',
        userId: staff2.id,
      },
      {
        uniqueId: 'CUST/2026-27/0005',
        customerName: 'Green Horizon Farmhouse',
        contactNo: '+91 99110 33221',
        address: 'Kanakapura Main Road, Harohalli, Karnataka',
        systemType: 'Off-Grid',
        capacity: '5 kW Off-Grid',
        dateOfVisit: '2026-08-15',
        timeOfVisit: '11:30 AM',
        reference: 'Social Media Campaign',
        bdeEmail: 'rajesh.sharma@sologix.com',
        bdeName: 'Rajesh Sharma',
        comments: 'Site visit completed, quotation sent for rooftop installation.',
        bookingConfirmed: 'Pending',
        bookingAmount: 10000,
        modeOfPayment: 'UPI',
        projectValue: 380000,
        addOn1: 'Solar Water Pump Integration',
        addOn2: 'Tubular Battery Rack',
        addOn3: 'Lightning Arrester Kit',
        financialYear: '2026-27',
        userId: staff1.id,
      },
    ];

    const createdCustomers = [];
    for (const c of customersData) {
      let cust = await Customer.findOne({ where: { uniqueId: c.uniqueId } });
      if (!cust) {
        cust = await Customer.create(c);
      } else {
        await cust.update(c);
      }
      createdCustomers.push(cust);
    }
    console.log(`✅ ${createdCustomers.length} Customers ready.\n`);

    // 5. SEED ACCOUNTS & COMMERCIAL LEDGER
    console.log('💳 Seeding Accounts & Commercial Ledgers...');
    const accountsData = [
      // 1. Fully On-Time Settled Commercial Project
      {
        uniqueId: 'ACC/2026-27/0001',
        customerName: 'Adani Logistics Hub',
        contactNo: '+91 98201 55667',
        address: 'Plot 45, Sector 18, JNPT Logistics Park, Navi Mumbai, MH',
        projectValue: 2450000,
        bookingAmount: 75000,
        modeOfPayment: 'NEFT / RTGS',
        statusOfWork: 'Handover Completed',
        completionPercentage: 100,
        remainingAmount: 0,
        paymentDueDate: '2026-08-15',
        payment1Amount: 600000,
        payment1Date: '2026-06-25',
        payment1Mode: 'NEFT',
        payment2Amount: 600000,
        payment2Date: '2026-07-10',
        payment2Mode: 'RTGS',
        payment3Amount: 600000,
        payment3Date: '2026-07-28',
        payment3Mode: 'RTGS',
        payment4Amount: 400000,
        payment4Date: '2026-08-10',
        payment4Mode: 'NEFT',
        payment5Amount: 175000,
        payment5Date: '2026-08-15',
        payment5Mode: 'RTGS',
        isRecurring: false,
        financialYear: '2026-27',
        customerId: createdCustomers[0].id,
        userId: admin.id,
      },
      // 2. Active Ongoing Execution Project (Civil Work / P2 Paid)
      {
        uniqueId: 'ACC/2026-27/0002',
        customerName: 'Heritage Textiles Mill',
        contactNo: '+91 94220 88990',
        address: 'Survey 102, GIDC Industrial Estate, Surat, Gujarat',
        projectValue: 4800000,
        bookingAmount: 150000,
        modeOfPayment: 'Cheque',
        statusOfWork: 'Civil Work in Progress',
        completionPercentage: 45,
        remainingAmount: 2650000,
        paymentDueDate: '2026-09-05',
        payment1Amount: 1000000,
        payment1Date: '2026-07-15',
        payment1Mode: 'RTGS',
        payment2Amount: 1000000,
        payment2Date: '2026-08-05',
        payment2Mode: 'RTGS',
        payment3Amount: 0,
        payment3Date: null,
        payment3Mode: null,
        payment4Amount: 0,
        payment4Date: null,
        payment4Mode: null,
        payment5Amount: 0,
        payment5Date: null,
        payment5Mode: null,
        isRecurring: false,
        financialYear: '2026-27',
        customerId: createdCustomers[1].id,
        userId: staff1.id,
      },
      // 3. NPM (Non-Performing Milestone) Account — Overdue > 3 Months with Red Highlight
      {
        uniqueId: 'ACC/2026-27/0003',
        customerName: 'Shree Krishna Agro Cold Storage',
        contactNo: '+91 97230 44556',
        address: 'NH-48 Highway, Anand, Gujarat',
        projectValue: 1850000,
        bookingAmount: 50000,
        modeOfPayment: 'UPI',
        statusOfWork: 'NPM - Payment Default (3+ Months)',
        completionPercentage: 15,
        remainingAmount: 1800000,
        paymentDueDate: '2026-05-10', // 100+ days crossed!
        payment1Amount: 0,
        payment1Date: null,
        payment1Mode: null,
        payment2Amount: 0,
        payment2Date: null,
        payment2Mode: null,
        payment3Amount: 0,
        payment3Date: null,
        payment3Mode: null,
        payment4Amount: 0,
        payment4Date: null,
        payment4Mode: null,
        payment5Amount: 0,
        payment5Date: null,
        payment5Mode: null,
        isRecurring: false,
        financialYear: '2026-27',
        customerId: createdCustomers[2].id,
        userId: staff1.id,
      },
      // 4. Active Recurring EMI Payment Account (Monthly ₹15,000, 3 of 12 Cycles Paid)
      {
        uniqueId: 'ACC/2026-27/0004',
        customerName: 'Dr. Vikram Mehra (Luxury Villa)',
        contactNo: '+91 98450 11998',
        address: 'Bungalow 12, Palm Meadows, Whitefield, Bengaluru, KA',
        projectValue: 650000,
        bookingAmount: 40000,
        modeOfPayment: 'UPI',
        statusOfWork: 'Electrical Work in Progress',
        completionPercentage: 60,
        remainingAmount: 430000,
        paymentDueDate: '2026-09-01',
        payment1Amount: 135000,
        payment1Date: '2026-07-22',
        payment1Mode: 'UPI',
        payment2Amount: 0,
        payment2Date: null,
        payment2Mode: null,
        payment3Amount: 0,
        payment3Date: null,
        payment3Mode: null,
        payment4Amount: 0,
        payment4Date: null,
        payment4Mode: null,
        payment5Amount: 0,
        payment5Date: null,
        payment5Mode: null,
        // Recurring EMI Setup
        isRecurring: true,
        recurringFrequency: 'Monthly',
        recurringAmount: 15000,
        recurringStartDate: '2026-07-01',
        recurringNextDueDate: '2026-10-01',
        recurringTotalCycles: 12,
        recurringCompletedCycles: 3,
        recurringStatus: 'Active',
        financialYear: '2026-27',
        customerId: createdCustomers[3].id,
        userId: staff2.id,
      },
    ];

    for (const a of accountsData) {
      let acc = await Account.findOne({ where: { uniqueId: a.uniqueId } });
      if (!acc) {
        await Account.create(a);
      } else {
        await acc.update(a);
      }
    }
    console.log('✅ Accounts & Milestones ready.\n');

    // 6. SEED ACTIVITY LOGS
    console.log('📋 Seeding Audit Activity Logs...');
    const activities = [
      {
        userId: admin.id,
        userName: admin.name,
        userEmail: admin.email,
        role: admin.role,
        action: 'LOGIN',
        status: 'SUCCESS',
        ipAddress: '192.168.88.241',
        device: 'Desktop / Laptop',
        browser: 'Chrome 128.0',
        os: 'Windows 11',
        details: 'Admin logged into executive portal',
      },
      {
        userId: staff1.id,
        userName: staff1.name,
        userEmail: staff1.email,
        role: staff1.role,
        action: 'STOCK_OUT',
        status: 'SUCCESS',
        ipAddress: '192.168.88.110',
        device: 'Mobile Phone',
        browser: 'Mobile Safari',
        os: 'Android 14',
        details: 'Dispatched 2x Growatt 10kW Inverters for Adani Logistics Site',
      },
      {
        userId: staff2.id,
        userName: staff2.name,
        userEmail: staff2.email,
        role: staff2.role,
        action: 'PAYMENT_RECORDED',
        status: 'SUCCESS',
        ipAddress: '192.168.88.115',
        device: 'Desktop',
        browser: 'Edge 128.0',
        os: 'Windows 11',
        details: 'Recorded Monthly EMI Cycle #3 of 12 for Dr. Vikram Mehra (₹15,000)',
      },
    ];

    for (const act of activities) {
      await ActivityLog.create(act);
    }
    console.log('✅ Activity Logs recorded.\n');

    console.log('============================================================');
    console.log('🎉 ALL DUMMY DATA SEEDED SUCCESSFULLY!');
    console.log('============================================================');
    console.log('✨ You can now test:');
    console.log('  1. Dashboard & Circular Donut Charts');
    console.log('  2. BD Customers Pipeline & Dispatches');
    console.log('  3. Accounts, Aging, NPM Red Status & Recurring EMIs (+ EMI)');
    console.log('  4. Product Catalog, Low Stock Alerts & Serial Numbers');
    console.log('  5. Stock In / Stock Out Movements');
    console.log('  6. User Management & Audit Activity Logs');
    console.log('============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder Error:', error);
    process.exit(1);
  }
};

seedData();
