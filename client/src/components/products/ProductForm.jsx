import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import BarcodeScannerModal from '../common/BarcodeScannerModal';
import {
  CATEGORIES,
  PRODUCT_TYPES,
  UNITS_OF_MEASURE,
  INVERTER_BRANDS,
  INVERTER_CAPACITIES_1PHASE,
  INVERTER_CAPACITIES_3PHASE,
  PANEL_BRANDS,
  PANEL_CAPACITIES,
  DCR_TYPES,
  CONSUMABLE_TYPES,
  NUT_BOLT_TYPES,
  TAPE_COLORS,
  CHEMICAL_TYPES,
  SPARE_REASONS,
  MCB_BRANDS,
  MCB_AMPERES,
  MCB_PHASES,
  ACDB_BRANDS,
  ACDB_CAPACITIES,
  ACDB_PHASES,
  ACDB_ENCLOSURES,
  DCDB_BRANDS,
  DCDB_STRINGS,
  DCDB_VOLTAGES,
  DCDB_ENCLOSURES,
  EARTHING_TYPES,
  EARTHING_SPECS,
  EARTHING_BRANDS,
  BATTERY_TYPES,
  BATTERY_BRANDS,
  BATTERY_CAPACITIES,
  BATTERY_VOLTAGES,
  getAutoPhase,
} from '../../utils/constants';
import {
  FiHash,
  FiTag,
  FiBox,
  FiZap,
  FiLayers,
  FiCamera,
  FiPlus,
  FiX,
  FiCpu,
  FiSun,
  FiTool,
  FiUser,
  FiPhone,
  FiMapPin,
  FiHelpCircle,
  FiCheck,
  FiSliders,
  FiPackage,
} from 'react-icons/fi';
import { LuIndianRupee } from 'react-icons/lu';
import toast from 'react-hot-toast';

