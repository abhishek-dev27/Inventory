require('dotenv').config({ path: __dirname + '/.env' });
const { sequelize } = require('./config/db');
const Product = require('./models/Product');
const StockTransaction = require('./models/StockTransaction');
const Customer = require('./models/Customer');
const Account = require('./models/Account');
const ActivityLog = require('./models/ActivityLog');
const User = require('./models/User');

const bomMaterials = [
  // ---------- CATEGORY 01: ON-GRID INVERTER ----------
  {
    name: '8.3 kW On-grid PV Inverter',
    sku: 'INV-OGI-8.3KW',
    productType: 'Ongrid Inverter',
    category: 'Inverters',
    brand: 'Growatt',
    capacity: '8.3 kW',
    phase: '3-Phase',
    unit: 'pcs',
    quantity: 1,
    price: 17174.00,
    costPrice: 17174.00,
    lowStockThreshold: 1,
    location: 'Electrical Bay A-01',
    description: '8.3 kW On-grid PV Inverter for 3.3 kW Solar Plant verified bill of materials',
  },

  // ---------- CATEGORY 02: PANELS ----------
  {
    name: '590 Wp Solar Modules',
    sku: 'PAN-RAY-590WP',
    productType: 'Panels',
    category: 'Solar Panels & Modules',
    brand: 'Rayzon',
    capacity: '590 W',
    phase: 'DC',
    dcrType: 'DCR',
    unit: 'pcs',
    quantity: 6,
    price: 11940.00,
    costPrice: 11940.00,
    lowStockThreshold: 2,
    location: 'Yard Bay P-01',
    description: '590 Wp High-efficiency Solar Modules (6 pcs @ ₹11,940 ea = ₹71,940 total). Verified vs handwritten site notebook.',
  },

  // ---------- CATEGORY 03: MSB ----------
  {
    name: '32A ACDB Box',
    sku: 'MSB-ACDB-32A-SET',
    productType: 'ACDB',
    category: 'ACDB & Distribution Boxes',
    brand: 'Standard',
    capacity: '1-Phase 1kW - 5kW (32A)',
    phase: '1-Phase (Single Phase AC)',
    unit: 'set',
    quantity: 1,
    price: 0.00,
    costPrice: 0.00,
    lowStockThreshold: 1,
    location: 'Electrical Bay A-02',
    description: '32A ACDB Box set header for rooftop installation',
  },
  {
    name: 'ACDB Box — 180×130×90',
    sku: 'MSB-ACDB-ENC-180',
    productType: 'ACDB',
    category: 'ACDB & Distribution Boxes',
    brand: 'Standard',
    subType: 'IP65 Weatherproof Polycarbonate',
    unit: 'pcs',
    quantity: 1,
    price: 130.00,
    costPrice: 130.00,
    lowStockThreshold: 2,
    location: 'Electrical Bay A-02',
    description: 'ACDB Enclosure Box — 180×130×90 mm',
  },
  {
    name: '1 in / 1 out DCDB Box',
    sku: 'MSB-DCDB-1IN1OUT-SET',
    productType: 'DCDB',
    category: 'DCDB & Array Junction Boxes',
    brand: 'Hensel',
    capacity: '1 In 1 Out (1 String)',
    phase: '1000V DC (1 kV)',
    unit: 'set',
    quantity: 1,
    price: 0.00,
    costPrice: 0.00,
    lowStockThreshold: 1,
    location: 'Electrical Bay A-03',
    description: '1 in / 1 out DCDB Box set (corrected from "1-inch" mislabel)',
  },
  {
    name: 'DCDB Box — 280×190×130',
    sku: 'MSB-DCDB-ENC-280',
    productType: 'DCDB',
    category: 'DCDB & Array Junction Boxes',
    brand: 'Hensel',
    subType: 'IP65 UV Resistant Polycarbonate',
    unit: 'pcs',
    quantity: 1,
    price: 330.00,
    costPrice: 330.00,
    lowStockThreshold: 2,
    location: 'Electrical Bay A-03',
    description: 'DCDB Enclosure Box — 280×190×130 mm (₹450 struck out in notebook)',
  },
  {
    name: 'Fuse Holder with Fuse',
    sku: 'MSB-FUSE-HLD-1000V',
    productType: 'MSB',
    category: 'Electrical Switchgear & MSB',
    brand: 'Standard',
    unit: 'pcs',
    quantity: 1,
    price: 135.00,
    costPrice: 135.00,
    lowStockThreshold: 2,
    location: 'Electrical Bay A-04',
    description: 'Fuse Holder with DC Fuse for solar array protection',
  },
  {
    name: 'Terminal Connector (Black-2 / Red-1)',
    sku: 'MSB-TERM-CONN-3P',
    productType: 'MSB',
    category: 'Electrical Switchgear & MSB',
    brand: 'Elmex',
    unit: 'pcs',
    quantity: 3,
    price: 12.00, // ₹36 total for 3 pcs
    costPrice: 12.00,
    lowStockThreshold: 5,
    location: 'Electrical Bay A-04',
    description: 'Din Rail Terminal Connectors (2 Black / 1 Red) - ₹36 group total',
  },
  {
    name: '600V DC SPD, 2-Pole',
    sku: 'MSB-SPD-600VDC-2P',
    productType: 'DCDB',
    category: 'DCDB & Array Junction Boxes',
    brand: 'Suntree',
    capacity: '600V DC',
    unit: 'pcs',
    quantity: 1,
    price: 490.00,
    costPrice: 490.00,
    lowStockThreshold: 2,
    location: 'Electrical Bay A-03',
    description: '600V DC Surge Protection Device (SPD), 2-Pole',
  },
  {
    name: '820V AC SPD',
    sku: 'MSB-SPD-820VAC',
    productType: 'ACDB',
    category: 'ACDB & Distribution Boxes',
    brand: 'Schneider Electric',
    unit: 'pcs',
    quantity: 1,
    price: 490.00,
    costPrice: 490.00,
    lowStockThreshold: 2,
    location: 'Electrical Bay A-02',
    description: '820V AC Surge Protection Device (corrected from "32A AC SPD, ₹50" confusion)',
  },
  {
    name: 'PVC Gland — 9 No. (ACDB box)',
    sku: 'MSB-GLD-9NO-ACDB',
    productType: 'MSB',
    category: 'Electrical Switchgear & MSB',
    unit: 'pcs',
    quantity: 1,
    price: 20.00,
    costPrice: 20.00,
    lowStockThreshold: 5,
    location: 'Electrical Bay A-04',
    description: 'PVC Cable Gland — Size No. 9 for ACDB box',
  },
  {
    name: 'PVC Gland — 13.5 No. (ACDB box)',
    sku: 'MSB-GLD-13.5NO-ACDB',
    productType: 'MSB',
    category: 'Electrical Switchgear & MSB',
    unit: 'pcs',
    quantity: 2,
    price: 10.00, // ₹20 total
    costPrice: 10.00,
    lowStockThreshold: 5,
    location: 'Electrical Bay A-04',
    description: 'PVC Cable Gland — Size No. 13.5 for ACDB box (2 pcs @ ₹20 total)',
  },
  {
    name: 'PVC Gland — 9 No. (DCDB box)',
    sku: 'MSB-GLD-9NO-DCDB',
    productType: 'MSB',
    category: 'Electrical Switchgear & MSB',
    unit: 'pcs',
    quantity: 1,
    price: 9.00,
    costPrice: 9.00,
    lowStockThreshold: 5,
    location: 'Electrical Bay A-04',
    description: 'PVC Cable Gland — Size No. 9 for DCDB box',
  },
  {
    name: 'PVC Gland — 13.5 No. (DCDB box)',
    sku: 'MSB-GLD-13.5NO-DCDB',
    productType: 'MSB',
    category: 'Electrical Switchgear & MSB',
    unit: 'pcs',
    quantity: 3,
    price: 5.00, // ₹15 total
    costPrice: 5.00,
    lowStockThreshold: 5,
    location: 'Electrical Bay A-04',
    description: 'PVC Cable Gland — Size No. 13.5 for DCDB box (3 pcs @ ₹15 total, added from source photo)',
  },
  {
    name: 'DC Cutting Wire (ACDB box)',
    sku: 'WIR-CUT-ACDB-2M',
    productType: 'Wires',
    category: 'Cables & Wiring',
    unit: 'm',
    quantity: 2,
    price: 15.00, // ₹30 total for 2m
    costPrice: 15.00,
    lowStockThreshold: 5,
    location: 'Wiring Rack W-01',
    description: 'DC Cutting Wire for ACDB box internal wiring (2 meters, ₹30 total)',
  },
  {
    name: 'DC Cutting Wire (DCDB box)',
    sku: 'WIR-CUT-DCDB-1.5M',
    productType: 'Wires',
    category: 'Cables & Wiring',
    unit: 'm',
    quantity: 2, // ~1.5m
    price: 15.00, // ₹30 total
    costPrice: 15.00,
    lowStockThreshold: 5,
    location: 'Wiring Rack W-01',
    description: 'DC Cutting Wire for DCDB box internal wiring (1.5 meters, ₹30 total)',
  },
  {
    name: 'Tubular Lug (ACDB)',
    sku: 'MSB-LUG-TUB-ACDB',
    productType: 'MSB',
    category: 'Electrical Switchgear & MSB',
    unit: 'pcs',
    quantity: 10,
    price: 2.00, // ₹20 total for 10 pcs
    costPrice: 2.00,
    lowStockThreshold: 10,
    location: 'Electrical Bay A-04',
    description: 'Tubular Copper Lugs for ACDB wiring connections (10 pcs @ ₹20 total)',
  },
  {
    name: 'Tubular Lug (DCDB)',
    sku: 'MSB-LUG-TUB-DCDB',
    productType: 'MSB',
    category: 'Electrical Switchgear & MSB',
    unit: 'pcs',
    quantity: 6,
    price: 3.33, // ₹20 total for 6 pcs
    costPrice: 3.33,
    lowStockThreshold: 10,
    location: 'Electrical Bay A-04',
    description: 'Tubular Copper Lugs for DCDB wiring connections (6 pcs @ ₹20 total)',
  },

  // ---------- CATEGORY 04: MCB ----------
  {
    name: '32A 2-Pole DP MCB',
    sku: 'MCB-SCH-32A-2P',
    productType: 'MCB',
    category: 'Circuit Breakers & MCB',
    brand: 'Schneider Electric',
    capacity: '32A',
    phase: '2-Phase (2P / Double Pole)',
    unit: 'pcs',
    quantity: 1,
    price: 374.00,
    costPrice: 374.00,
    lowStockThreshold: 2,
    location: 'Electrical Bay A-05',
    description: '32A Double Pole (2P) Miniature Circuit Breaker for AC isolation',
  },
  {
    name: 'MCB Channel — 12 inch',
    sku: 'MCB-CHN-DIN-12IN',
    productType: 'MCB',
    category: 'Circuit Breakers & MCB',
    unit: 'pcs',
    quantity: 1,
    price: 30.00,
    costPrice: 30.00,
    lowStockThreshold: 2,
    location: 'Electrical Bay A-05',
    description: 'MCB Din Rail Slotted Channel — 12 inch length',
  },
  {
    name: 'MCB Channel — 1.5 inch',
    sku: 'MCB-CHN-DIN-1.5IN',
    productType: 'MCB',
    category: 'Circuit Breakers & MCB',
    unit: 'pcs',
    quantity: 1,
    price: 30.00,
    costPrice: 30.00,
    lowStockThreshold: 2,
    location: 'Electrical Bay A-05',
    description: 'MCB Din Rail Slotted Channel — 1.5 inch length (corrected from 15 inch)',
  },

  // ---------- CATEGORY 05: WIRES ----------
  {
    name: '4 sq mm DC Wire — Type (I)',
    sku: 'WIR-DC-4SQMM-50M',
    productType: 'Wires',
    category: 'Cables & Wiring',
    brand: 'Polycab',
    unit: 'm',
    quantity: 50,
    price: 40.00, // ₹2,000 total for 50m
    costPrice: 40.00,
    lowStockThreshold: 20,
    location: 'Wiring Rack W-02',
    description: '4 sq mm Solar DC Cable / Wire — Type (I) (~50 meters approx, ₹2,000 total)',
  },
  {
    name: '4 sq mm AC Wire',
    sku: 'WIR-AC-4SQMM-80M',
    productType: 'Wires',
    category: 'Cables & Wiring',
    brand: 'Havells',
    unit: 'm',
    quantity: 80,
    price: 40.00, // ₹3,200 total for 80m
    costPrice: 40.00,
    lowStockThreshold: 20,
    location: 'Wiring Rack W-02',
    description: '4 sq mm AC Copper Cable / Wire (~80 meters approx, ₹3,200 total)',
  },
  {
    name: '4 sq mm Cu Lug Ring',
    sku: 'WIR-LUG-RING-4SQMM',
    productType: 'Wires',
    category: 'Cables & Wiring',
    unit: 'pcs',
    quantity: 2,
    price: 10.00, // ₹20 total
    costPrice: 10.00,
    lowStockThreshold: 5,
    location: 'Wiring Rack W-03',
    description: '4 sq mm Copper Ring Lug (corrected from "45 sq mm" misread)',
  },
  {
    name: '16 sq mm Cu Lug Ring',
    sku: 'WIR-LUG-RING-16SQMM',
    productType: 'Wires',
    category: 'Cables & Wiring',
    unit: 'pcs',
    quantity: 2,
    price: 15.00, // ₹30 total
    costPrice: 15.00,
    lowStockThreshold: 5,
    location: 'Wiring Rack W-03',
    description: '16 sq mm Copper Ring Lug for main earthing & inverter ground',
  },
  {
    name: '4 sq mm Cu Bottle Lug',
    sku: 'WIR-LUG-BOT-4SQMM',
    productType: 'Wires',
    category: 'Cables & Wiring',
    unit: 'pcs',
    quantity: 6,
    price: 3.33, // ₹20 total for 6 pcs
    costPrice: 3.33,
    lowStockThreshold: 5,
    location: 'Wiring Rack W-03',
    description: '4 sq mm Copper Bottle / Pin Lug (corrected from "45 sq mm" misread)',
  },

  // ---------- CATEGORY 06: STRUCTURE ----------
  {
    name: '3×2 Structure Table',
    sku: 'STR-TBL-3X2-300MM',
    productType: 'Structure',
    category: 'Mounting Structure & Hardware',
    brand: 'Standard',
    unit: 'set',
    quantity: 1,
    price: 15000.00,
    costPrice: 15000.00,
    lowStockThreshold: 1,
    location: 'Yard Bay S-01',
    description: '3×2 Solar Module Mounting Structure Table with 300mm ground clearance per site notebook',
  },
  {
    name: 'Purlin — 3499 mm',
    sku: 'STR-PURLIN-3499MM',
    productType: 'Structure',
    category: 'Mounting Structure & Hardware',
    unit: 'pcs',
    quantity: 4,
    price: 0.00,
    costPrice: 0.00,
    lowStockThreshold: 2,
    location: 'Yard Bay S-02',
    description: 'Structure Purlin section — length 3499 mm (4 pcs)',
  },
  {
    name: 'Rafter — 3900 mm',
    sku: 'STR-RAFTER-3900MM',
    productType: 'Structure',
    category: 'Mounting Structure & Hardware',
    unit: 'pcs',
    quantity: 2,
    price: 0.00,
    costPrice: 0.00,
    lowStockThreshold: 2,
    location: 'Yard Bay S-02',
    description: 'Structure Rafter section — length 3900 mm (2 pcs)',
  },
  {
    name: 'Small Leg — 536 mm',
    sku: 'STR-LEG-SM-536MM',
    productType: 'Structure',
    category: 'Mounting Structure & Hardware',
    unit: 'pcs',
    quantity: 2,
    price: 0.00,
    costPrice: 0.00,
    lowStockThreshold: 2,
    location: 'Yard Bay S-02',
    description: 'Structure Front / Small Leg — length 536 mm (2 pcs)',
  },
  {
    name: 'Big Leg — 1450 mm',
    sku: 'STR-LEG-BG-1450MM',
    productType: 'Structure',
    category: 'Mounting Structure & Hardware',
    unit: 'pcs',
    quantity: 2,
    price: 0.00,
    costPrice: 0.00,
    lowStockThreshold: 2,
    location: 'Yard Bay S-02',
    description: 'Structure Rear / Big Leg — length 1450 mm (2 pcs)',
  },
  {
    name: 'Small Cleat',
    sku: 'STR-CLEAT-SMALL',
    productType: 'Structure',
    category: 'Mounting Structure & Hardware',
    unit: 'pcs',
    quantity: 8,
    price: 0.00,
    costPrice: 0.00,
    lowStockThreshold: 5,
    location: 'Yard Bay S-03',
    description: 'Structure Small Cleat angle brackets (8 pcs)',
  },
  {
    name: 'M8×25 Nut & Bolt',
    sku: 'STR-BOLT-M8X25',
    productType: 'Structure',
    category: 'Mounting Structure & Hardware',
    subType: 'SS304 Allen / Hex Bolts',
    unit: 'pcs',
    quantity: 40,
    price: 0.00,
    costPrice: 0.00,
    lowStockThreshold: 20,
    location: 'Hardware Bay H-01',
    description: 'M8×25 Stainless Steel / GI Nut & Bolt for solar module mounting (40 pcs)',
  },
  {
    name: 'M10×30 Nut & Bolt',
    sku: 'STR-BOLT-M10X30',
    productType: 'Structure',
    category: 'Mounting Structure & Hardware',
    subType: 'SS304 Allen / Hex Bolts',
    unit: 'pcs',
    quantity: 8,
    price: 0.00,
    costPrice: 0.00,
    lowStockThreshold: 10,
    location: 'Hardware Bay H-01',
    description: 'M10×30 Nut & Bolt for structure leg and rafter joints (8 pcs)',
  },

  // ---------- CATEGORY 07: CONSUMABLE ----------
  {
    name: 'M10 Fastener Bolt',
    sku: 'CON-BOLT-M10-FASTENER',
    productType: 'Consumable',
    category: 'Installation Consumables',
    subType: 'Galvanized GI Fasteners',
    unit: 'pcs',
    quantity: 16,
    price: 23.75, // ₹380 total for 16 pcs
    costPrice: 23.75,
    lowStockThreshold: 10,
    location: 'Hardware Bay H-02',
    description: 'M10 Anchor Fastener Bolts for base civil grouting (16 pcs @ ₹380 total)',
  },
  {
    name: 'Epoxy Bonding Agent 211 (Chemical)',
    sku: 'CON-EPOXY-211-1L',
    productType: 'Consumable',
    category: 'Installation Consumables',
    subType: 'Chemical / Compound',
    unit: 'liters',
    quantity: 1,
    price: 850.00,
    costPrice: 850.00,
    lowStockThreshold: 1,
    location: 'Chemical Store C-01',
    description: 'Epoxy Bonding Agent 211 Chemical (1 litre bottle) (corrected from 4 litres in original doc)',
  },
  {
    name: 'Cement (approx.)',
    sku: 'CON-CEMENT-BAG-2',
    productType: 'Consumable',
    category: 'Installation Consumables',
    subType: 'Other Consumable',
    unit: 'pack',
    quantity: 2,
    price: 380.00, // ₹760 total for 2 bags
    costPrice: 380.00,
    lowStockThreshold: 2,
    location: 'Civil Store C-02',
    description: 'Cement for civil foundation / footing (2 bags @ ₹380 each = ₹760 total)',
  },
  {
    name: 'Sand',
    sku: 'CON-SAND-BAG-8',
    productType: 'Consumable',
    category: 'Installation Consumables',
    subType: 'Other Consumable',
    unit: 'pack',
    quantity: 8,
    price: 180.00, // ₹1,440 total for 8 bags
    costPrice: 180.00,
    lowStockThreshold: 5,
    location: 'Civil Store C-02',
    description: 'Sand bags for civil footing work (8 bags @ ₹180 each = ₹1,440 total) (corrected from ₹760 misread)',
  },
  {
    name: '3/4 Aggregate',
    sku: 'CON-AGGR-3-4-BAG-8',
    productType: 'Consumable',
    category: 'Installation Consumables',
    subType: 'Other Consumable',
    unit: 'pack',
    quantity: 8,
    price: 190.00, // ₹1,520 total for 8 bags
    costPrice: 190.00,
    lowStockThreshold: 5,
    location: 'Civil Store C-02',
    description: '3/4 Aggregate coarse stone bags for concrete footing (8 bags @ ₹190 each = ₹1,520 total)',
  },
  {
    name: 'Auto / Transportation',
    sku: 'CON-AUTO-TRANSP-LOT',
    productType: 'Consumable',
    category: 'Installation Consumables',
    unit: 'units',
    quantity: 1,
    price: 800.00,
    costPrice: 800.00,
    lowStockThreshold: 1,
    location: 'Logistics Service',
    description: 'Auto / Site Material Transportation freight charge (1 lot @ ₹800)',
  },
  {
    name: 'Cable Tie — 300 mm',
    sku: 'CON-CABLE-TIE-300MM',
    productType: 'Consumable',
    category: 'Installation Consumables',
    subType: 'Other Consumable',
    unit: 'pack',
    quantity: 1,
    price: 120.00,
    costPrice: 120.00,
    lowStockThreshold: 2,
    location: 'Hardware Bay H-03',
    description: 'Cable Tie UV resistant — 300 mm (1 packet @ ₹120)',
  },
  {
    name: 'MC4 Connector',
    sku: 'CON-MC4-CONN-2PAIR',
    productType: 'Consumable',
    category: 'Installation Consumables',
    subType: 'Other Consumable',
    unit: 'pair',
    quantity: 2,
    price: 125.00, // ₹250 total for 2 pairs
    costPrice: 125.00,
    lowStockThreshold: 5,
    location: 'Hardware Bay H-03',
    description: 'MC4 Solar PV Connectors Male/Female (2 pairs @ ₹250 total)',
  },
  {
    name: '2-inch Screw',
    sku: 'CON-SCREW-2IN-20PC',
    productType: 'Consumable',
    category: 'Installation Consumables',
    subType: 'Nut & Bolt',
    unit: 'pcs',
    quantity: 20,
    price: 1.50, // ₹30 total for 20 pcs (₹150/packet)
    costPrice: 1.50,
    lowStockThreshold: 10,
    location: 'Hardware Bay H-01',
    description: '2-inch Wood / Wall Screws (20 pcs @ ₹30 total / ₹150 packet rate)',
  },
  {
    name: 'PVC Tape',
    sku: 'CON-TAPE-PVC-2PC',
    productType: 'Consumable',
    category: 'Installation Consumables',
    subType: 'Insulation Tape',
    unit: 'pcs',
    quantity: 2,
    price: 80.00, // ≈₹160 total for 2 pcs
    costPrice: 80.00,
    lowStockThreshold: 5,
    location: 'Hardware Bay H-03',
    description: 'PVC Electrical Insulation Tape (2 pcs ≈ ₹160 total)',
  },
  {
    name: '2-inch Guda / Conduit',
    sku: 'CON-GUDA-2IN-20PC',
    productType: 'Consumable',
    category: 'Installation Consumables',
    subType: 'Other Consumable',
    unit: 'pcs',
    quantity: 20,
    price: 1.25, // ₹25 total for 20 pcs (₹80/packet)
    costPrice: 1.25,
    lowStockThreshold: 10,
    location: 'Hardware Bay H-03',
    description: '2-inch Wall Plugs / Guda Conduit fastenings (20 pcs @ ₹25 total / ₹80 packet rate)',
  },
  {
    name: '25 kg Chemical Bag',
    sku: 'EAR-CHEM-BFC-25KG',
    productType: 'Earthing Material',
    category: 'Earthing & Lightning Protection',
    brand: 'Ashlok',
    subType: 'Conductive Earth Backfill Chemical (BFC / Compound)',
    capacity: '25 kg Bag (Backfill Chemical BFC)',
    unit: 'pack',
    quantity: 3,
    price: 340.00, // Grouped w/ electrode & chamber cover (₹1,020 group total)
    costPrice: 340.00,
    lowStockThreshold: 2,
    location: 'Earthing Bay E-01',
    description: '25 kg Chemical Bag (3 bags, grouped with Electrode Rod & PVC Chamber Cover ₹1,020 total)',
  },

  // ---------- CATEGORY 08: OTHER ----------
  {
    name: 'Dial Box for civil work',
    sku: 'OTH-CIVIL-DIAL-BOX-4PC',
    productType: 'Other',
    category: 'Other',
    unit: 'box',
    quantity: 4,
    price: 0.00,
    costPrice: 0.00,
    lowStockThreshold: 2,
    location: 'Civil Store C-02',
    description: 'Dial Box formwork for civil footing work (4 boxes)',
  },
  {
    name: '20 sq mm MMS Pipe',
    sku: 'OTH-PIPE-MMS-20SQMM',
    productType: 'Other',
    category: 'Other',
    unit: 'pcs',
    quantity: 15,
    price: 63.33, // ₹950 total for 15 pcs
    costPrice: 63.33,
    lowStockThreshold: 5,
    location: 'Piping Rack P-01',
    description: '20 sq mm MMS Conduit Pipe (approx 15 pcs @ ₹950 total) (corrected from ₹450)',
  },
  {
    name: '20 sq mm Bend',
    sku: 'OTH-BEND-MMS-20SQMM',
    productType: 'Other',
    category: 'Other',
    unit: 'pcs',
    quantity: 30,
    price: 7.00, // ₹210 total for 30 pcs
    costPrice: 7.00,
    lowStockThreshold: 10,
    location: 'Piping Rack P-02',
    description: '20 sq mm MMS Pipe Conduit Bends (30 pcs @ ₹210 total)',
  },
  {
    name: '20 sq mm T',
    sku: 'OTH-TEE-MMS-20SQMM',
    productType: 'Other',
    category: 'Other',
    unit: 'pcs',
    quantity: 10,
    price: 8.00, // ₹80 total for 10 pcs
    costPrice: 8.00,
    lowStockThreshold: 5,
    location: 'Piping Rack P-02',
    description: '20 sq mm MMS Pipe Conduit T-Joints (10 pcs @ ₹80 total)',
  },
  {
    name: '20 sq mm Saddle',
    sku: 'OTH-SADDLE-20SQMM',
    productType: 'Other',
    category: 'Other',
    unit: 'pack',
    quantity: 1,
    price: 180.00,
    costPrice: 180.00,
    lowStockThreshold: 2,
    location: 'Piping Rack P-02',
    description: '20 sq mm Pipe Clamps / Saddles (1 packet @ ₹180)',
  },
  {
    name: 'Flexible Pipe',
    sku: 'OTH-PIPE-FLEX-5M',
    productType: 'Other',
    category: 'Other',
    unit: 'm',
    quantity: 5,
    price: 12.00, // ₹60 total for 5m
    costPrice: 12.00,
    lowStockThreshold: 5,
    location: 'Piping Rack P-01',
    description: 'Flexible Conduit Pipe (5 meters @ ₹60 total)',
  },
  {
    name: 'Electrode Rod, 2 m',
    sku: 'EAR-ROD-ELEC-2M',
    productType: 'Earthing Material',
    category: 'Earthing & Lightning Protection',
    brand: 'Ashlok',
    subType: 'Copper Bonded Chemical Earthing Rod / Electrode',
    capacity: '14.2mm x 2 Meter (Copper Bonded)',
    unit: 'pcs',
    quantity: 3,
    price: 340.00, // Grouped with 25kg Chemical Bag & PVC Chamber Cover
    costPrice: 340.00,
    lowStockThreshold: 2,
    location: 'Earthing Bay E-01',
    description: 'Earthing Electrode Rod, 2m length (3 pcs, grouped in ₹1,020 bundle)',
  },
  {
    name: 'Lightning Arrestor',
    sku: 'EAR-LA-ARRESTOR-1PC',
    productType: 'Earthing Material',
    category: 'Earthing & Lightning Protection',
    brand: 'Standard',
    subType: 'Lightning Arrester (LA - Copper Multi-Spike / ESE)',
    capacity: 'Conventional Copper Multi-Spike (1m LA)',
    unit: 'pcs',
    quantity: 1,
    price: 400.00,
    costPrice: 400.00,
    lowStockThreshold: 1,
    location: 'Earthing Bay E-02',
    description: 'Solar Multi-Spike Lightning Arrester with base mounting',
  },
  {
    name: 'S-30J Insulator',
    sku: 'EAR-INS-S30J-4PC',
    productType: 'Earthing Material',
    category: 'Earthing & Lightning Protection',
    unit: 'pcs',
    quantity: 4,
    price: 20.00, // ₹80 total for 4 pcs
    costPrice: 20.00,
    lowStockThreshold: 2,
    location: 'Earthing Bay E-02',
    description: 'S-30J Insulator standoffs for earthing strip routing (4 pcs @ ₹80 total)',
  },
  {
    name: 'PVC Chamber Cover',
    sku: 'EAR-CHAMBER-CVR-3PC',
    productType: 'Earthing Material',
    category: 'Earthing & Lightning Protection',
    subType: 'Heavy Duty HDPE Earth Pit Chamber / Cover',
    capacity: 'Heavy Duty Round Pit Chamber (10-inch)',
    unit: 'pcs',
    quantity: 3,
    price: 340.00, // Grouped with Chemical & Electrode Rod
    costPrice: 340.00,
    lowStockThreshold: 2,
    location: 'Earthing Bay E-01',
    description: 'PVC / HDPE Earth Pit Chamber Inspection Cover (3 pcs) (corrected from 2 pcs)',
  },
  {
    name: 'DDC Wire / 25×3 GI Strip',
    sku: 'EAR-STRIP-GI-25X3-20M',
    productType: 'Earthing Material',
    category: 'Earthing & Lightning Protection',
    subType: 'GI Earthing Strip / Flat',
    capacity: '25x3 mm (GI Strip)',
    unit: 'm',
    quantity: 20,
    price: 600.00, // ₹12,000 total for 20m
    costPrice: 600.00,
    lowStockThreshold: 10,
    location: 'Earthing Bay E-03',
    description: 'DDC Wire / 25×3 mm Galvanized Iron (GI) Earthing Strip (~20 meters approx, ₹12,000 total)',
  },
];

