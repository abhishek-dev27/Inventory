export const APP_NAME = 'Inventory Pro';

export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
};

export const SYSTEM_MODULES = [
  { id: 'dashboard', label: 'Executive Dashboard', icon: 'FiGrid', description: 'Real-time overview, stock metrics & movements' },
  { id: 'products', label: 'Products Catalog', icon: 'FiBox', description: 'Product list, SKU details, and low-stock alerts' },
  { id: 'stock_in', label: 'Stock In (Inward)', icon: 'FiArrowDownLeft', description: 'Inward entry vouchers & serial tracking' },
  { id: 'stock_out', label: 'Stock Out (Dispatch)', icon: 'FiArrowUpRight', description: 'Site dispatches & outward voucher generation' },
  { id: 'stock_history', label: 'Stock History & Passbook', icon: 'FiClock', description: 'Transaction audit log & passbook vouchers' },
  { id: 'customers', label: 'Customers & BD Tracker', icon: 'FiUsers', description: 'Lead pipeline, project capacities, and BD site visits' },
  { id: 'accounts', label: 'Accounts & Financial Ledger', icon: 'FiCreditCard', description: '5-stage milestone payments & collection balances' },
  { id: 'reports', label: 'Reports & Analytics', icon: 'FiBarChart2', description: 'Executive daily/monthly stock & commercial reports' },
];

export const MODULE_PRESETS = {
  INVENTORY_ONLY: {
    name: 'Warehouse / Inventory Staff',
    description: 'Permitted strictly for Dashboard, Products, Stock In, Stock Out, and Stock History',
    modules: ['dashboard', 'products', 'stock_in', 'stock_out', 'stock_history'],
  },
  FULL_STAFF: {
    name: 'Full Staff Access',
    description: 'Access to all operational modules including Customers, Accounts, and Reports',
    modules: ['dashboard', 'products', 'stock_in', 'stock_out', 'stock_history', 'customers', 'accounts', 'reports'],
  },
  ADMIN: {
    name: 'Full Administrator',
    description: 'Complete unrestricted access to all modules, User Management, and Activity Logs',
    modules: ['dashboard', 'products', 'stock_in', 'stock_out', 'stock_history', 'customers', 'accounts', 'reports', 'users', 'activity_logs'],
  },
};

export const GODOWN_LOCATIONS = [
  'Ranchi',
  'Jamshedpur',
  'Hazaribagh',
  'Patna',
  'Daltonganj',
];

export const ALL_LOCATIONS_OPTION = 'All Locations';

export const STOCK_TYPES = {
  IN: 'in',
  OUT: 'out',
};

export const STOCK_REASONS = {
  in: [
    'Purchase Order',
    'Supplier Delivery',
    'Return from Site',
    'Transfer In',
    'Production / Assembly',
    'Inventory Adjustment',
    'Other',
  ],
  out: [
    'Project Site Dispatch',
    'Customer Sale',
    'Damaged / Defective',
    'Maintenance Usage',
    'Transfer Out',
    'Expired / Obsolete',
    'Inventory Adjustment',
    'Other',
  ],
};

export const PRODUCT_TYPES = [
  'Ongrid Inverter',
  'Hybrid Inverter',
  'Panels',
  'Battery',
  'ACDB',
  'DCDB',
  'Earthing Material',
  'MSB',
  'MCB',
  'Wires',
  'Structure',
  'Consumable',
  'Spare',
  'Other',
];

export const TYPE_ICONS = {
  'Ongrid Inverter': '⚡',
  'Hybrid Inverter': '🔋',
  'Panels': '☀️',
  'Battery': '🔋',
  'ACDB': '⚡',
  'DCDB': '☀️',
  'Earthing Material': '🛡️',
  'MSB': '🔌',
  'MCB': '⚡',
  'Wires': '🧵',
  'Structure': '🏗️',
  'Consumable': '🔩',
  'Spare': '🛠️',
  'Other': '📦',
};

export const CATEGORIES = [
  'Inverters',
  'Solar Panels & Modules',
  'ACDB & Distribution Boxes',
  'DCDB & Array Junction Boxes',
  'Earthing & Lightning Protection',
  'Batteries & Energy Storage',
  'Electrical Switchgear & MSB',
  'Circuit Breakers & MCB',
  'Cables & Wiring',
  'Mounting Structure & Hardware',
  'Installation Consumables',
  'Maintenance Spares & Components',
  'Monitoring & Sensors',
  'Safety & Protection Equipment',
  'Other',
];

// ACDB (AC Distribution Box) Constants
export const ACDB_BRANDS = [
  'Schneider Electric',
  'L&T',
  'Hensel',
  'Havells',
  'Elmex',
  'Standard',
  'Custom Assembly',
  'Other',
];

export const ACDB_CAPACITIES = [
  '1-Phase 1kW - 5kW (32A)',
  '3-Phase 5kW - 10kW (32A)',
  '3-Phase 15kW - 25kW (63A)',
  '3-Phase 30kW - 50kW (100A)',
  '3-Phase 60kW - 100kW (160A)',
  'Other Rating',
];

