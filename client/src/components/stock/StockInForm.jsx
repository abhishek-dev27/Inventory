import React, { useState, useEffect, useRef } from 'react';
import {
  FiCamera,
  FiUser,
  FiMapPin,
  FiFileText,
  FiPhone,
  FiCheckCircle,
  FiZap,
  FiPlus,
  FiX,
  FiArrowDownLeft,
  FiLayers,
  FiTag,
  FiSearch,
  FiRefreshCw,
  FiSliders,
  FiShield,
  FiTruck,
  FiPackage,
  FiCalendar,
} from 'react-icons/fi';
import Input from '../common/Input';
import Button from '../common/Button';
import Modal from '../common/Modal';
import BarcodeScannerModal from '../common/BarcodeScannerModal';
import { STOCK_REASONS, SPARE_REASONS } from '../../utils/constants';
import {
  getFinancialYear,
  generateBillNumberForFY,
  getFinancialYearsList,
  formatDateTime,
} from '../../utils/formatDate';
import { stockService } from '../../services/stockService';
import toast from 'react-hot-toast';

const VENDOR_PRESETS = [
  'Deye Solar Service Hub',
  'Solis Technical HQ',
  'Growatt Repair Center',
  'Havells Warehouse Depot',
  'Adani Solar Plant',
  'Rayzon Logistics',
  'Tata Power Solar',
  'Luminous Service Center',
];

