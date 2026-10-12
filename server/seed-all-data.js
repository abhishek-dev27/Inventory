/**
 * 🌟 Comprehensive End-to-End Dummy Data Seeder
 * 
 * Populates all fields across:
 * 1. Users (Admin + Staff Technicians)
 * 2. Products / Solar Catalog (Panels, Inverters, Batteries, Structures, Cables, Meters)
 * 3. Stock Transactions (Inward Supplies + Outward Dispatches with Serial Numbers)
 * 4. Activity Logs (Real audit trail)
 */

require('dotenv').config();
const { sequelize, connectDB } = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const StockTransaction = require('./models/StockTransaction');
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

    // 4. SEED ACTIVITY LOGS
    
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
    console.log('  1. Dashboard & Godown Inventory Breakdown');
    console.log('  2. Product Catalog, Low Stock Alerts & Serial Numbers');
    console.log('  3. Stock In / Stock Out Movements & Dispatch Bills');
    console.log('  4. User Management & Audit Activity Logs');
    console.log('============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder Error:', error);
    process.exit(1);
  }
};

seedData();