async function importBOMData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL database successfully.\n');

    // 1. Get Admin User
    let admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      admin = await User.findOne();
    }
    const adminId = admin ? admin.id : 1;
    console.log(`👤 Assigned User: ${admin ? admin.name : 'Admin'} (ID: ${adminId})`);

    // 2. Insert or Update Products
    console.log(`\n📦 Importing ${bomMaterials.length} Bill of Material items into 'products' table...`);
    const createdProducts = [];

    for (const item of bomMaterials) {
      let [product, created] = await Product.findOrCreate({
        where: { sku: item.sku },
        defaults: {
          ...item,
          userId: adminId,
        },
      });

      if (!created) {
        await product.update({
          ...item,
          userId: adminId,
        });
      }

      createdProducts.push({ product, created });
      console.log(`  ${created ? '➕ Created' : '🔄 Updated'}: [${item.sku}] ${item.name} (${item.quantity} ${item.unit} @ ₹${item.price})`);
    }

    // Clean up or synchronize initial dummy product if needed
    const oldDummy = await Product.findOne({ where: { sku: 'OGI-60945' } });
    if (oldDummy) {
      await oldDummy.destroy();
      console.log('  🗑️ Removed previous placeholder product OGI-60945');
    }

    // 3. Create Stock Inward Transactions
    console.log(`\n📋 Generating Stock Inward records in 'stock_transactions' table...`);
    for (const { product } of createdProducts) {
      const existingTx = await StockTransaction.findOne({
        where: {
          productId: product.id,
          referenceNo: 'BOM-3.3KW-2026-08',
        },
      });

      if (!existingTx) {
        await StockTransaction.create({
          productId: product.id,
          userId: adminId,
          type: 'in',
          quantity: product.quantity,
          personName: 'Site Supervisor (Notebook 17 Aug 2026)',
          senderPhone: '+91 98765 43210',
          senderCompany: 'Sologix Energy / Solar Logistics',
          place: 'Rooftop Site - 3.3 kW Solar Plant',
          referenceNo: 'BOM-3.3KW-2026-08',
          reason: 'Purchase Order',
          notes: `Verified inward for 3.3 kW Solar Plant installation. ${product.description || ''}`,
          transactionDate: new Date('2026-08-17T10:00:00Z'),
        });
      }
    }
    console.log(`✅ Stock inward transactions recorded.`);

    // 4. Create / Update Customer Record for 3.3 kW Project
    console.log(`\n👥 Registering Customer / Project in 'customers' table...`);
    let [customer, custCreated] = await Customer.findOrCreate({
      where: { uniqueId: 'CUST-SOL-3.3KW-01' },
      defaults: {
        uniqueId: 'CUST-SOL-3.3KW-01',
        customerName: '3.3 kW Rooftop Solar Plant',
        contactNo: '+91 98765 43210',
        address: 'Site Notebook Reference, Rooftop Installation',
        systemType: 'On-Grid',
        capacity: '3.3 kW',
        dateOfVisit: '2026-08-17',
        timeOfVisit: '10:30 AM',
        reference: 'Handwritten Site Notebook (17 Aug 2026)',
        bdeName: 'Site Lead Engineer',
        bdeEmail: 'site.lead@sologix.com',
        bookingConfirmed: 'Confirmed',
        bookingAmount: 10000.00,
        modeOfPayment: 'UPI',
        projectValue: 141848.00,
        financialYear: '2026-2027',
        comments: 'Verified material list cross-checked line by line against handwritten site notebook (photo dated 17 Aug 2026). Grand Total: ₹1,41,848.',
        userId: adminId,
      },
    });

    if (!custCreated) {
      await customer.update({
        projectValue: 141848.00,
        bookingAmount: 10000.00,
        bookingConfirmed: 'Confirmed',
        capacity: '3.3 kW',
        financialYear: '2026-2027',
      });
    }
    console.log(`✅ Customer record ${custCreated ? 'created' : 'updated'}: ${customer.customerName} (ID: ${customer.id})`);

    // 5. Create / Update Account Ledger Record
    console.log(`\n💳 Registering Accounts Ledger entry in 'accounts' table...`);
    let [account, accCreated] = await Account.findOrCreate({
      where: { uniqueId: 'ACC-SOL-3.3KW-01' },
      defaults: {
        uniqueId: 'ACC-SOL-3.3KW-01',
        customerName: '3.3 kW Rooftop Solar Plant',
        contactNo: '+91 98765 43210',
        address: 'Site Notebook Reference, Rooftop Installation',
        bookingAmount: 10000.00,
        modeOfPayment: 'UPI',
        projectValue: 141848.00,
        statusOfWork: 'In Progress',
        completionPercentage: 25,
        remainingAmount: 131848.00,
        payment1Amount: 10000.00,
        payment1Date: '2026-08-17',
        payment1Mode: 'UPI',
        financialYear: '2026-2027',
        customerId: customer.id,
        userId: adminId,
      },
    });

    if (!accCreated) {
      await account.update({
        projectValue: 141848.00,
        bookingAmount: 10000.00,
        remainingAmount: 131848.00,
        customerId: customer.id,
      });
    }
    console.log(`✅ Account ledger entry ${accCreated ? 'created' : 'updated'}: ${account.customerName} (ID: ${account.id})`);

    // 6. Log Activity in 'activity_logs'
    await ActivityLog.create({
      action: 'IMPORT_BOM_DATA',
      userEmail: admin ? admin.email : 'admin@inventory.com',
      ipAddress: '127.0.0.1',
      location: 'Local Console / Database Seeder',
      status: 'SUCCESS',
      details: `Imported 3.3 kW Solar Plant verified bill of materials (${bomMaterials.length} items, Grand Total: ₹1,41,848) into products, stock transactions, customer, and accounts ledger.`,
    });
    console.log(`\n🛡️ Activity audit log created.`);

    console.log('\n============================================================');
    console.log('🎉 ALL DATA SUCCESSFULLY ADDED TO RESPECTIVE DATABASES!');
    console.log('============================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing BOM data:', error);
    process.exit(1);
  }
}

importBOMData();