const StockInForm = ({
  products = [],
  onSubmit,
  loading = false,
  preSelectedProduct = null,
}) => {
  const initialDate = new Date().toISOString().slice(0, 16);
  const initialFY = getFinancialYear(initialDate);

  const [selectedFY, setSelectedFY] = useState(initialFY);
  const [inwardPrefix, setInwardPrefix] = useState('INW');
  const availableFinancialYears = getFinancialYearsList(6, 3);

  const [formData, setFormData] = useState({
    productId: preSelectedProduct?.id || '',
    quantity: '',
    reason: 'Purchase Order',
    personName: '',
    senderPhone: '',
    senderAddress: '',
    senderCompany: '',
    place: '',
    referenceNo: generateBillNumberForFY(initialFY, [], 'INW'),
    notes: '',
    serialNumbers: [],
    transactionDate: initialDate,
  });

  // Universal Senders & Vendors Directory State
  const [pastTransactions, setPastTransactions] = useState([]);
  const [allSendersDirectory, setAllSendersDirectory] = useState([]);
  const [showSenderDropdown, setShowSenderDropdown] = useState(false);
  const [isSenderModalOpen, setIsSenderModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalFilterTab, setModalFilterTab] = useState('all'); // all, in, out
  const senderDropdownRef = useRef(null);

  // Fetch past transactions & product records for unified sender directory
  useEffect(() => {
    const loadDirectoryData = async () => {
      try {
        const res = await stockService.getTransactions({ limit: 1000 });
        const txs = res.data || [];
        setPastTransactions(txs);

        const list = [];

        // 1. Inward & Outward Transactions
        txs.forEach((t) => {
          if (t.personName && t.personName.trim()) {
            list.push({
              name: t.personName.trim(),
              phone: t.senderPhone || '',
              company: t.senderCompany || '',
              address: t.senderAddress || '',
              place: t.place || '',
              type: t.type === 'in' ? 'Supplier / Inward Sender' : 'Project Client',
              rawType: t.type || 'in',
              reason: t.reason || '',
              date: t.transactionDate || t.createdAt,
            });
          }
        });

        // 2. Products table senders
        (products || []).forEach((p) => {
          if (p.senderName && p.senderName.trim()) {
            list.push({
              name: p.senderName.trim(),
              phone: p.senderPhone || '',
              company: p.senderCompany || '',
              address: p.senderAddress || p.location || '',
              place: p.location || '',
              type: 'Material Sender / Spare Vendor',
              rawType: 'in',
              reason: p.senderReason || 'Supplier Inward',
              date: p.createdAt,
            });
          }
        });

        // Deduplicate records
        const map = {};
        list.forEach((item) => {
          const key = `${item.name.toLowerCase()}:::${(item.company || '').toLowerCase()}`;
          if (!map[key]) {
            map[key] = { ...item, count: 1 };
          } else {
            map[key].count += 1;
            if (item.phone && !map[key].phone) map[key].phone = item.phone;
            if (item.company && !map[key].company) map[key].company = item.company;
            if (item.address && !map[key].address) map[key].address = item.address;
            if (item.place && !map[key].place) map[key].place = item.place;
          }
        });

        const combined = Object.values(map).sort((a, b) => b.count - a.count);
        setAllSendersDirectory(combined);

        // Update referenceNo with accurate sequence
        setFormData((prev) => ({
          ...prev,
          referenceNo: generateBillNumberForFY(selectedFY, txs, inwardPrefix),
        }));
      } catch (err) {
        console.error('Failed to load past transactions', err);
      }
    };
    loadDirectoryData();
  }, [products]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (senderDropdownRef.current && !senderDropdownRef.current.contains(e.target)) {
        setShowSenderDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFYChange = (newFY) => {
    setSelectedFY(newFY);
    const newRef = generateBillNumberForFY(newFY, pastTransactions, inwardPrefix);
    const dateFY = getFinancialYear(formData.transactionDate);
    let newDate = formData.transactionDate;
    if (dateFY !== newFY) {
      const startYear = newFY.split('-')[0];
      newDate = `${startYear}-04-01T10:00`;
    }
    setFormData((prev) => ({
      ...prev,
      referenceNo: newRef,
      transactionDate: newDate,
    }));
    toast.success(`Generated Inward sequence for FY ${newFY}`);
  };

  const handlePrefixChange = (newPrefix) => {
    setInwardPrefix(newPrefix);
    const newRef = generateBillNumberForFY(selectedFY, pastTransactions, newPrefix);
    setFormData((prev) => ({ ...prev, referenceNo: newRef }));
  };

  const handleSelectSender = (sender) => {
    setFormData((prev) => ({
      ...prev,
      personName: sender.name || prev.personName,
      senderPhone: sender.phone || prev.senderPhone,
      senderCompany: sender.company || prev.senderCompany,
      senderAddress: sender.address || prev.senderAddress,
      place: sender.place || prev.place,
      reason: sender.reason || prev.reason,
    }));
    setShowSenderDropdown(false);
    setIsSenderModalOpen(false);
    toast.success(`Selected sender: ${sender.name}`);
  };

  const filteredInlineSenders = allSendersDirectory.filter((s) => {
    const q = (formData.personName || '').toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.company && s.company.toLowerCase().includes(q)) ||
      (s.place && s.place.toLowerCase().includes(q))
    );
  });

  const filteredModalSenders = allSendersDirectory.filter((item) => {
    if (modalFilterTab === 'in' && item.rawType !== 'in') return false;
    if (modalFilterTab === 'out' && item.rawType !== 'out') return false;

    const term = modalSearchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      item.name.toLowerCase().includes(term) ||
      (item.company && item.company.toLowerCase().includes(term)) ||
      (item.place && item.place.toLowerCase().includes(term)) ||
      (item.address && item.address.toLowerCase().includes(term)) ||
      (item.phone && item.phone.toLowerCase().includes(term))
    );
  });

  const [selectedProd, setSelectedProd] = useState(preSelectedProduct || null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [newSerialInput, setNewSerialInput] = useState('');
  const [inwardCategoryTab, setInwardCategoryTab] = useState('all');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (preSelectedProduct) {
      setSelectedProd(preSelectedProduct);
      setFormData((prev) => ({
        ...prev,
        productId: preSelectedProduct.id,
        place: preSelectedProduct.location || '',
        senderName: preSelectedProduct.senderName || '',
        senderPhone: preSelectedProduct.senderPhone || '',
        senderCompany: preSelectedProduct.senderCompany || '',
        senderAddress: preSelectedProduct.senderAddress || '',
        reason: preSelectedProduct.senderReason || 'Purchase Order',
      }));
    }
  }, [preSelectedProduct]);

  const handleProductSelect = (e) => {
    const pId = parseInt(e.target.value, 10);
    const prod = products.find((p) => p.id === pId) || null;
    setSelectedProd(prod);
    setFormData((prev) => ({
      ...prev,
      productId: e.target.value,
      place: prod?.location || prev.place,
      personName: prod?.senderName || prev.personName,
      senderPhone: prod?.senderPhone || prev.senderPhone,
      senderCompany: prod?.senderCompany || prev.senderCompany,
      senderAddress: prod?.senderAddress || prev.senderAddress,
      reason: prod?.senderReason || (prod?.productType === 'Spare' ? 'Warranty Replacement (RMA)' : prev.reason),
    }));
    setErrors((prev) => ({ ...prev, productId: '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'transactionDate') {
        const fy = getFinancialYear(value);
        setSelectedFY(fy);
        updated.referenceNo = generateBillNumberForFY(fy, pastTransactions, inwardPrefix);
      }
      return updated;
    });
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleAddDirectSerial = () => {
    const trimmed = newSerialInput.trim();
    if (!trimmed) return;
    if (formData.serialNumbers.includes(trimmed)) {
      toast.error('Serial number already added in this batch');
      return;
    }
    const updated = [...formData.serialNumbers, trimmed];
    setFormData((prev) => ({
      ...prev,
      serialNumbers: updated,
      quantity: String(updated.length),
    }));
    setNewSerialInput('');
    toast.success(`Added serial: ${trimmed}`);
  };

  const handleAddScannedSerials = (scannedList) => {
    const unique = Array.from(new Set([...formData.serialNumbers, ...scannedList]));
    setFormData((prev) => ({
      ...prev,
      serialNumbers: unique,
      quantity: String(unique.length),
    }));
    toast.success(`Synced ${unique.length} serial number(s)`);
  };

  const handleRemoveSerial = (index) => {
    const updated = formData.serialNumbers.filter((_, idx) => idx !== index);
    setFormData((prev) => ({
      ...prev,
      serialNumbers: updated,
      quantity: updated.length > 0 ? String(updated.length) : prev.quantity,
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.productId) errs.productId = 'Please select a product';
    const qty = parseInt(formData.quantity, 10);
    if (!formData.quantity || isNaN(qty) || qty <= 0) {
      errs.quantity = 'Quantity must be at least 1';
    }
    if (!formData.reason) errs.reason = 'Please select a reason';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      productId: parseInt(formData.productId, 10),
      quantity: parseInt(formData.quantity, 10),
      personName: formData.personName.trim(),
      senderPhone: formData.senderPhone.trim(),
      senderAddress: formData.senderAddress.trim(),
      senderCompany: formData.senderCompany.trim(),
      place: formData.place.trim(),
      referenceNo: formData.referenceNo.trim(),
      serialNumbers: formData.serialNumbers || [],
      transactionDate: formData.transactionDate
        ? new Date(formData.transactionDate).toISOString()
        : new Date().toISOString(),
      reason: formData.reason,
      notes: formData.notes.trim(),
    });
  };

  const unit = selectedProd?.unit || 'pcs';
  const isSpare = selectedProd?.productType === 'Spare';

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. PRODUCT SELECTION & QUANTITY CARD */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: 'rgba(108, 92, 231, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-light)',
            }}
          >
            <FiLayers size={16} />
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            1. Material Identification & Quantity
          </h3>
        </div>

        {/* DEDICATED CATEGORY TABS (Single-Row Horizontal Scroll) */}
        <div style={{ marginBottom: '14px' }}>
          <label
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Filter Inward Material by Category Tab:
          </label>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginBottom: '10px',
            }}
          >
            {[
              {
                id: 'all',
                label: 'All Items',
              },
              {
                id: 'ongrid',
                label: '⚡ Ongrid Inverter',
                match: (p) => {
                  const type = (p.productType || '').toLowerCase();
                  const cat = (p.category || '').toLowerCase();
                  const name = (p.name || '').toLowerCase();
                  const sku = (p.sku || '').toUpperCase();
                  return (
                    type.includes('ongrid') ||
                    name.includes('ongrid') ||
                    (type.includes('inverter') && !type.includes('hybrid')) ||
                    sku.startsWith('OGI')
                  );
                },
              },
              {
                id: 'hybrid',
                label: '🔋 Hybrid Inverter',
                match: (p) => {
                  const type = (p.productType || '').toLowerCase();
                  const cat = (p.category || '').toLowerCase();
                  const name = (p.name || '').toLowerCase();
                  const sku = (p.sku || '').toUpperCase();
                  return (
                    type.includes('hybrid') ||
                    cat.includes('hybrid') ||
                    name.includes('hybrid') ||
                    sku.startsWith('HYB')
                  );
                },
              },
              {
                id: 'panels',
                label: '☀️ Panels',
                match: (p) => {
                  const type = (p.productType || '').toLowerCase();
                  const cat = (p.category || '').toLowerCase();
                  const name = (p.name || '').toLowerCase();
                  const sku = (p.sku || '').toUpperCase();
                  return (
                    type.includes('panel') ||
                    cat.includes('panel') ||
                    cat.includes('module') ||
                    name.includes('panel') ||
                    name.includes('module') ||
                    sku.startsWith('PNL')
                  );
                },
              },
              {
                id: 'batteries',
                label: '🔋 Battery',
                match: (p) => {
                  const type = (p.productType || '').toLowerCase();
                  const cat = (p.category || '').toLowerCase();
                  const name = (p.name || '').toLowerCase();
                  const sku = (p.sku || '').toUpperCase();
                  return (
                    type.includes('battery') ||
                    cat.includes('batter') ||
                    cat.includes('storage') ||
                    name.includes('battery') ||
                    name.includes('lifepo4') ||
                    name.includes('lithium') ||
                    name.includes('tubular') ||
                    sku.startsWith('BAT') ||
                    sku.startsWith('ESS') ||
                    sku.startsWith('LFP')
                  );
                },
              },
              {
                id: 'acdb',
                label: '⚡ ACDB',
                match: (p) => {
                  const type = (p.productType || '').toLowerCase();
                  const cat = (p.category || '').toLowerCase();
                  const name = (p.name || '').toLowerCase();
                  const sku = (p.sku || '').toUpperCase();
                  return (
                    type === 'acdb' ||
                    type.includes('acdb') ||
                    cat.includes('acdb') ||
                    name.includes('acdb') ||
                    name.includes('ac distribution') ||
                    sku.startsWith('ACD')
                  );
                },
              },
              {
                id: 'dcdb',
                label: '☀️ DCDB',
                match: (p) => {
                  const type = (p.productType || '').toLowerCase();
                  const cat = (p.category || '').toLowerCase();
                  const name = (p.name || '').toLowerCase();
                  const sku = (p.sku || '').toUpperCase();
                  return (
                    type === 'dcdb' ||
                    type.includes('dcdb') ||
                    cat.includes('dcdb') ||
                    name.includes('dcdb') ||
                    name.includes('array junction') ||
                    sku.startsWith('DCD')
                  );
                },
              },
              {
                id: 'earthing',
                label: '🛡️ Earthing Material',
                match: (p) => {
                  const type = (p.productType || '').toLowerCase();
                  const cat = (p.category || '').toLowerCase();
                  const name = (p.name || '').toLowerCase();
                  const sku = (p.sku || '').toUpperCase();
                  return (
                    type.includes('earthing') ||
                    cat.includes('earthing') ||
                    cat.includes('lightning') ||
                    name.includes('earthing') ||
                    name.includes('earth rod') ||
                    name.includes('chemical rod') ||
                    name.includes('lightning arrester') ||
                    sku.startsWith('ETH')
                  );
                },
              },
              {
                id: 'msb',
                label: '🔌 MSB',
                match: (p) => {
                  const type = (p.productType || '').toLowerCase();
                  const cat = (p.category || '').toLowerCase();
                  const name = (p.name || '').toLowerCase();
                  const sku = (p.sku || '').toUpperCase();
                  return (
                    type.includes('msb') ||
                    cat.includes('msb') ||
                    cat.includes('switchgear') ||
                    name.includes('msb') ||
                    sku.startsWith('MSB')
                  );
                },
              },
              {
                id: 'mcb',
                label: '⚡ MCB',
                match: (p) => {
                  const type = (p.productType || '').toLowerCase();
                  const cat = (p.category || '').toLowerCase();
                  const name = (p.name || '').toLowerCase();
                  const sku = (p.sku || '').toUpperCase();
                  return (
                    type === 'mcb' ||
                    type.includes('mcb') ||
                    cat.includes('mcb') ||
                    cat.includes('breaker') ||
                    name.includes('mcb') ||
                    name.includes('circuit breaker') ||
                    sku.startsWith('MCB')
                  );
                },
              },
              {
                id: 'wires',
                label: '🧵 Wires',
                match: (p) => {
                  const type = (p.productType || '').toLowerCase();
                  const cat = (p.category || '').toLowerCase();
                  const name = (p.name || '').toLowerCase();
                  const sku = (p.sku || '').toUpperCase();
                  return (
                    type.includes('wire') ||
                    cat.includes('cable') ||
                    cat.includes('wire') ||
                    name.includes('wire') ||
                    sku.startsWith('WIR')
                  );
                },
              },
              {
                id: 'structure',
                label: '🏗️ Structure',
                match: (p) => {
                  const type = (p.productType || '').toLowerCase();
                  const cat = (p.category || '').toLowerCase();
                  const name = (p.name || '').toLowerCase();
                  const sku = (p.sku || '').toUpperCase();
                  return (
                    type.includes('structure') ||
                    cat.includes('structure') ||
                    sku.startsWith('STR')
                  );
                },
              },
              {
                id: 'consumables',
                label: '🔩 Consumable',
                match: (p) => {
                  const type = (p.productType || '').toLowerCase();
                  const cat = (p.category || '').toLowerCase();
                  const name = (p.name || '').toLowerCase();
                  const sku = (p.sku || '').toUpperCase();
                  return (
                    type.includes('consumable') ||
                    cat.includes('consumable') ||
                    sku.startsWith('CON') ||
                    name.includes('nut') ||
                    name.includes('bolt') ||
                    name.includes('tape') ||
                    name.includes('chemical')
                  );
                },
              },
              {
                id: 'spares',
                label: '🛠️ Spare',
                match: (p) => {
                  const type = (p.productType || '').toLowerCase();
                  const cat = (p.category || '').toLowerCase();
                  const name = (p.name || '').toLowerCase();
                  const sku = (p.sku || '').toUpperCase();
                  return (
                    type.includes('spare') ||
                    cat.includes('spare') ||
                    sku.startsWith('SPR') ||
                    name.includes('spare')
                  );
                },
              },
              {
                id: 'other',
                label: '📦 Other',
                match: (p) => {
                  const type = (p.productType || '').toLowerCase();
                  const cat = (p.category || '').toLowerCase();
                  const name = (p.name || '').toLowerCase();
                  return type.includes('other') || cat.includes('other');
                },
              },
            ].map((tab) => {
              const isActive = (inwardCategoryTab || 'all') === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setInwardCategoryTab(tab.id);
                    // Reset selected product if not in this tab
                    if (tab.id !== 'all' && selectedProd && tab.match && !tab.match(selectedProd)) {
                      setFormData((prev) => ({ ...prev, productId: '' }));
                      setSelectedProd(null);
                    }
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: isActive ? 800 : 600,
                    border: isActive
                      ? '1px solid var(--primary-light)'
                      : '1px solid var(--border)',
                    backgroundColor: isActive ? 'var(--primary)' : 'var(--surface)',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all var(--transition-fast)',
                    boxShadow: isActive ? '0 2px 6px rgba(108, 92, 231, 0.25)' : 'none',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: '18px' }}>
          {(() => {
            const INWARD_TABS = [
              { id: 'inverters', match: (p) => (p.productType || '').toLowerCase().includes('inverter') || (p.category || '').toLowerCase().includes('inverter') || (p.name || '').toLowerCase().includes('inverter') || (p.sku || '').toUpperCase().startsWith('OGI') || (p.sku || '').toUpperCase().startsWith('HYB') },
              { id: 'panels', match: (p) => (p.productType || '').toLowerCase().includes('panel') || (p.category || '').toLowerCase().includes('panel') || (p.category || '').toLowerCase().includes('module') || (p.name || '').toLowerCase().includes('panel') || (p.sku || '').toUpperCase().startsWith('PNL') },
              { id: 'mcb', match: (p) => (p.productType || '').toLowerCase() === 'mcb' || (p.productType || '').toLowerCase().includes('mcb') || (p.category || '').toLowerCase().includes('mcb') || (p.category || '').toLowerCase().includes('breaker') || (p.name || '').toLowerCase().includes('mcb') || (p.sku || '').toUpperCase().startsWith('MCB') },
              { id: 'msb', match: (p) => (p.productType || '').toLowerCase().includes('msb') || (p.category || '').toLowerCase().includes('msb') || (p.category || '').toLowerCase().includes('switchgear') || (p.name || '').toLowerCase().includes('msb') || (p.sku || '').toUpperCase().startsWith('MSB') },
              { id: 'wires', match: (p) => (p.productType || '').toLowerCase().includes('wire') || (p.category || '').toLowerCase().includes('cable') || (p.category || '').toLowerCase().includes('wire') || (p.name || '').toLowerCase().includes('wire') || (p.sku || '').toUpperCase().startsWith('WIR') },
              { id: 'structure', match: (p) => (p.productType || '').toLowerCase().includes('structure') || (p.category || '').toLowerCase().includes('structure') || (p.sku || '').toUpperCase().startsWith('STR') },
              { id: 'consumables', match: (p) => (p.productType || '').toLowerCase().includes('consumable') || (p.category || '').toLowerCase().includes('consumable') || (p.sku || '').toUpperCase().startsWith('CON') || (p.name || '').toLowerCase().includes('nut') || (p.name || '').toLowerCase().includes('bolt') || (p.name || '').toLowerCase().includes('tape') || (p.name || '').toLowerCase().includes('chemical') },
              { id: 'batteries', match: (p) => (p.productType || '').toLowerCase().includes('battery') || (p.category || '').toLowerCase().includes('batter') || (p.category || '').toLowerCase().includes('storage') || (p.name || '').toLowerCase().includes('battery') || (p.name || '').toLowerCase().includes('lifepo4') || (p.name || '').toLowerCase().includes('lithium') || (p.name || '').toLowerCase().includes('tubular') || (p.sku || '').toUpperCase().startsWith('BAT') || (p.sku || '').toUpperCase().startsWith('ESS') || (p.sku || '').toUpperCase().startsWith('LFP') },
              { id: 'spares', match: (p) => (p.productType || '').toLowerCase().includes('spare') || (p.category || '').toLowerCase().includes('spare') || (p.sku || '').toUpperCase().startsWith('SPR') || (p.name || '').toLowerCase().includes('spare') },
            ];

            const activeTabObj = INWARD_TABS.find((t) => t.id === inwardCategoryTab);
            const filteredInward = !inwardCategoryTab || inwardCategoryTab === 'all'
              ? products
              : products.filter((p) => Boolean(activeTabObj?.match && activeTabObj.match(p)));

            return (
              <Input
                as="select"
                label={`Select Inward Product / Spare Item (${filteredInward.length} in category)`}
                name="productId"
                value={formData.productId}
                onChange={handleProductSelect}
                error={errors.productId}
                disabled={loading || !!preSelectedProduct}
                required
              >
                <option value="">
                  {filteredInward.length === 0
                    ? '-- No products found in this category --'
                    : `-- Choose Product / Material (${filteredInward.length} available) --`}
                </option>
                {filteredInward.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.productType || 'Product'}] {p.name} (ID: {p.sku}) {p.brand ? `• ${p.brand}` : ''} {p.capacity ? `(${p.capacity})` : ''} {p.phase ? `[${p.phase}]` : ''} {p.dcrType ? `[${p.dcrType}]` : ''} — Available: {p.quantity} {p.unit || 'pcs'}
                  </option>
                ))}
              </Input>
            );
          })()}
        </div>

        {/* Selected Product Specs Pill Banner */}
        {selectedProd && (
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                {selectedProd.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span>SKU: {selectedProd.sku}</span>
                <span>•</span>
                <span>Type: {selectedProd.productType || selectedProd.category}</span>
                {selectedProd.brand && (
                  <>
                    <span>•</span>
                    <span>Brand: {selectedProd.brand}</span>
                  </>
                )}
                {selectedProd.capacity && (
                  <>
                    <span>•</span>
                    <span>Rating: {selectedProd.capacity}</span>
                  </>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Current Stock</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--success)' }}>
                {selectedProd.quantity} {unit}
              </span>
            </div>
          </div>
        )}

        <div className="form-grid">
          <Input
            label={`Inward Quantity (${unit})`}
            name="quantity"
            type="number"
            min="1"
            placeholder="e.g. 10"
            value={formData.quantity}
            onChange={handleChange}
            error={errors.quantity}
            helperText={formData.serialNumbers?.length > 0 ? `Synced with ${formData.serialNumbers.length} scanned serials` : `Enter number of ${unit} received`}
            required
          />

          <Input
            as="select"
            label="Inward Receipt Reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            error={errors.reason}
            required
          >
            <optgroup label="Standard Inward Reasons">
              {STOCK_REASONS.in.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </optgroup>
            {isSpare && (
              <optgroup label="Spare & Warranty Reasons">
                {SPARE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </optgroup>
            )}
          </Input>
        </div>
      </div>

      {/* 2. SERIAL NUMBERS & BARCODE SCANNER CARD */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--success)',
              }}
            >
              <FiCamera size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                2. Unit Serial Numbers ({formData.serialNumbers?.length || 0})
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Scan barcodes or enter individual unit serials
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={FiCamera}
            onClick={() => setIsScannerOpen(true)}
          >
            Scan Barcode / QR
          </Button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <Input
              placeholder="Type Serial Number and press Enter..."
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
          <Button type="button" variant="secondary" icon={FiPlus} onClick={handleAddDirectSerial}>
            Add SN
          </Button>
        </div>

        {formData.serialNumbers?.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              maxHeight: '120px',
              overflowY: 'auto',
              padding: '10px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '10px',
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
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontFamily: 'ui-monospace, monospace',
                  fontWeight: 600,
                }}
              >
                <FiZap size={11} color="var(--primary-light)" />
                <span>{sn}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSerial(idx)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0 }}
                  title="Remove Serial"
                >
                  <FiX size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. SENDER PARTICULARS & HANDOVER CARD */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
              }}
            >
              <FiUser size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                3. Sender Particulars & Handover Details
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Source engineer, vendor details, and destination storage rack with FY auto-reference
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={FiSearch}
            onClick={() => setIsSenderModalOpen(true)}
            style={{ fontWeight: 600 }}
          >
            Search All Senders & Vendors ({allSendersDirectory.length})
          </Button>
        </div>

        <div className="form-grid">
          {/* Sender Person with Fast Inline Dropdown */}
          <div style={{ position: 'relative' }} ref={senderDropdownRef}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                Name of Sender Person / Representative
              </label>
              {allSendersDirectory.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSenderDropdown((prev) => !prev)}
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
                    borderRadius: '4px',
                  }}
                >
                  <FiSearch size={12} />
                  {showSenderDropdown
                    ? 'Hide List'
                    : `Browse ${allSendersDirectory.length} Senders`}
                </button>
              )}
            </div>

            <Input
              name="personName"
              placeholder="e.g. Rajesh Kumar (Service Engineer)"
              value={formData.personName}
              onFocus={() => {
                if (allSendersDirectory.length > 0) setShowSenderDropdown(true);
              }}
              onChange={(e) => {
                handleChange(e);
                setShowSenderDropdown(true);
              }}
              icon={FiUser}
              helperText="Type sender name or pick from previous inward history"
            />

            {/* Inline Suggestions Popover */}
            {showSenderDropdown && allSendersDirectory.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% - 14px)',
                  left: 0,
                  right: 0,
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg, 0 12px 28px rgba(0, 0, 0, 0.25))',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  zIndex: 100,
                  padding: '6px',
                }}
              >
                <div
                  style={{
                    padding: '8px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>Select Sender ({filteredInlineSenders.length})</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSenderDropdown(false);
                        setIsSenderModalOpen(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary-light)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Open Full Directory
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSenderDropdown(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      <FiX size={13} />
                    </button>
                  </div>
                </div>

                {filteredInlineSenders.length === 0 ? (
                  <div
                    style={{
                      padding: '14px',
                      textAlign: 'center',
                      fontSize: '0.8125rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    No matching sender found (entering as new name)
                  </div>
                ) : (
                  filteredInlineSenders.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectSender(s)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = 'var(--surface)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {s.name}
                        </div>
                        {(s.company || s.phone) && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginTop: '2px',
                            }}
                          >
                            {s.company && <span>🏢 {s.company}</span>}
                            {s.phone && <span>📞 {s.phone}</span>}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(245, 158, 11, 0.12)',
                          color: '#d97706',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {s.type}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <Input
            label="Sender Contact Number"
            name="senderPhone"
            placeholder="e.g. +91 98765 43210"
            value={formData.senderPhone}
            onChange={handleChange}
            icon={FiPhone}
          />

          {/* Sender Company with Quick Brand Presets */}
          <div>
            <Input
              label="Sender Company / Vendor Name"
              name="senderCompany"
              placeholder="e.g. Deye Solar Service Center / Solis HQ"
              value={formData.senderCompany}
              onChange={handleChange}
            />
            {/* Quick vendor chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
              {VENDOR_PRESETS.slice(0, 4).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, senderCompany: v }))}
                  style={{
                    fontSize: '0.6875rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary-light)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  + {v.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Receiving Warehouse / Godown Location
              </label>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {['Ranchi', 'Jamshedpur', 'Hazaribagh', 'Patna', 'Daltonganj'].map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, place: `${loc} Godown` }))}
                    style={{
                      fontSize: '0.6875rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    + {loc}
                  </button>
                ))}
              </div>
            </div>

            <Input
              name="place"
              placeholder="e.g. Ranchi Godown / Bay 1"
              value={formData.place}
              onChange={handleChange}
              icon={FiMapPin}
            />
          </div>

          <div className="full-width">
            <Input
              label="Sender Address / Origin Location"
              name="senderAddress"
              placeholder="e.g. Plot 42, Electronics Industrial Area, Phase-2, New Delhi"
              value={formData.senderAddress}
              onChange={handleChange}
              icon={FiMapPin}
            />
          </div>

          {/* Financial Year Selector */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                Financial Year (FY)
              </label>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  color: '#d97706',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                Active FY: {selectedFY}
              </span>
            </div>

            <Input
              as="select"
              value={selectedFY}
              onChange={(e) => handleFYChange(e.target.value)}
              helperText="Auto-sequences reference number per financial year"
            >
              {availableFinancialYears.map((fy) => (
                <option key={fy} value={fy}>
                  Financial Year {fy} {fy === getFinancialYear(new Date()) ? '(Current Year)' : ''}
                </option>
              ))}
            </Input>
          </div>

          {/* Inward Reference # with Prefix & Auto-Generate */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                Inward Reference / Challan / PO #
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={inwardPrefix}
                  onChange={(e) => handlePrefixChange(e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="INW">Prefix: INW/</option>
                  <option value="DC">Prefix: DC/</option>
                  <option value="PO">Prefix: PO/</option>
                  <option value="GRN">Prefix: GRN/</option>
                  <option value="CHALLAN">Prefix: CHALLAN/</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const newRef = generateBillNumberForFY(
                      selectedFY,
                      pastTransactions,
                      inwardPrefix
                    );
                    setFormData((prev) => ({ ...prev, referenceNo: newRef }));
                    toast.success(`Reference updated for FY ${selectedFY}`);
                  }}
                  title="Recalculate sequential inward reference for this FY"
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
                    borderRadius: '4px',
                  }}
                >
                  <FiRefreshCw size={11} /> Auto-Generate
                </button>
              </div>
            </div>

            <Input
              icon={FiFileText}
              name="referenceNo"
              placeholder={`e.g. ${inwardPrefix}/${selectedFY}/0001`}
              value={formData.referenceNo}
              onChange={handleChange}
              helperText={`Auto-sequenced for FY ${selectedFY} (updates when FY or date changes)`}
            />
          </div>

          {/* Inward Date & Time with Financial Year Sync */}
          <div className="full-width">
            <Input
              label="Inward Date & Time"
              name="transactionDate"
              type="datetime-local"
              value={formData.transactionDate}
              onChange={handleChange}
              icon={FiCalendar}
              helperText={`Selected Date belongs to Financial Year: ${getFinancialYear(formData.transactionDate)}`}
            />
          </div>
        </div>
      </div>

      {/* 4. REMARKS & SUBMIT */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <Input
          as="textarea"
          label="Remarks / Defect Notes"
          name="notes"
          placeholder="Condition of received material, testing remarks, carton seal state..."
          value={formData.notes}
          onChange={handleChange}
          rows={2}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={FiCheckCircle}
            style={{
              padding: '12px 28px',
              fontSize: '0.95rem',
              fontWeight: 700,
            }}
          >
            {loading ? 'Submitting Registration...' : 'Complete Inward Registration'}
          </Button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAddSerials={handleAddScannedSerials}
        existingSerials={formData.serialNumbers}
        title="Scan Inward Equipment Barcodes"
      />

      {/* Universal Sender & Vendor Directory Search Modal */}
      <Modal
        isOpen={isSenderModalOpen}
        onClose={() => setIsSenderModalOpen(false)}
        title="Universal Senders, Suppliers & Vendor Directory"
        subtitle={`Search across all ${allSendersDirectory.length} historical senders, RMA engineers, and suppliers`}
        maxWidth="750px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Modal Search Bar */}
          <Input
            icon={FiSearch}
            placeholder="Search by sender name, company, phone, location, address..."
            value={modalSearchTerm}
            onChange={(e) => setModalSearchTerm(e.target.value)}
            autoFocus
          />

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            <button
              type="button"
              onClick={() => setModalFilterTab('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: modalFilterTab === 'all' ? 'var(--primary)' : 'var(--bg-secondary)',
                color: modalFilterTab === 'all' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              All Senders ({allSendersDirectory.length})
            </button>
            <button
              type="button"
              onClick={() => setModalFilterTab('in')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: modalFilterTab === 'in' ? 'var(--primary)' : 'var(--bg-secondary)',
                color: modalFilterTab === 'in' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Suppliers / Inward Senders ({allSendersDirectory.filter((d) => d.rawType === 'in').length})
            </button>
            <button
              type="button"
              onClick={() => setModalFilterTab('out')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: modalFilterTab === 'out' ? 'var(--primary)' : 'var(--bg-secondary)',
                color: modalFilterTab === 'out' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Project Clients ({allSendersDirectory.filter((d) => d.rawType === 'out').length})
            </button>
          </div>

          {/* Senders Directory Records List */}
          <div
            style={{
              maxHeight: '380px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {filteredModalSenders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                <FiUser size={36} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <h4>No matching sender found</h4>
                <p style={{ fontSize: '0.8125rem' }}>Try refining your search keyword</p>
              </div>
            ) : (
              filteredModalSenders.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-light)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.backgroundColor = 'var(--surface)';
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {item.name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor:
                            item.rawType === 'in'
                              ? 'rgba(245, 158, 11, 0.12)'
                              : 'rgba(108, 92, 231, 0.12)',
                          color: item.rawType === 'in' ? '#d97706' : 'var(--primary-light)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {item.type}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginTop: '4px',
                        flexWrap: 'wrap',
                      }}
                    >
                      {item.company && <span>🏢 {item.company}</span>}
                      {item.phone && <span>📞 {item.phone}</span>}
                      {item.address && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiMapPin size={12} color="var(--primary-light)" /> {item.address}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Past Inward Batches: <strong>{item.count}</strong></span>
                      {item.date && (
                        <span>Last Active: <strong>{formatDateTime(item.date)}</strong></span>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleSelectSender(item)}
                    style={{ flexShrink: 0 }}
                  >
                    Select & Fill
                  </Button>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsSenderModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  );
};

export default StockInForm;