export const ACDB_PHASES = [
  '1-Phase (Single Phase AC)',
  '3-Phase (Three Phase AC)',
];

export const ACDB_ENCLOSURES = [
  'IP65 Weatherproof Polycarbonate',
  'FRP Weatherproof Enclosure',
  'Powder Coated CRCA Sheet Metal',
  'IP67 Outdoor Enclosure',
];

// DCDB (DC Distribution Box / Solar Array Junction Box) Constants
export const DCDB_BRANDS = [
  'Hensel',
  'Elmex',
  'Schneider Electric',
  'Suntree',
  'L&T',
  'Standard',
  'Custom Assembly',
  'Other',
];

export const DCDB_STRINGS = [
  '1 In 1 Out (1 String)',
  '2 In 2 Out (2 String)',
  '3 In 3 Out (3 String)',
  '4 In 4 Out (4 String)',
  '6 In 6 Out (6 String)',
  '8 In 8 Out (8 String)',
  'Other String Config',
];

export const DCDB_VOLTAGES = [
  '600V DC',
  '1000V DC (1 kV)',
  '1500V DC (1.5 kV)',
];

export const DCDB_ENCLOSURES = [
  'IP65 UV Resistant Polycarbonate',
  'FRP Weatherproof Enclosure',
  'IP67 Heavy-Duty Box',
];

// Earthing Material & Lightning Protection Constants
export const EARTHING_TYPES = [
  'Copper Bonded Chemical Earthing Rod / Electrode',
  'GI Pipe Chemical Earthing Electrode',
  'Conductive Earth Backfill Chemical (BFC / Compound)',
  'GI Earthing Strip / Flat',
  'Copper Earthing Strip / Tape',
  'Heavy Duty HDPE Earth Pit Chamber / Cover',
  'Lightning Arrester (LA - Copper Multi-Spike / ESE)',
  'Earthing Wire, Clamp & Accessories',
  'Other Earthing Material',
];

export const EARTHING_SPECS = [
  '14.2mm x 2 Meter (Copper Bonded)',
  '14.2mm x 3 Meter (Copper Bonded)',
  '17.2mm x 3 Meter (Copper Bonded)',
  '50mm x 2 Meter (GI Electrode)',
  '50mm x 3 Meter (GI Electrode)',
  '25 kg Bag (Backfill Chemical BFC)',
  '10 kg Bag (Backfill Chemical BFC)',
  '25x3 mm (GI Strip)',
  '25x6 mm (GI Strip)',
  '32x6 mm (GI Strip)',
  'Heavy Duty Round Pit Chamber (10-inch)',
  'Heavy Duty Square Pit Chamber',
  'Conventional Copper Multi-Spike (1m LA)',
  'ESE Early Streamer Lightning Arrester',
  'Other Size / Specification',
];

export const EARTHING_BRANDS = [
  'Ashlok',
  'True Power',
  'Capex',
  'LPI',
  'Erico / nVent',
  'Standard / ISI Mark',
  'Custom Make',
  'Other',
];

// MCB (Miniature Circuit Breaker) Constants
export const MCB_BRANDS = [
  'Schneider Electric',
  'Havells',
  'L&T',
  'Legrand',
  'ABB',
  'Siemens',
  'C&S Electric',
  'Polycab',
  'Anchor / Panasonic',
  'HPL',
  'Standard',
  'Other',
];

export const MCB_AMPERES = [
  '6A',
  '10A',
  '16A',
  '20A',
  '25A',
  '32A',
  '40A',
  '50A',
  '63A',
  '80A',
  '100A',
  '125A',
];

export const MCB_PHASES = [
  '1-Phase (1P / Single Pole)',
  '2-Phase (2P / Double Pole)',
  '4-Phase (4P / 4-Pole / TPN)',
];

// Inverter Brands / Company Names
export const INVERTER_BRANDS = [
  'Deye',
  'Solis',
  'Growatt',
  'Microtek',
  'Sungrow',
  'GoodWe',
  'Havells',
  'Luminous',
  'Polycab',
  'Fronius',
  'SMA',
  'Other',
];

// Solar Module / Panel Brands (Rayzon, Adani, Tata, Renewary, Zun Solar, etc.)
export const PANEL_BRANDS = [
  'Rayzon',
  'Adani',
  'Tata',
  'Renewary',
  'Zun Solar',
  'RenewSys',
  'Waaree',
  'Vikram Solar',
  'Goldi Solar',
  'Longi',
  'Trina Solar',
  'Canadian Solar',
  'JA Solar',
  'Other',
];

// Solar Module / Panel Capacities (550, 580, 590, 600, 610, 615, 620, 625 W, etc.)
export const PANEL_CAPACITIES = [
  '550 W',
  '580 W',
  '590 W',
  '600 W',
  '610 W',
  '615 W',
  '620 W',
  '625 W',
  '535 W',
  '540 W',
  '545 W',
  '575 W',
  '650 W',
  '700 W',
];

// Solar Panel Compliance / Cell Type (DCR vs Non-DCR / NSCR)
export const DCR_TYPES = [
  'DCR',
  'NSCR',
  'Non-DCR',
];