const ProductForm = ({ initialData = {}, onSubmit, loading = false, isEdit = false }) => {
  const [formData, setFormData] = useState({
    sku: '',
    productType: PRODUCT_TYPES[0],
    name: '',
    category: CATEGORIES[0],
    brand: 'Growatt',
    capacity: '5 kW',
    phase: '1-Phase',
    dcrType: 'DCR',
    subType: 'Nut & Bolt (Type 1)',
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    senderCompany: '',
    senderReason: SPARE_REASONS[0],
    serialNumbers: [],
    location: '',
    unit: 'pcs (Pieces)',
    price: '',
    costPrice: '',
    quantity: 0,
    lowStockThreshold: 5,
    description: '',
    ...initialData,
  });

  const [errors, setErrors] = useState({});
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [newSerialInput, setNewSerialInput] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [customCapacity, setCustomCapacity] = useState('');
  const [consumableGroup, setConsumableGroup] = useState('Nut & Bolt');
  const [selectedTapeColor, setSelectedTapeColor] = useState('Red');

  // Custom Category & Product Type feature
  const [isCustomType, setIsCustomType] = useState(false);
  const [customTypeName, setCustomTypeName] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const isInverter =
    formData.productType === 'Ongrid Inverter' ||
    formData.productType === 'Hybrid Inverter';

  const isModule = formData.productType === 'Panels';
  const isBattery = formData.productType === 'Battery';
  const isMCB = formData.productType === 'MCB';
  const isACDB = formData.productType === 'ACDB';
  const isDCDB = formData.productType === 'DCDB';
  const isEarthing = formData.productType === 'Earthing Material';
  const isConsumable = formData.productType === 'Consumable';
  const isSpare = formData.productType === 'Spare';

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const isCustomT = initialData.productType && !PRODUCT_TYPES.includes(initialData.productType);
      const isCustomC = initialData.category && !CATEGORIES.includes(initialData.category);

      setIsCustomType(Boolean(isCustomT));
      if (isCustomT) setCustomTypeName(initialData.productType);

      setIsCustomCategory(Boolean(isCustomC));
      if (isCustomC) setCustomCategoryName(initialData.category);

      setFormData((prev) => ({
        ...prev,
        ...initialData,
        unit: initialData.unit || 'pcs (Pieces)',
        productType: initialData.productType || PRODUCT_TYPES[0],
        dcrType: initialData.dcrType || 'DCR',
        subType: initialData.subType || '',
        senderName: initialData.senderName || '',
        senderPhone: initialData.senderPhone || '',
        senderAddress: initialData.senderAddress || '',
        senderCompany: initialData.senderCompany || '',
        senderReason: initialData.senderReason || SPARE_REASONS[0],
        serialNumbers: Array.isArray(initialData.serialNumbers)
          ? initialData.serialNumbers
          : typeof initialData.serialNumbers === 'string'
          ? JSON.parse(initialData.serialNumbers || '[]')
          : [],
      }));

      if (initialData.subType) {
        if (initialData.subType.toLowerCase().includes('tape')) {
          setConsumableGroup('Insulation Tape');
          const foundColor = TAPE_COLORS.find((c) =>
            initialData.subType.toLowerCase().includes(c.name.toLowerCase())
          );
          if (foundColor) setSelectedTapeColor(foundColor.name);
        } else if (initialData.subType.toLowerCase().includes('chemical') || initialData.subType.toLowerCase().includes('spray')) {
          setConsumableGroup('Chemical / Compound');
        } else if (initialData.subType.toLowerCase().includes('nut') || initialData.subType.toLowerCase().includes('bolt')) {
          setConsumableGroup('Nut & Bolt');
        }
      }
    }
  }, [initialData]);

  // Adjust defaults when user switches productType
  const handleProductTypeChange = (e) => {
    const newType = e.target.value;
    if (newType === '__custom__') {
      setIsCustomType(true);
      return;
    }

    setIsCustomType(false);
    if (newType === 'Panels') {
      setFormData((prev) => ({
        ...prev,
        productType: newType,
        category: 'Solar Panels & Modules',
        brand: prev.brand && PANEL_BRANDS.includes(prev.brand) ? prev.brand : 'Rayzon',
        capacity: prev.capacity && PANEL_CAPACITIES.includes(prev.capacity) ? prev.capacity : '550 W',
        dcrType: prev.dcrType || 'DCR',
        unit: 'pcs (Pieces)',
      }));
    } else if (newType === 'Battery') {
      setFormData((prev) => ({
        ...prev,
        productType: newType,
        category: 'Batteries & Energy Storage',
        brand: prev.brand && BATTERY_BRANDS.includes(prev.brand) ? prev.brand : 'Dyness',
        capacity: prev.capacity && BATTERY_CAPACITIES.includes(prev.capacity) ? prev.capacity : '5.12 kWh',
        subType: prev.subType && BATTERY_TYPES.includes(prev.subType) ? prev.subType : 'Lithium-ion (LiFePO4)',
        phase: prev.phase && BATTERY_VOLTAGES.includes(prev.phase) ? prev.phase : '48V',
        unit: 'pcs (Pieces)',
      }));
    } else if (newType === 'ACDB') {
      setFormData((prev) => ({
        ...prev,
        productType: newType,
        category: 'ACDB & Distribution Boxes',
        brand: prev.brand && ACDB_BRANDS.includes(prev.brand) ? prev.brand : 'Schneider Electric',
        capacity: prev.capacity && ACDB_CAPACITIES.includes(prev.capacity) ? prev.capacity : '1-Phase 1kW - 5kW (32A)',
        phase: prev.phase && ACDB_PHASES.includes(prev.phase) ? prev.phase : '1-Phase (Single Phase AC)',
        subType: prev.subType && ACDB_ENCLOSURES.includes(prev.subType) ? prev.subType : 'IP65 Weatherproof Polycarbonate',
        unit: 'pcs (Pieces)',
      }));
    } else if (newType === 'DCDB') {
      setFormData((prev) => ({
        ...prev,
        productType: newType,
        category: 'DCDB & Array Junction Boxes',
        brand: prev.brand && DCDB_BRANDS.includes(prev.brand) ? prev.brand : 'Hensel',
        capacity: prev.capacity && DCDB_STRINGS.includes(prev.capacity) ? prev.capacity : '1 In 1 Out (1 String)',
        phase: prev.phase && DCDB_VOLTAGES.includes(prev.phase) ? prev.phase : '1000V DC (1 kV)',
        subType: prev.subType && DCDB_ENCLOSURES.includes(prev.subType) ? prev.subType : 'IP65 UV Resistant Polycarbonate',
        unit: 'pcs (Pieces)',
      }));
    } else if (newType === 'Earthing Material') {
      setFormData((prev) => ({
        ...prev,
        productType: newType,
        category: 'Earthing & Lightning Protection',
        brand: prev.brand && EARTHING_BRANDS.includes(prev.brand) ? prev.brand : 'Ashlok',
        subType: prev.subType && EARTHING_TYPES.includes(prev.subType) ? prev.subType : 'Copper Bonded Chemical Earthing Rod / Electrode',
        capacity: prev.capacity && EARTHING_SPECS.includes(prev.capacity) ? prev.capacity : '14.2mm x 3 Meter (Copper Bonded)',
        unit: 'pcs (Pieces)',
      }));
    } else if (newType === 'Ongrid Inverter' || newType === 'Hybrid Inverter') {
      setFormData((prev) => ({
        ...prev,
        productType: newType,
        category: 'Inverters',
        brand: prev.brand && INVERTER_BRANDS.includes(prev.brand) ? prev.brand : 'Growatt',
        capacity: prev.capacity && prev.capacity.includes('kW') ? prev.capacity : '5 kW',
        phase: prev.phase || '1-Phase',
        unit: 'pcs (Pieces)',
      }));
    } else if (newType === 'Consumable') {
      setFormData((prev) => ({
        ...prev,
        productType: newType,
        category: 'Installation Consumables',
        subType: 'Nut & Bolt (Type 1)',
        unit: 'pcs (Pieces)',
      }));
      setConsumableGroup('Nut & Bolt');
    } else if (newType === 'MCB') {
      setFormData((prev) => ({
        ...prev,
        productType: newType,
        category: 'Circuit Breakers & MCB',
        brand: prev.brand && MCB_BRANDS.includes(prev.brand) ? prev.brand : 'Schneider Electric',
        capacity: prev.capacity && MCB_AMPERES.includes(prev.capacity) ? prev.capacity : '32A',
        phase: prev.phase && MCB_PHASES.includes(prev.phase) ? prev.phase : '2-Phase (2P / Double Pole)',
        unit: 'pcs (Pieces)',
      }));
    } else if (newType === 'Spare') {
      setFormData((prev) => ({
        ...prev,
        productType: newType,
        category: 'Maintenance Spares & Components',
        senderReason: prev.senderReason || SPARE_REASONS[0],
        unit: 'pcs (Pieces)',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        productType: newType,
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'capacity' && isInverter) {
      const detectedPhase = getAutoPhase(value);
      setFormData((prev) => ({
        ...prev,
        capacity: value,
        phase: detectedPhase,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBrandSelect = (e) => {
    const selected = e.target.value;
    if (selected === 'Other') {
      setFormData((prev) => ({ ...prev, brand: customBrand || 'Other' }));
    } else {
      setFormData((prev) => ({ ...prev, brand: selected }));
    }
  };

  const handleCapacitySelect = (e) => {
    const selected = e.target.value;
    if (selected === 'Other') {
      setFormData((prev) => ({ ...prev, capacity: customCapacity || 'Other' }));
    } else if (isInverter) {
      const autoPhase = getAutoPhase(selected);
      setFormData((prev) => ({
        ...prev,
        capacity: selected,
        phase: autoPhase,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        capacity: selected,
      }));
    }
  };

  // Consumable Handlers
  const handleConsumableGroupChange = (group) => {
    setConsumableGroup(group);
    if (group === 'Nut & Bolt') {
      setFormData((prev) => ({
        ...prev,
        subType: 'Nut & Bolt (Type 1)',
        unit: 'pcs (Pieces)',
      }));
    } else if (group === 'Insulation Tape') {
      setFormData((prev) => ({
        ...prev,
        subType: `Electrical Insulation Tape (${selectedTapeColor})`,
        unit: 'roll (Rolls)',
      }));
    } else if (group === 'Chemical / Compound') {
      setFormData((prev) => ({
        ...prev,
        subType: CHEMICAL_TYPES[0],
        unit: 'kg (Kilograms)',
      }));
    }
  };

  const handleTapeColorSelect = (colorName) => {
    setSelectedTapeColor(colorName);
    setFormData((prev) => ({
      ...prev,
      subType: `Electrical Insulation Tape (${colorName})`,
      unit: 'roll (Rolls)',
    }));
  };

  const getPrefix = (type = '') => {
    if (isCustomType && customTypeName.trim()) {
      const letters = customTypeName.trim().toUpperCase().replace(/[^A-Z]/g, '');
      return (letters.substring(0, 3) || 'PRD').padEnd(3, 'X');
    }
    const map = {
      'Ongrid Inverter': 'OGI',
      'Hybrid Inverter': 'HYB',
      'Panels': 'PNL',
      'Battery': 'BAT',
      'ACDB': 'ACD',
      'DCDB': 'DCD',
      'Earthing Material': 'ETH',
      'MSB': 'MSB',
      'MCB': 'MCB',
      'Wires': 'WIR',
      'Structure': 'STR',
      'Consumable': 'CON',
      'Spare': 'SPR',
    };
    return map[type] || type.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'PRD';
  };

  const handleGenerateSKU = () => {
    const prefix = getPrefix(isCustomType ? customTypeName : formData.productType);
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const newSku = `${prefix}-${randomNum}`;
    setFormData((prev) => ({ ...prev, sku: newSku }));
    if (errors.sku) {
      setErrors((prev) => ({ ...prev, sku: '' }));
    }
  };

  const handleSuggestName = () => {
    if (isBattery) {
      const brand = formData.brand || 'Dyness';
      const bType = formData.subType || 'Lithium-ion (LiFePO4)';
      const cap = formData.capacity || '5.12 kWh';
      const volt = formData.phase || '48V';
      const generated = `${brand} ${cap} ${volt} ${bType} Battery`;
      setFormData((prev) => ({ ...prev, name: generated }));
      toast.success('Battery product name auto-generated');
    } else if (isACDB) {
      const brand = formData.brand || 'Schneider Electric';
      const rating = formData.capacity || '1-Phase 1kW - 5kW (32A)';
      const phase = formData.phase || '1-Phase';
      const enc = formData.subType ? ` (${formData.subType})` : '';
      const generated = `${brand} ${rating} ${phase} AC Distribution Box (ACDB)${enc}`;
      setFormData((prev) => ({ ...prev, name: generated }));
      toast.success('ACDB product name auto-formatted');
    } else if (isDCDB) {
      const brand = formData.brand || 'Hensel';
      const strings = formData.capacity || '1 In 1 Out (1 String)';
      const volt = formData.phase || '1000V DC';
      const enc = formData.subType ? ` (${formData.subType})` : '';
      const generated = `${brand} ${strings} ${volt} Solar DC Distribution Box (DCDB)${enc}`;
      setFormData((prev) => ({ ...prev, name: generated }));
      toast.success('DCDB product name auto-formatted');
    } else if (isEarthing) {
      const brand = formData.brand || 'Ashlok';
      const eType = formData.subType || 'Chemical Earthing Rod / Electrode';
      const spec = formData.capacity || '14.2mm x 3m';
      const generated = `${brand} ${eType} - ${spec}`;
      setFormData((prev) => ({ ...prev, name: generated }));
      toast.success('Earthing Material name auto-formatted');
    } else if (isMCB) {
      const brand = formData.brand || 'Schneider Electric';
      const ampere = formData.capacity || '32A';
      const phase = formData.phase || '2-Phase (2P / Double Pole)';
      const generated = `${brand} ${ampere} ${phase} Miniature Circuit Breaker`;
      setFormData((prev) => ({ ...prev, name: generated }));
      toast.success('MCB product name auto-formatted');
    } else if (isModule) {
      const brand = formData.brand || 'Solar';
      const cap = formData.capacity || '550 W';
      const dcr = formData.dcrType || 'DCR';
      const generated = `${brand} ${cap} ${dcr} Solar Module (Bifacial Mono-PERC)`;
      setFormData((prev) => ({ ...prev, name: generated }));
      toast.success('Module name auto-generated');
    } else if (isInverter) {
      const brand = formData.brand || 'Solar';
      const capacity = formData.capacity || '5 kW';
      const phase = formData.phase || '1-Phase';
      const type = formData.productType || 'Inverter';
      const generated = `${brand} ${capacity} ${phase} ${type}`;
      setFormData((prev) => ({ ...prev, name: generated }));
      toast.success('Inverter name auto-generated');
    } else if (isConsumable) {
      if (consumableGroup === 'Nut & Bolt') {
        const generated = formData.subType || 'Nut & Bolt (Type 1)';
        setFormData((prev) => ({ ...prev, name: generated }));
      } else if (consumableGroup === 'Insulation Tape') {
        const generated = `Electrical Insulation PVC Tape - ${selectedTapeColor} Color`;
        setFormData((prev) => ({ ...prev, name: generated }));
      } else if (consumableGroup === 'Chemical / Compound') {
        const generated = formData.subType || 'Solar Earthing / Maintenance Chemical';
        setFormData((prev) => ({ ...prev, name: generated }));
      }
      toast.success('Consumable name auto-generated');
    } else if (isSpare) {
      const brand = formData.brand ? `${formData.brand} ` : '';
      const partName = formData.name || 'Component';
      const sender = formData.senderName ? ` (From: ${formData.senderName})` : '';
      const generated = `${brand}${partName} Spare${sender}`;
      setFormData((prev) => ({ ...prev, name: generated }));
      toast.success('Spare material name formatted');
    } else if (isCustomType && customTypeName.trim()) {
      const brand = formData.brand ? `${formData.brand} ` : '';
      const cap = formData.capacity ? ` ${formData.capacity}` : '';
      const generated = `${brand}${customTypeName.trim()}${cap}`;
      setFormData((prev) => ({ ...prev, name: generated }));
      toast.success(`${customTypeName} name auto-formatted`);
    }

    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  // Serial Number Handlers
  const handleAddDirectSerial = (e) => {
    if (e) e.preventDefault();
    if (!newSerialInput.trim()) return;

    const items = newSerialInput
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const currentList = formData.serialNumbers || [];
    const newItems = items.filter((item) => !currentList.includes(item));

    if (newItems.length > 0) {
      const updated = [...currentList, ...newItems];
      setFormData((prev) => ({
        ...prev,
        serialNumbers: updated,
        quantity: !isEdit ? Math.max(prev.quantity, updated.length) : prev.quantity,
      }));
      setNewSerialInput('');
      toast.success(`Added ${newItems.length} serial number(s)`);
    } else {
      toast('Serial number already in list', { icon: 'ℹ️' });
    }
  };

  const handleAddScannedSerials = (scanned) => {
    const currentList = formData.serialNumbers || [];
    const newItems = scanned.filter((item) => !currentList.includes(item));
    const updated = [...currentList, ...newItems];
    setFormData((prev) => ({
      ...prev,
      serialNumbers: updated,
      quantity: !isEdit ? Math.max(prev.quantity, updated.length) : prev.quantity,
    }));
    toast.success(`Scanner captured ${newItems.length} serials`);
  };

  const handleRemoveSerial = (indexToRemove) => {
    const updated = formData.serialNumbers.filter((_, idx) => idx !== indexToRemove);
    setFormData((prev) => ({
      ...prev,
      serialNumbers: updated,
      quantity: !isEdit && prev.quantity === prev.serialNumbers.length ? updated.length : prev.quantity,
    }));
  };

  const validate = () => {
    const newErrors = {};
    const effectiveType = isCustomType ? customTypeName.trim() : formData.productType?.trim();
    const effectiveCategory = isCustomCategory ? customCategoryName.trim() : formData.category?.trim();

    if (!formData.sku?.trim()) newErrors.sku = 'Unique ID / SKU is required';
    if (!effectiveType) newErrors.productType = 'Product Type is required';
    if (!formData.name?.trim()) newErrors.name = 'Product Name is required';
    if (!effectiveCategory) newErrors.category = 'Category is required';
    if (!isEdit && (formData.quantity === '' || isNaN(formData.quantity) || Number(formData.quantity) < 0)) {
      newErrors.quantity = 'Initial quantity must be 0 or greater';
    }
    if (
      formData.lowStockThreshold === '' ||
      isNaN(formData.lowStockThreshold) ||
      Number(formData.lowStockThreshold) < 0
    ) {
      newErrors.lowStockThreshold = 'Valid minimum threshold is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const cleanUnit = formData.unit.split(' ')[0] || formData.unit;
    const effectiveType = isCustomType ? (customTypeName.trim() || 'Custom Product') : formData.productType.trim();
    const effectiveCategory = isCustomCategory ? (customCategoryName.trim() || 'General') : formData.category.trim();

    onSubmit({
      ...formData,
      sku: formData.sku.trim(),
      name: formData.name.trim(),
      productType: effectiveType,
      category: effectiveCategory,
      brand: formData.brand ? formData.brand.trim() : null,
      capacity: formData.capacity ? formData.capacity.trim() : null,
      phase: isInverter && formData.phase ? formData.phase.trim() : null,
      dcrType: isModule && formData.dcrType ? formData.dcrType.trim() : null,
      subType: formData.subType ? formData.subType.trim() : null,
      senderName: formData.senderName ? formData.senderName.trim() : null,
      senderPhone: formData.senderPhone ? formData.senderPhone.trim() : null,
      senderAddress: formData.senderAddress ? formData.senderAddress.trim() : null,
      senderCompany: formData.senderCompany ? formData.senderCompany.trim() : null,
      senderReason: formData.senderReason ? formData.senderReason.trim() : null,
      serialNumbers: formData.serialNumbers || [],
      unit: cleanUnit,
      price: parseFloat(formData.price) || 0,
      costPrice: parseFloat(formData.costPrice) || 0,
      lowStockThreshold: parseInt(formData.lowStockThreshold, 10) || 5,
      ...(!isEdit ? { quantity: parseInt(formData.quantity, 10) || 0 } : {}),
    });
  };

  const sellingPrice = parseFloat(formData.price) || 0;
  const costPrice = parseFloat(formData.costPrice) || 0;
  const marginPercent =
    sellingPrice > 0 && costPrice > 0
      ? (((sellingPrice - costPrice) / sellingPrice) * 100).toFixed(1)
      : null;

  return (
    <form onSubmit={handleSubmit}>
      {/* SECTION 1: PRIMARY IDENTIFIERS (Unique ID, Product Type, Product Name) */}
      <div
        style={{
          background: 'var(--primary-bg)',
          border: '1px solid var(--primary-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            color: 'var(--primary-light)',
            fontWeight: 700,
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          <FiZap size={18} />
          <span>Core Product Identification (Required)</span>
        </div>

        <div className="form-grid">
          {/* 1. Unique ID / SKU */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                1. Unique Product ID / SKU <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateSKU}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-light)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(108, 92, 231, 0.1)',
                }}
              >
                <FiZap size={12} />
                Generate ID
              </button>
            </div>
            <Input
              name="sku"
              placeholder={
                isBattery
                  ? 'e.g. BAT-10482'
                  : isACDB
                  ? 'e.g. ACD-40291'
                  : isDCDB
                  ? 'e.g. DCD-78103'
                  : isEarthing
                  ? 'e.g. ETH-50124'
                  : isSpare
                  ? 'e.g. SPR-90012'
                  : isConsumable
                  ? 'e.g. CON-89102'
                  : isModule
                  ? 'e.g. PNL-55014'
                  : 'e.g. OGI-10024'
              }
              value={formData.sku}
              onChange={handleChange}
              error={errors.sku}
              required
            />
          </div>

          {/* 2. Product Type */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                2. Product Type <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomType(!isCustomType);
                  if (!isCustomType && !customTypeName) {
                    setCustomTypeName('');
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isCustomType ? 'var(--text-muted)' : 'var(--primary-light)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isCustomType ? 'rgba(255, 255, 255, 0.06)' : 'rgba(108, 92, 231, 0.1)',
                }}
              >
                {isCustomType ? '↩ Use Standard Types' : '➕ + New Custom Type'}
              </button>
            </div>

            {!isCustomType ? (
              <Input
                as="select"
                name="productType"
                value={formData.productType}
                onChange={handleProductTypeChange}
                error={errors.productType}
                required
              >
                {PRODUCT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
                <option value="__custom__">➕ + Add New / Custom Product Type...</option>
              </Input>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Input
                  placeholder="Type new custom product type (e.g. Transformer, Solar Street Light, Water Pump)..."
                  value={customTypeName}
                  onChange={(e) => {
                    setCustomTypeName(e.target.value);
                    if (errors.productType) setErrors((prev) => ({ ...prev, productType: '' }));
                  }}
                  error={errors.productType}
                  required
                  autoFocus
                />
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--primary-light)',
                    fontWeight: 600,
                    backgroundColor: 'rgba(108, 92, 231, 0.08)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(108, 92, 231, 0.2)',
                  }}
                >
                  ✨ <strong>Directory Ribbon:</strong> A separate tab for &quot;{customTypeName || 'this new type'}&quot; will automatically appear in the top bar!
                </div>
              </div>
            )}
          </div>

          {/* 3. Product Name */}
          <div className="full-width">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                3. Product Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              {(isBattery || isInverter || isModule || isMCB || isACDB || isDCDB || isEarthing || isConsumable || isSpare) && (
                <button
                  type="button"
                  onClick={handleSuggestName}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-light)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(108, 92, 231, 0.1)',
                  }}
                >
                  <FiZap size={12} />
                  Auto-Format Product Name
                </button>
              )}
            </div>
            <Input
              name="name"
              placeholder={
                isBattery
                  ? 'e.g. Dyness 5.12 kWh 48V 100Ah LiFePO4 Wall-Mounted Lithium Battery'
                  : isACDB
                  ? 'e.g. Schneider Electric 1-Phase 1kW - 5kW (32A) AC Distribution Box (IP65)'
                  : isDCDB
                  ? 'e.g. Hensel 2 In 2 Out 1000V DC Solar Distribution Box (DCDB)'
                  : isEarthing
                  ? 'e.g. Ashlok Copper Bonded Chemical Earthing Rod - 14.2mm x 3 Meter'
                  : isMCB
                  ? 'e.g. Schneider Electric 32A 2-Phase (2P) Miniature Circuit Breaker'
                  : isSpare
                  ? 'e.g. Deye 5kW Inverter Control Board / MPPT PCB (Spare Unit)'
                  : isConsumable
                  ? 'e.g. Electrical Insulation Tape - Red Color (10m Roll)'
                  : isModule
                  ? 'e.g. Rayzon 550W DCR Solar Module (Mono-PERC Bifacial)'
                  : isInverter
                  ? 'e.g. Deye 5kW 1-Phase Hybrid Inverter (SUN-5K-SG03LP1)'
                  : 'Enter product / item name'
              }
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
          </div>
        </div>
      </div>

      {/* SECTION 2A: SPARE MATERIAL & SENDER PARTICULARS (Company, Quantity, Sender Name, Phone, Address, Reason) */}
      {isSpare && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <FiTool size={18} color="var(--warning)" />
              <span>Spare Material & Sender Dossier</span>
            </div>

            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(255, 170, 0, 0.15)',
                color: 'var(--warning)',
                border: '1px solid var(--warning-border)',
                fontWeight: 700,
              }}
            >
              📦 Spare Replacement Item
            </span>
          </div>

          {/* Sub-section 1: Spare Brand & Specification */}
          <div className="form-grid" style={{ marginBottom: '16px' }}>
            <Input
              label="Spare Manufacturer / Company Name"
              name="brand"
              placeholder="e.g. Deye, Growatt, Solis, Microtek, Schneider"
              value={formData.brand || ''}
              onChange={handleChange}
              helperText="Brand / Manufacturer of the spare part"
            />

            <Input
              label="Storage / Shelf Bin Location"
              name="location"
              placeholder="e.g. Spare Parts Rack S-2 / Shelf 4"
              value={formData.location || ''}
              onChange={handleChange}
            />
          </div>

          {/* Sub-section 2: SENDER DETAILS (Person Name, Contact No, Address, Reason) */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
            }}
          >
            <h4
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FiUser size={14} color="var(--primary-light)" />
              Sender / Sender Person Particulars
            </h4>

            <div className="form-grid">
              <Input
                label="Name of Sender Person"
                name="senderName"
                placeholder="e.g. Rajesh Kumar (Service Engineer / Customer)"
                value={formData.senderName || ''}
                onChange={handleChange}
                icon={FiUser}
              />

              <Input
                label="Sender Contact Number"
                name="senderPhone"
                placeholder="e.g. +91 98765 43210"
                value={formData.senderPhone || ''}
                onChange={handleChange}
                icon={FiPhone}
              />

              <Input
                label="Sender Company / Vendor Name"
                name="senderCompany"
                placeholder="e.g. Solis Regional Service Center / Apex Tech"
                value={formData.senderCompany || ''}
                onChange={handleChange}
              />

              <Input
                as="select"
                label="Reason for Sending Spare Material"
                name="senderReason"
                value={formData.senderReason || SPARE_REASONS[0]}
                onChange={handleChange}
              >
                {SPARE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Input>

              <div className="full-width">
                <Input
                  label="Sender Address / Facility Location"
                  name="senderAddress"
                  placeholder="e.g. Plot 42, Electronics Industrial Area, Phase-2, New Delhi 110020"
                  value={formData.senderAddress || ''}
                  onChange={handleChange}
                  icon={FiMapPin}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2B: CONSUMABLE SPECIFICATIONS (Nut & Bolt Type 1/2, Tape in 4 Colors Red/Blue/Green/Black, Chemical) */}
      {isConsumable && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <FiTool size={18} color="var(--primary-light)" />
              <span>Consumable Item Classification</span>
            </div>

            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(108, 92, 231, 0.12)',
                color: 'var(--primary-light)',
                border: '1px solid var(--primary-border)',
                fontWeight: 700,
              }}
            >
              🛠️ {formData.subType || consumableGroup}
            </span>
          </div>

          {/* Consumable Category Selector (Nut & Bolt vs Tape vs Chemical) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '16px' }}>
            {CONSUMABLE_TYPES.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => handleConsumableGroupChange(group)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: consumableGroup === group ? '2px solid var(--primary-light)' : '1px solid var(--border)',
                  backgroundColor: consumableGroup === group ? 'var(--primary-bg)' : 'var(--surface)',
                  color: consumableGroup === group ? 'var(--primary-light)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span>{group}</span>
              </button>
            ))}
          </div>

          {/* 1. NUT & BOLT SPECIFIC SELECTOR (Type 1 / Type 2) */}
          {consumableGroup === 'Nut & Bolt' && (
            <div className="form-grid">
              <div>
                <Input
                  as="select"
                  label="Nut & Bolt Specification Type"
                  value={formData.subType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subType: e.target.value }))}
                  required
                >
                  {NUT_BOLT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Input>
              </div>

              <div>
                <Input
                  as="select"
                  label="Unit of Measurement"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                >
                  <option value="pcs (Pieces)">pcs (Pieces)</option>
                  <option value="kg (Kilograms)">kg (Kilograms)</option>
                  <option value="box (Boxes)">box (Boxes)</option>
                  <option value="set (Sets)">set (Sets)</option>
                </Input>
              </div>
            </div>
          )}

          {/* 2. TAPE 4-COLOR SELECTOR (Red, Blue, Green, Black) */}
          {consumableGroup === 'Insulation Tape' && (
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                Select Tape Color (Red, Blue, Green, Black):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                {TAPE_COLORS.map((color) => {
                  const isSelected = selectedTapeColor === color.name;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => handleTapeColorSelect(color.name)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--text-primary)' : '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <span
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: color.colorCode,
                          display: 'inline-block',
                          border: color.name === 'Black' ? '1px solid #555' : 'none',
                        }}
                      />
                      <span>{color.label}</span>
                      {isSelected && <FiCheck size={14} color="var(--success)" style={{ marginLeft: 'auto' }} />}
                    </button>
                  );
                })}
              </div>

              <div className="form-grid">
                <div>
                  <Input
                    label="Current Selected Tape"
                    value={formData.subType}
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <Input
                    as="select"
                    label="Unit of Measurement"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                  >
                    <option value="roll (Rolls)">roll (Rolls)</option>
                    <option value="box (Boxes)">box (Boxes)</option>
                    <option value="pack (Packs)">pack (Packs)</option>
                  </Input>
                </div>
              </div>
            </div>
          )}

          {/* 3. CHEMICAL SPECIFIC SELECTOR */}
          {consumableGroup === 'Chemical / Compound' && (
            <div className="form-grid">
              <div>
                <Input
                  as="select"
                  label="Chemical / Compound Type"
                  value={formData.subType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subType: e.target.value }))}
                  required
                >
                  {CHEMICAL_TYPES.map((chem) => (
                    <option key={chem} value={chem}>
                      {chem}
                    </option>
                  ))}
                </Input>
              </div>

              <div>
                <Input
                  as="select"
                  label="Unit of Measurement"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                >
                  <option value="kg (Kilograms)">kg (Kilograms / Bags)</option>
                  <option value="liters (L)">liters (Liters)</option>
                  <option value="can / bottle">can / bottle</option>
                  <option value="pcs (Pieces)">pcs (Pieces)</option>
                </Input>
              </div>
            </div>
          )}

          {/* 4. OTHER CONSUMABLES */}
          {consumableGroup === 'Other Consumable' && (
            <div className="form-grid">
              <div>
                <Input
                  label="Specify Consumable Item Type"
                  placeholder="e.g. Cable Ties, Heat Shrink Sleeve, MC4 Pin"
                  value={formData.subType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subType: e.target.value }))}
                />
              </div>
              <div>
                <Input
                  as="select"
                  label="Unit of Measurement"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                >
                  {UNITS_OF_MEASURE.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Input>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2C: SOLAR MODULE / PANEL SPECIFICATIONS (Rayzon, Adani, Tata, Renewary, Zun Solar + 550-625W + DCR/NSCR) */}
      {isModule && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <FiSun size={18} color="var(--warning)" />
              <span>Solar Module Specifications</span>
            </div>

            <span
              className="badge"
              style={{
                backgroundColor: formData.dcrType === 'DCR' ? 'rgba(0, 214, 143, 0.15)' : 'rgba(255, 170, 0, 0.15)',
                color: formData.dcrType === 'DCR' ? 'var(--success)' : 'var(--warning)',
                border: formData.dcrType === 'DCR' ? '1px solid var(--success-border)' : '1px solid var(--warning-border)',
                fontWeight: 800,
                padding: '4px 12px',
                fontSize: '0.8125rem',
              }}
            >
              ☀️ {formData.dcrType || 'DCR'} Compliance
            </span>
          </div>

          <div className="form-grid">
            <div>
              <Input
                as="select"
                label="Module Company / Brand Name"
                name="brand"
                value={PANEL_BRANDS.includes(formData.brand) ? formData.brand : 'Other'}
                onChange={handleBrandSelect}
                required
              >
                {PANEL_BRANDS.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </Input>

              {(!PANEL_BRANDS.includes(formData.brand) || formData.brand === 'Other') && (
                <div style={{ marginTop: '8px' }}>
                  <Input
                    placeholder="Enter manufacturer brand"
                    value={formData.brand === 'Other' ? customBrand : formData.brand}
                    onChange={(e) => {
                      setCustomBrand(e.target.value);
                      setFormData((prev) => ({ ...prev, brand: e.target.value }));
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <Input
                as="select"
                label="Wattage Capacity (Wp)"
                name="capacity"
                value={PANEL_CAPACITIES.includes(formData.capacity) ? formData.capacity : '550 W'}
                onChange={handleCapacitySelect}
                required
              >
                {PANEL_CAPACITIES.map((c) => (
                  <option key={c} value={c}>
                    {c} (Watts)
                  </option>
                ))}
              </Input>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Cell Compliance (DCR / NSCR) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, dcrType: 'DCR' }))}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: formData.dcrType === 'DCR' ? '2px solid var(--success)' : '1px solid var(--border)',
                    backgroundColor: formData.dcrType === 'DCR' ? 'var(--success-bg)' : 'var(--surface)',
                    color: formData.dcrType === 'DCR' ? 'var(--success)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <FiCheck size={14} />
                  DCR
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, dcrType: 'NSCR' }))}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: formData.dcrType === 'NSCR' ? '2px solid var(--warning)' : '1px solid var(--border)',
                    backgroundColor: formData.dcrType === 'NSCR' ? 'var(--warning-bg)' : 'var(--surface)',
                    color: formData.dcrType === 'NSCR' ? 'var(--warning)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <FiCheck size={14} />
                  NSCR (Non-DCR)
                </button>
              </div>
            </div>

            <div>
              <Input
                label="Warehouse / Pallet Location"
                name="location"
                placeholder="e.g. Pallet Yard 2 / Rack P-4"
                value={formData.location || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2C-2: MCB SPECIFICATIONS (Company / Brand, Current Rating in Amperes, 1/2/4 Phase Poles) */}
      {isMCB && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <FiSliders size={18} color="var(--primary-light)" />
              <span>MCB (Miniature Circuit Breaker) Specifications</span>
            </div>

            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(108, 92, 231, 0.12)',
                color: 'var(--primary-light)',
                border: '1px solid var(--primary-border)',
                fontWeight: 800,
                padding: '4px 12px',
                fontSize: '0.8125rem',
              }}
            >
              ⚡ {formData.brand || 'MCB'} • {formData.capacity || '32A'} • {formData.phase || '2-Phase'}
            </span>
          </div>

          <div className="form-grid">
            {/* 1. MCB Company / Brand Name */}
            <div>
              <Input
                as="select"
                label="MCB Company / Brand Name"
                name="brand"
                value={MCB_BRANDS.includes(formData.brand) ? formData.brand : 'Other'}
                onChange={handleBrandSelect}
                required
              >
                {MCB_BRANDS.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </Input>

              {(!MCB_BRANDS.includes(formData.brand) || formData.brand === 'Other') && (
                <div style={{ marginTop: '8px' }}>
                  <Input
                    placeholder="Enter MCB manufacturer / company name"
                    value={formData.brand === 'Other' ? customBrand : formData.brand}
                    onChange={(e) => {
                      setCustomBrand(e.target.value);
                      setFormData((prev) => ({ ...prev, brand: e.target.value }));
                    }}
                  />
                </div>
              )}
            </div>

            {/* 2. MCB Current Rating / Amperage (A) */}
            <div>
              <Input
                as="select"
                label="Current Rating (Amperes / A)"
                name="capacity"
                value={MCB_AMPERES.includes(formData.capacity) ? formData.capacity : 'Other'}
                onChange={handleCapacitySelect}
                required
              >
                {MCB_AMPERES.map((amp) => (
                  <option key={amp} value={amp}>
                    {amp} Rating
                  </option>
                ))}
                <option value="Other">Other / Custom Ampere</option>
              </Input>

              {(!MCB_AMPERES.includes(formData.capacity) || formData.capacity === 'Other') && (
                <div style={{ marginTop: '8px' }}>
                  <Input
                    placeholder="e.g. 160A or 200A"
                    value={formData.capacity === 'Other' ? customCapacity : formData.capacity}
                    onChange={(e) => {
                      setCustomCapacity(e.target.value);
                      setFormData((prev) => ({ ...prev, capacity: e.target.value }));
                    }}
                  />
                </div>
              )}
            </div>

            {/* 3. Number of Phase / Poles (1 / 2 / 4 Phase) */}
            <div>
              <Input
                as="select"
                label="Number of Phase / Poles (1 / 2 / 4 Phase)"
                name="phase"
                value={formData.phase || '2-Phase (2P / Double Pole)'}
                onChange={handleChange}
                required
              >
                {MCB_PHASES.map((ph) => (
                  <option key={ph} value={ph}>
                    {ph}
                  </option>
                ))}
              </Input>
            </div>

            {/* 4. Bin / Shelf Location */}
            <div>
              <Input
                label="Storage Bin / Panel Location"
                name="location"
                placeholder="e.g. Electrical Rack E-3 / Bin 12"
                value={formData.location || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2C-3: ACDB (AC Distribution Box) SPECIFICATIONS */}
      {isACDB && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <FiSliders size={18} color="var(--primary-light)" />
              <span>AC Distribution Box (ACDB) Specifications</span>
            </div>

            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(108, 92, 231, 0.12)',
                color: 'var(--primary-light)',
                border: '1px solid var(--primary-border)',
                fontWeight: 800,
                padding: '4px 12px',
                fontSize: '0.8125rem',
              }}
            >
              ⚡ ACDB • {formData.capacity || '1-Phase 1-5kW'} • {formData.phase || '1-Phase'}
            </span>
          </div>

          <div className="form-grid">
            {/* 1. Brand */}
            <div>
              <Input
                as="select"
                label="ACDB Company / Manufacturer"
                name="brand"
                value={ACDB_BRANDS.includes(formData.brand) ? formData.brand : 'Other'}
                onChange={handleBrandSelect}
                required
              >
                {ACDB_BRANDS.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </Input>

              {(!ACDB_BRANDS.includes(formData.brand) || formData.brand === 'Other') && (
                <div style={{ marginTop: '8px' }}>
                  <Input
                    placeholder="Enter ACDB manufacturer / brand"
                    value={formData.brand === 'Other' ? customBrand : formData.brand}
                    onChange={(e) => {
                      setCustomBrand(e.target.value);
                      setFormData((prev) => ({ ...prev, brand: e.target.value }));
                    }}
                  />
                </div>
              )}
            </div>

            {/* 2. Rating / Capacity */}
            <div>
              <Input
                as="select"
                label="ACDB Rating / Inverter Capacity"
                name="capacity"
                value={ACDB_CAPACITIES.includes(formData.capacity) ? formData.capacity : 'Other Rating'}
                onChange={handleCapacitySelect}
                required
              >
                {ACDB_CAPACITIES.map((cap) => (
                  <option key={cap} value={cap}>
                    {cap}
                  </option>
                ))}
              </Input>

              {(!ACDB_CAPACITIES.includes(formData.capacity) || formData.capacity === 'Other Rating') && (
                <div style={{ marginTop: '8px' }}>
                  <Input
                    placeholder="e.g. 3-Phase 100kW (250A MCCB)"
                    value={formData.capacity === 'Other Rating' ? customCapacity : formData.capacity}
                    onChange={(e) => {
                      setCustomCapacity(e.target.value);
                      setFormData((prev) => ({ ...prev, capacity: e.target.value }));
                    }}
                  />
                </div>
              )}
            </div>

            {/* 3. Phase */}
            <div>
              <Input
                as="select"
                label="Electrical Phase"
                name="phase"
                value={formData.phase || ACDB_PHASES[0]}
                onChange={handleChange}
                required
              >
                {ACDB_PHASES.map((ph) => (
                  <option key={ph} value={ph}>
                    {ph}
                  </option>
                ))}
              </Input>
            </div>

            {/* 4. Enclosure */}
            <div>
              <Input
                as="select"
                label="Enclosure / Ingress Protection"
                name="subType"
                value={formData.subType || ACDB_ENCLOSURES[0]}
                onChange={handleChange}
              >
                {ACDB_ENCLOSURES.map((enc) => (
                  <option key={enc} value={enc}>
                    {enc}
                  </option>
                ))}
              </Input>
            </div>

            {/* 5. Location */}
            <div>
              <Input
                label="Warehouse Bay / Rack Location"
                name="location"
                placeholder="e.g. Electrical Bay A-2 / Shelf 1"
                value={formData.location || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2C-4: DCDB (DC Distribution Box) SPECIFICATIONS */}
      {isDCDB && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <FiSun size={18} color="var(--warning)" />
              <span>DC Distribution Box (DCDB) Specifications</span>
            </div>

            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(255, 170, 0, 0.15)',
                color: 'var(--warning)',
                border: '1px solid var(--warning-border)',
                fontWeight: 800,
                padding: '4px 12px',
                fontSize: '0.8125rem',
              }}
            >
              ☀️ DCDB • {formData.capacity || '1 In 1 Out'} • {formData.phase || '1000V DC'}
            </span>
          </div>

          <div className="form-grid">
            {/* 1. Brand */}
            <div>
              <Input
                as="select"
                label="DCDB Manufacturer / Brand"
                name="brand"
                value={DCDB_BRANDS.includes(formData.brand) ? formData.brand : 'Other'}
                onChange={handleBrandSelect}
                required
              >
                {DCDB_BRANDS.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </Input>

              {(!DCDB_BRANDS.includes(formData.brand) || formData.brand === 'Other') && (
                <div style={{ marginTop: '8px' }}>
                  <Input
                    placeholder="Enter DCDB brand / assembler"
                    value={formData.brand === 'Other' ? customBrand : formData.brand}
                    onChange={(e) => {
                      setCustomBrand(e.target.value);
                      setFormData((prev) => ({ ...prev, brand: e.target.value }));
                    }}
                  />
                </div>
              )}
            </div>

            {/* 2. String Configuration */}
            <div>
              <Input
                as="select"
                label="Array String Configuration"
                name="capacity"
                value={DCDB_STRINGS.includes(formData.capacity) ? formData.capacity : 'Other String Config'}
                onChange={handleCapacitySelect}
                required
              >
                {DCDB_STRINGS.map((str) => (
                  <option key={str} value={str}>
                    {str}
                  </option>
                ))}
              </Input>

              {(!DCDB_STRINGS.includes(formData.capacity) || formData.capacity === 'Other String Config') && (
                <div style={{ marginTop: '8px' }}>
                  <Input
                    placeholder="e.g. 10 In 10 Out (10 String)"
                    value={formData.capacity === 'Other String Config' ? customCapacity : formData.capacity}
                    onChange={(e) => {
                      setCustomCapacity(e.target.value);
                      setFormData((prev) => ({ ...prev, capacity: e.target.value }));
                    }}
                  />
                </div>
              )}
            </div>

            {/* 3. Voltage Rating */}
            <div>
              <Input
                as="select"
                label="DC Voltage Rating"
                name="phase"
                value={formData.phase || DCDB_VOLTAGES[1]}
                onChange={handleChange}
                required
              >
                {DCDB_VOLTAGES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Input>
            </div>

            {/* 4. Enclosure */}
            <div>
              <Input
                as="select"
                label="Enclosure Box Type"
                name="subType"
                value={formData.subType || DCDB_ENCLOSURES[0]}
                onChange={handleChange}
              >
                {DCDB_ENCLOSURES.map((enc) => (
                  <option key={enc} value={enc}>
                    {enc}
                  </option>
                ))}
              </Input>
            </div>

            {/* 5. Location */}
            <div>
              <Input
                label="Storage Location"
                name="location"
                placeholder="e.g. DCDB Yard / Shelf D-1"
                value={formData.location || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2C-5: EARTHING MATERIAL SPECIFICATIONS */}
      {isEarthing && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <FiZap size={18} color="var(--success)" />
              <span>Earthing Material & Lightning Protection</span>
            </div>

            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(0, 214, 143, 0.12)',
                color: 'var(--success)',
                border: '1px solid var(--success-border)',
                fontWeight: 800,
                padding: '4px 12px',
                fontSize: '0.8125rem',
              }}
            >
              🛡️ {formData.subType || 'Earthing Item'}
            </span>
          </div>

          <div className="form-grid">
            {/* 1. Item Classification */}
            <div className="full-width">
              <Input
                as="select"
                label="Earthing Item Classification"
                name="subType"
                value={formData.subType || EARTHING_TYPES[0]}
                onChange={handleChange}
                required
              >
                {EARTHING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Input>
            </div>

            {/* 2. Specification / Dimensions */}
            <div>
              <Input
                as="select"
                label="Size / Dimension / Weight Specification"
                name="capacity"
                value={EARTHING_SPECS.includes(formData.capacity) ? formData.capacity : 'Other Size / Specification'}
                onChange={handleCapacitySelect}
                required
              >
                {EARTHING_SPECS.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </Input>

              {(!EARTHING_SPECS.includes(formData.capacity) || formData.capacity === 'Other Size / Specification') && (
                <div style={{ marginTop: '8px' }}>
                  <Input
                    placeholder="Enter custom dimensions / rating"
                    value={formData.capacity === 'Other Size / Specification' ? customCapacity : formData.capacity}
                    onChange={(e) => {
                      setCustomCapacity(e.target.value);
                      setFormData((prev) => ({ ...prev, capacity: e.target.value }));
                    }}
                  />
                </div>
              )}
            </div>

            {/* 3. Brand / Make */}
            <div>
              <Input
                as="select"
                label="Brand / Manufacturer"
                name="brand"
                value={EARTHING_BRANDS.includes(formData.brand) ? formData.brand : 'Other'}
                onChange={handleBrandSelect}
                required
              >
                {EARTHING_BRANDS.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </Input>

              {(!EARTHING_BRANDS.includes(formData.brand) || formData.brand === 'Other') && (
                <div style={{ marginTop: '8px' }}>
                  <Input
                    placeholder="Enter manufacturer / supplier"
                    value={formData.brand === 'Other' ? customBrand : formData.brand}
                    onChange={(e) => {
                      setCustomBrand(e.target.value);
                      setFormData((prev) => ({ ...prev, brand: e.target.value }));
                    }}
                  />
                </div>
              )}
            </div>

            {/* 4. Unit */}
            <div>
              <Input
                as="select"
                label="Unit of Measurement"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
              >
                {UNITS_OF_MEASURE.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Input>
            </div>

            {/* 5. Location */}
            <div>
              <Input
                label="Storage Yard / Shed Location"
                name="location"
                placeholder="e.g. Ground Yard Bay G-1 / Rack 5"
                value={formData.location || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2D: INVERTER SPECIFICATIONS (Deye, Solis, Growatt, Microtek + 1-Phase / 3-Phase) */}
      {isInverter && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <FiCpu size={18} color="var(--primary-light)" />
              <span>Inverter Model Specifications</span>
            </div>

            <span
              className="badge"
              style={{
                backgroundColor: formData.phase === '3-Phase' ? 'rgba(0, 214, 143, 0.15)' : 'rgba(108, 92, 231, 0.15)',
                color: formData.phase === '3-Phase' ? 'var(--success)' : 'var(--primary-light)',
                border: formData.phase === '3-Phase' ? '1px solid var(--success-border)' : '1px solid var(--primary-border)',
                fontWeight: 700,
                padding: '4px 10px',
                fontSize: '0.8rem',
              }}
            >
              ⚡ {formData.phase === '3-Phase' ? '3-Phase (Three Phase)' : '1-Phase (Single Phase)'}
            </span>
          </div>

          <div className="form-grid">
            <div>
              <Input
                as="select"
                label="Company / Brand Name"
                name="brand"
                value={INVERTER_BRANDS.includes(formData.brand) ? formData.brand : 'Other'}
                onChange={handleBrandSelect}
                required
              >
                {INVERTER_BRANDS.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </Input>

              {(!INVERTER_BRANDS.includes(formData.brand) || formData.brand === 'Other') && (
                <div style={{ marginTop: '8px' }}>
                  <Input
                    placeholder="Enter custom manufacturer brand"
                    value={formData.brand === 'Other' ? customBrand : formData.brand}
                    onChange={(e) => {
                      setCustomBrand(e.target.value);
                      setFormData((prev) => ({ ...prev, brand: e.target.value }));
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <Input
                as="select"
                label="Capacity Rating (kW)"
                name="capacity"
                value={formData.capacity}
                onChange={handleCapacitySelect}
                helperText="Auto-assigns 1-Phase (2-6kW) or 3-Phase (10-100kW)"
                required
              >
                <optgroup label="1-Phase Ratings (Single Phase)">
                  {INVERTER_CAPACITIES_1PHASE.map((c) => (
                    <option key={c} value={c}>
                      {c} (1-Phase)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="3-Phase Ratings (Three Phase)">
                  {INVERTER_CAPACITIES_3PHASE.map((c) => (
                    <option key={c} value={c}>
                      {c} (3-Phase)
                    </option>
                  ))}
                </optgroup>
              </Input>
            </div>

            <div>
              <Input
                as="select"
                label="AC Electrical Phase"
                name="phase"
                value={formData.phase || '1-Phase'}
                onChange={handleChange}
                required
              >
                <option value="1-Phase">1-Phase (Single Phase • 230V)</option>
                <option value="3-Phase">3-Phase (Three Phase • 415V)</option>
              </Input>
            </div>

            <div>
              <Input
                label="Warehouse / Bay Location"
                name="location"
                placeholder="e.g. Inverter Rack A-1 / Bay 3"
                value={formData.location || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: SERIAL NUMBER MANAGER & BARCODE SCANNER */}
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginBottom: '24px',
          backgroundColor: 'var(--surface)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '2px',
              }}
            >
              <FiCamera size={16} color="var(--primary-light)" />
              Unit Serial Numbers ({formData.serialNumbers?.length || 0} Registered)
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Scan barcodes with camera or enter serial numbers directly
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={FiCamera}
            onClick={() => setIsScannerOpen(true)}
          >
            Scan Barcode / QR
          </Button>
        </div>

        {/* Direct Manual Entry Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <div style={{ flex: 1 }}>
            <Input
              placeholder="Type Serial Number (e.g. SN-ITEM-98214) or paste multiple separated by commas..."
              value={newSerialInput}
              onChange={(e) => setNewSerialInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddDirectSerial();
                }
              }}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            icon={FiPlus}
            onClick={handleAddDirectSerial}
          >
            Add SN
          </Button>
        </div>

        {/* Serial Numbers Badge Container */}
        {formData.serialNumbers && formData.serialNumbers.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              maxHeight: '160px',
              overflowY: 'auto',
              padding: '10px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}
          >
            {formData.serialNumbers.map((sn, idx) => (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-hover)',
                  color: 'var(--text-primary)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <FiZap size={12} color="var(--primary-light)" />
                <span>{sn}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSerial(idx)}
                  title="Remove this serial number"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 2px',
                  }}
                >
                  <FiX size={14} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border)',
              color: 'var(--text-muted)',
              fontSize: '0.8125rem',
            }}
          >
            No individual serial numbers added yet. Use camera scan or direct input above.
          </div>
        )}
      </div>

      {/* SECTION 4: CATEGORIZATION & GENERAL (If not Inverter, Module, Consumable, or Spare) */}
      {!isInverter && !isModule && !isConsumable && !isSpare && (
        <div style={{ marginBottom: '24px' }}>
          <h3
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FiTag size={16} />
            Categorization & Details
          </h3>

          <div className="form-grid">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Category <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isCustomCategory ? 'var(--text-muted)' : 'var(--primary-light)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isCustomCategory ? 'rgba(255, 255, 255, 0.06)' : 'rgba(108, 92, 231, 0.1)',
                  }}
                >
                  {isCustomCategory ? '↩ Use Standard' : '➕ + Custom Category'}
                </button>
              </div>

              {!isCustomCategory ? (
                <Input
                  as="select"
                  name="category"
                  value={formData.category}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomCategory(true);
                      return;
                    }
                    handleChange(e);
                  }}
                  error={errors.category}
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__custom__">➕ + Add New / Custom Category...</option>
                </Input>
              ) : (
                <Input
                  placeholder="Enter custom category name..."
                  value={customCategoryName}
                  onChange={(e) => {
                    setCustomCategoryName(e.target.value);
                    if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                  }}
                  error={errors.category}
                  required
                  autoFocus
                />
              )}
            </div>

            <Input
              label="Brand / Manufacturer"
              name="brand"
              placeholder="e.g. Polycab, Schneider, ABB"
              value={formData.brand || ''}
              onChange={handleChange}
            />

            <Input
              label="Warehouse / Storage Location"
              name="location"
              placeholder="e.g. Aisle 3, Shelf B, Bin 12"
              value={formData.location || ''}
              onChange={handleChange}
            />

            <Input
              as="select"
              label="Unit of Measurement (UOM)"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
            >
              {UNITS_OF_MEASURE.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Input>
          </div>
        </div>
      )}

      {/* SECTION 5: INVENTORY & STOCK CONTROLS */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FiPackage size={16} />
            Inventory & Stock Threshold Controls
          </h3>
        </div>

        <div className="form-grid">

          {!isEdit && (
            <Input
              label="Initial Stock Quantity"
              name="quantity"
              type="number"
              placeholder="0"
              value={formData.quantity}
              onChange={handleChange}
              error={errors.quantity}
              helperText={
                formData.serialNumbers?.length > 0
                  ? `Synced with ${formData.serialNumbers.length} registered serial numbers`
                  : 'Total initial stock count'
              }
              required
            />
          )}

          <Input
            label="Low Stock Alert Threshold"
            name="lowStockThreshold"
            type="number"
            placeholder="5"
            value={formData.lowStockThreshold}
            onChange={handleChange}
            error={errors.lowStockThreshold}
            helperText="Trigger warning when stock falls below this quantity"
            required
          />
        </div>
      </div>

      {/* SECTION 6: SPECIFICATIONS & DESCRIPTION */}
      <div style={{ marginBottom: '24px' }}>
        <h3
          style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FiLayers size={16} />
          Specifications & Technical Notes
        </h3>

        <div className="full-width">
          <Input
            as="textarea"
            label="Product Description / Specs / Notes"
            name="description"
            placeholder="Technical details, defect diagnosis, warranty reference number, site origins..."
            value={formData.description || ''}
            onChange={handleChange}
            rows={3}
          />
        </div>
      </div>

      <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <Button type="submit" variant="primary" size="lg" loading={loading}>
          {isEdit ? 'Update Product Details' : 'Register New Product'}
        </Button>
      </div>

      {/* Barcode / QR Camera & Gun Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAddSerials={handleAddScannedSerials}
        existingSerials={formData.serialNumbers || []}
        title={`Scan ${isSpare ? 'Spare Part' : isConsumable ? 'Consumable' : isModule ? 'Module' : isInverter ? 'Inverter' : 'Product'} Serial / Barcode`}
      />
    </form>
  );
};

export default ProductForm;
