export const APP_NAME = 'Inventory Pro';

export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
};

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
  'MSB',
  'MCB',
  'Wires',
  'Structure',
  'Consumable',
  'Spare',
  'Other',
];

export const CATEGORIES = [
  'Inverters',
  'Solar Panels & Modules',
  'Electrical Switchgear & MSB',
  'Circuit Breakers & MCB',
  'Cables & Wiring',
  'Mounting Structure & Hardware',
  'Installation Consumables',
  'Maintenance Spares & Components',
  'Batteries & Energy Storage',
  'Monitoring & Sensors',
  'Safety & Protection Equipment',
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