// Consumable Types & Sub-Classifications
export const CONSUMABLE_TYPES = [
  'Nut & Bolt',
  'Insulation Tape',
  'Chemical / Compound',
  'Other Consumable',
];

export const NUT_BOLT_TYPES = [
  'Nut & Bolt (Type 1)',
  'Nut & Bolt (Type 2)',
  'SS304 Allen / Hex Bolts',
  'Galvanized GI Fasteners',
  'Custom Nut & Bolt',
];

export const TAPE_COLORS = [
  { name: 'Red', colorCode: '#ff4d4f', label: 'Red (🔴)' },
  { name: 'Blue', colorCode: '#1890ff', label: 'Blue (🔵)' },
  { name: 'Green', colorCode: '#52c41a', label: 'Green (🟢)' },
  { name: 'Black', colorCode: '#262626', label: 'Black (⚫)' },
  { name: 'Yellow', colorCode: '#faad14', label: 'Yellow (🟡)' },
  { name: 'Other', colorCode: '#8c8c8c', label: 'Other Color' },
];

export const CHEMICAL_TYPES = [
  'Earthing Compound Chemical',
  'Solar Panel Cleaning Chemical',
  'Anti-Rust / Zinc Cold Galvanizing Spray',
  'Silicone / PU Weatherproof Sealant',
  'Conductive Earth Compound (BFC / Marconite)',
  'Custom Chemical',
];

// Spare Material Inward & Warranty Reasons
export const SPARE_REASONS = [
  'Warranty Replacement (RMA)',
  'Service Center Repair / Testing',
  'Defective / Faulty Item Return',
  'Maintenance Buffer Stock',
  'Supplier Damage Replacement',
  'Site Return / Unused Spare',
  'Component Upgrade / Retrofit',
  'Other / Custom Reason',
];

// 1-Phase Inverter Capacities
export const INVERTER_CAPACITIES_1PHASE = [
  '2 kW',
  '3 kW',
  '3.3 kW',
  '3.6 kW',
  '5 kW',
  '6 kW',
];

// 3-Phase Inverter Capacities
export const INVERTER_CAPACITIES_3PHASE = [
  '8 kW',
  '10 kW',
  '12 kW',
  '15 kW',
  '20 kW',
  '25 kW',
  '30 kW',
  '50 kW',
  '60 kW',
  '80 kW',
  '100 kW',
  '125 kW',
];

export const ALL_INVERTER_CAPACITIES = [
  ...INVERTER_CAPACITIES_1PHASE,
  ...INVERTER_CAPACITIES_3PHASE,
];

/**
 * Determine phase from capacity string or number
 */
export const getAutoPhase = (capacityStr = '') => {
  if (!capacityStr) return '1-Phase';
  const num = parseFloat(capacityStr.replace(/[^\d.]/g, ''));
  if (isNaN(num)) return '1-Phase';

  if ([2, 3, 3.3, 3.6, 5, 6].includes(num) || num <= 6) {
    return '1-Phase';
  }
  return '3-Phase';
};

// Battery / Energy Storage Constants
export const BATTERY_TYPES = [
  'Lithium-ion (LiFePO4)',
  'Lithium Battery Pack',
  'Wall-Mounted Lithium ESS',
  'Rack-Mounted ESS',
  'High Voltage (HV) Lithium Battery',
  'Low Voltage (LV) Lithium Battery',
  'Tubular Lead-Acid Battery',
  'Solar Gel Battery',
  'All-in-One Energy Storage System (ESS)',
  'Other Battery',
];

export const BATTERY_BRANDS = [
  'Dyness',
  'Pylontech',
  'Deye',
  'Luminous',
  'Exide',
  'Amaron',
  'Livguard',
  'Eastman',
  'BYD',
  'Growatt',
  'Solis',
  'Tesla Powerwall',
  'Felicity Solar',
  'Okaya',
  'Tata Solar',
  'Microtek',
  'Other',
];

export const BATTERY_CAPACITIES = [
  '5.12 kWh',
  '10.24 kWh',
  '14.3 kWh',
  '15 kWh',
  '20 kWh',
  '100 Ah',
  '150 Ah',
  '200 Ah',
  '220 Ah',
  '250 Ah',
  '48V 100Ah (5.12 kWh)',
  '48V 200Ah (10.24 kWh)',
  '51.2V 100Ah (5.12 kWh)',
  '51.2V 200Ah (10.24 kWh)',
  '12V 150Ah',
  '12V 200Ah',
  '12V 220Ah',
  'Other',
];

export const BATTERY_VOLTAGES = [
  '12V',
  '24V',
  '48V',
  '51.2V',
  '96V (HV)',
  '192V (HV)',
  '384V (HV)',
  'High Voltage (HV)',
];

export const UNITS_OF_MEASURE = [
  'pcs (Pieces)',
  'units (Units)',
  'roll (Rolls)',
  'kg (Kilograms)',
  'set (Sets)',
  'box (Boxes)',
  'pack (Packs)',
  'm (Meters)',
  'kW (Kilowatts)',
  'W (Watts)',
  'pair (Pairs)',
  'liters (L)',
  'can / bottle',
];

export const ITEMS_PER_PAGE = 20;

