import React, { useState, useEffect, useRef } from 'react';
import {
  FiUser,
  FiMapPin,
  FiFileText,
  FiCalendar,
  FiPlus,
  FiTrash2,
  FiCamera,
  FiZap,
  FiCheckCircle,
  FiShoppingBag,
  FiLayers,
  FiBox,
  FiSliders,
  FiSearch,
  FiRefreshCw,
  FiX,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiArrowDownLeft,
  FiPhone,
} from 'react-icons/fi';
import Input from '../common/Input';
import Button from '../common/Button';
import Modal from '../common/Modal';
import BarcodeScannerModal from '../common/BarcodeScannerModal';
import GodownModal from '../godowns/GodownModal';
import { STOCK_REASONS, GODOWN_LOCATIONS, REASON_PREFIX_MAP_IN } from '../../utils/constants';
import { useGodowns } from '../../context/GodownContext';
import {
  getFinancialYear,
  generateBillNumberForFY,
  getFinancialYearsList,
  formatDateTime,
  getCurrentLocalDateTime,
} from '../../utils/formatDate';
import { stockService } from '../../services/stockService';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export const CATEGORY_TABS = [
  { id: 'all', label: 'All Items', icon: FiLayers },
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
        cat.includes('energy storage') ||
        name.includes('battery') ||
        name.includes('lifepo4') ||
        name.includes('lithium') ||
        name.includes('tubular') ||
        name.includes('ess') ||
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
        type.includes('acdb') ||
        cat.includes('acdb') ||
        cat.includes('ac distribution') ||
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
        type.includes('dcdb') ||
        cat.includes('dcdb') ||
        cat.includes('dc distribution') ||
        name.includes('dcdb') ||
        name.includes('dc distribution') ||
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
        cat.includes('grounding') ||
        name.includes('earthing') ||
        name.includes('electrode') ||
        name.includes('gi strip') ||
        name.includes('copper strip') ||
        name.includes('compound') ||
        name.includes('bentonite') ||
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
        name.includes('switch board') ||
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
        name.includes('cable') ||
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
        name.includes('structure') ||
        name.includes('rail') ||
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
];

const StockInForm = ({
  products = [],
  onSubmit,
  loading = false,
  preSelectedProduct = null,
}) => {
  const { user, isAdmin } = useAuth();
  const { godownNames } = useGodowns();
  const activeGodowns = godownNames && godownNames.length > 0 ? godownNames : GODOWN_LOCATIONS;
  const initialDate = getCurrentLocalDateTime();
  const initialFY = getFinancialYear(initialDate);

  // Auto-update real time for non-admins (editable only by admin)
  useEffect(() => {
    if (isAdmin) return;
    const updateTime = () => {
      const nowStr = getCurrentLocalDateTime();
      setBillHeader((prev) => ({
        ...prev,
        transactionDate: nowStr,
      }));
    };
    updateTime();
    const timer = setInterval(updateTime, 5000);
    return () => clearInterval(timer);
  }, [isAdmin]);

  // Financial Year & Bill Prefix State
  const initialReason = 'Invoice';
  const initialPrefix = REASON_PREFIX_MAP_IN[initialReason] || 'INV';
  const [selectedFY, setSelectedFY] = useState(initialFY);
  const [billPrefix, setBillPrefix] = useState(initialPrefix);
  const [godownModalOpen, setGodownModalOpen] = useState(false);
  const availableFinancialYears = getFinancialYearsList(6, 3);

  // 1. Inward Sender & Godown Particulars
  const [billHeader, setBillHeader] = useState({
    personName: '',
    senderPhone: '',
    senderCompany: '',
    place: 'Ranchi Godown / Bay 1',
    senderAddress: '',
    reason: initialReason,
    customReason: '',
    referenceNo: generateBillNumberForFY(initialFY, [], initialPrefix),
    transactionDate: initialDate,
    notes: '',
  });

  // Category View Mode: 'all' (all 15 categories visible) | 'scroll' (horizontal scrollbar with left/right navigation)
  const [categoryViewMode, setCategoryViewMode] = useState('all');
  const categoryScrollRefs = useRef({});

  const handleCategoryScroll = (itemIdx, direction) => {
    const el = categoryScrollRefs.current[itemIdx];
    if (el) {
      el.scrollBy({ left: direction * 260, behavior: 'smooth' });
    }
  };

  // Universal Senders & Contacts Directory & Modal State
  const [pastTransactions, setPastTransactions] = useState([]);
  const [allDirectory, setAllDirectory] = useState([]);
  const [showDirectoryDropdown, setShowDirectoryDropdown] = useState(false);
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalFilterTab, setModalFilterTab] = useState('all'); // all, in, out
  const directoryDropdownRef = useRef(null);

  // Fetch all transactions and product senders for universal directory search
  useEffect(() => {
    const loadDirectoryData = async () => {
      try {
        const res = await stockService.getTransactions({ limit: 1000 });
        const txs = res.data || [];
        setPastTransactions(txs);

        const list = [];

        // 1. Inward Senders
        txs.forEach((t) => {
          if (t.type === 'in' && t.personName && t.personName.trim()) {
            list.push({
              name: t.personName.trim(),
              place: t.senderAddress || t.place || '',
              company: t.senderCompany || '',
              type: 'Material Supplier / Sender',
              rawType: 'in',
              reason: t.reason,
              phone: t.senderPhone || '',
              date: t.transactionDate || t.createdAt,
            });
          }
        });

        // 2. Outward Clients
        txs.forEach((t) => {
          if (t.type === 'out' && t.personName && t.personName.trim()) {
            list.push({
              name: t.personName.trim(),
              place: t.place || '',
              type: 'Client / Site Receiver',
              rawType: 'out',
              reason: t.reason,
              phone: t.senderPhone || '',
              date: t.transactionDate || t.createdAt,
            });
          }
        });

        // 3. Products sender data
        (products || []).forEach((p) => {
          if (p.senderName && p.senderName.trim()) {
            list.push({
              name: p.senderName.trim(),
              place: p.senderAddress || p.senderCompany || p.location || '',
              company: p.senderCompany || '',
              type: 'Vendor / Sender',
              rawType: 'in',
              reason: p.senderReason || 'Inward Restock',
              phone: p.senderPhone || '',
              date: p.createdAt,
            });
          }
        });

        // Deduplicate records by name & place
        const map = {};
        list.forEach((item) => {
          const key = `${item.name.toLowerCase()}:::${(item.place || '').toLowerCase()}`;
          if (!map[key]) {
            map[key] = { ...item, count: 1 };
          } else {
            map[key].count += 1;
            if (item.date && (!map[key].date || new Date(item.date) > new Date(map[key].date))) {
              map[key].date = item.date;
            }
          }
        });

        const combined = Object.values(map).sort((a, b) => b.count - a.count);
        setAllDirectory(combined);

        // Update bill reference with accurate sequence for selected FY from DB
        setBillHeader((prev) => ({
          ...prev,
          referenceNo: generateBillNumberForFY(selectedFY, txs, billPrefix),
        }));
      } catch (err) {
        console.error('Failed to load past transactions', err);
      }
    };
    loadDirectoryData();
  }, [products]);

  // Close directory dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (directoryDropdownRef.current && !directoryDropdownRef.current.contains(e.target)) {
        setShowDirectoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle FY dropdown selection change
  const handleFYChange = (newFY) => {
    setSelectedFY(newFY);
    const newBillNo = generateBillNumberForFY(newFY, pastTransactions, billPrefix);

    // Sync transactionDate if currently outside the selected FY
    const dateFY = getFinancialYear(billHeader.transactionDate);
    let newDate = billHeader.transactionDate;
    if (dateFY !== newFY) {
      const startYear = newFY.split('-')[0];
      newDate = `${startYear}-04-01T10:00`;
    }

    setBillHeader((prev) => ({
      ...prev,
      referenceNo: newBillNo,
      transactionDate: newDate,
    }));
    toast.success(`Generated Inward Bill Sequence for FY ${newFY}`);
  };

  // Handle Bill Prefix change (e.g. INW, BILL, INV, DC)
  const handlePrefixChange = (newPrefix) => {
    setBillPrefix(newPrefix);
    const newBillNo = generateBillNumberForFY(selectedFY, pastTransactions, newPrefix);
    setBillHeader((prev) => ({
      ...prev,
      referenceNo: newBillNo,
    }));
  };

  // 2. Multi-Item Inward Bill Array with categoryTab filter per item
  const [billItems, setBillItems] = useState([
    {
      id: Date.now(),
      categoryTab: 'all',
      productId: preSelectedProduct?.id ? String(preSelectedProduct.id) : '',
      quantity: '1',
      unitRate: preSelectedProduct?.price ? String(preSelectedProduct.price) : '26000',
      gstRate: '5',
      selectedSerials: [],
    },
  ]);

  const [activeScannerItemIndex, setActiveScannerItemIndex] = useState(null);
  const [itemSerialInputs, setItemSerialInputs] = useState({});
  const [errors, setErrors] = useState({});

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setBillHeader((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'reason') {
        const autoPrefix = REASON_PREFIX_MAP_IN[value] || 'INW';
        setBillPrefix(autoPrefix);
        updated.referenceNo = generateBillNumberForFY(selectedFY, pastTransactions, autoPrefix);
      }
      if (name === 'transactionDate') {
        const fy = getFinancialYear(value);
        setSelectedFY(fy);
        updated.referenceNo = generateBillNumberForFY(fy, pastTransactions, billPrefix);
      }
      return updated;
    });
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSelectDirectory = (cust) => {
    setBillHeader((prev) => ({
      ...prev,
      personName: cust.name || cust.personName,
      senderAddress: cust.place || prev.senderAddress,
      senderCompany: cust.company || prev.senderCompany,
      senderPhone: cust.phone || prev.senderPhone,
    }));
    setShowDirectoryDropdown(false);
    setIsDirectoryModalOpen(false);
    setErrors((prev) => ({ ...prev, personName: '' }));
    toast.success(`Selected: ${cust.name || cust.personName}`);
  };

  const filteredInlineDirectory = allDirectory.filter((c) => {
    const q = (billHeader.personName || '').toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company && c.company.toLowerCase().includes(q)) ||
      (c.place && c.place.toLowerCase().includes(q))
    );
  });

  const filteredModalDirectory = allDirectory.filter((item) => {
    if (modalFilterTab === 'in' && item.rawType !== 'in') return false;
    if (modalFilterTab === 'out' && item.rawType !== 'out') return false;

    const term = modalSearchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      item.name.toLowerCase().includes(term) ||
      (item.place && item.place.toLowerCase().includes(term)) ||
      (item.company && item.company.toLowerCase().includes(term)) ||
      (item.phone && item.phone.toLowerCase().includes(term)) ||
      (item.reason && item.reason.toLowerCase().includes(term))
    );
  });

  const handleItemChange = (index, field, value) => {
    setBillItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (field === 'productId') {
        const prod = products.find((p) => p.id === parseInt(value, 10));
        if (prod) {
          if (!updated[index].unitRate || updated[index].unitRate === '26000') {
            updated[index].unitRate = prod.price ? String(prod.price) : '26000';
          }
        }
      }
      return updated;
    });
    setErrors((prev) => ({ ...prev, [`item_${index}_${field}`]: '' }));
  };

  const handleItemCategoryTab = (index, tabId) => {
    setBillItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], categoryTab: tabId };
      return updated;
    });
  };

  const handleAddItem = () => {
    setBillItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        categoryTab: 'all',
        productId: '',
        quantity: '1',
        unitRate: '',
        gstRate: '5',
        selectedSerials: [],
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (billItems.length === 1) {
      toast.error('Inward bill must contain at least one item');
      return;
    }
    setBillItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddDirectSerialToItem = (itemIndex) => {
    const currentVal = (itemSerialInputs[itemIndex] || '').trim();
    if (!currentVal) return;

    const currentItem = billItems[itemIndex];
    const currentSerials = currentItem?.selectedSerials || [];
    if (currentSerials.includes(currentVal)) {
      toast.error('Serial number already added in this item');
      return;
    }

    const newSerials = [...currentSerials, currentVal];
    setBillItems((prev) => {
      const updated = [...prev];
      updated[itemIndex] = {
        ...updated[itemIndex],
        selectedSerials: newSerials,
        quantity: String(Math.max(newSerials.length, parseInt(updated[itemIndex].quantity, 10) || 1)),
      };
      return updated;
    });

    setItemSerialInputs((prev) => ({ ...prev, [itemIndex]: '' }));
    toast.success(`Captured serial: ${currentVal}`);
  };

  const handleRemoveItemSerial = (itemIndex, serialIdx) => {
    setBillItems((prev) => {
      const updated = [...prev];
      const currentSerials = updated[itemIndex]?.selectedSerials || [];
      const newSerials = currentSerials.filter((_, idx) => idx !== serialIdx);
      updated[itemIndex] = {
        ...updated[itemIndex],
        selectedSerials: newSerials,
        quantity: newSerials.length > 0 ? String(newSerials.length) : updated[itemIndex].quantity,
      };
      return updated;
    });
  };

  const handleAddScannedSerials = (scannedList) => {
    if (activeScannerItemIndex === null) return;
    const item = billItems[activeScannerItemIndex];
    if (!item) return;

    setBillItems((prev) => {
      const updated = [...prev];
      const currentSerials = updated[activeScannerItemIndex].selectedSerials || [];
      const merged = Array.from(new Set([...currentSerials, ...scannedList]));
      updated[activeScannerItemIndex] = {
        ...updated[activeScannerItemIndex],
        selectedSerials: merged,
        quantity: String(Math.max(merged.length, parseInt(updated[activeScannerItemIndex].quantity, 10) || 1)),
      };
      return updated;
    });

    toast.success(`Captured ${scannedList.length} serial(s)`);
  };

  const validate = () => {
    const errs = {};
    if (!billHeader.personName?.trim()) {
      errs.personName = 'Sender / Representative name is required';
    }
    if (!billHeader.place?.trim()) {
      errs.place = 'Receiving godown / warehouse location is required';
    }
    if (billHeader.reason === 'Other' && !billHeader.customReason?.trim()) {
      errs.customReason = 'Please specify custom reason';
    }

    billItems.forEach((item, idx) => {
      if (!item.productId) {
        errs[`item_${idx}_productId`] = 'Select an equipment item';
      } else {
        const qty = parseInt(item.quantity, 10);
        if (!item.quantity || isNaN(qty) || qty <= 0) {
          errs[`item_${idx}_quantity`] = 'Quantity must be at least 1';
        }
      }
    });

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please fix the highlighted fields in the inward bill');
    }
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const finalReason =
      billHeader.reason === 'Other' && billHeader.customReason.trim()
        ? billHeader.customReason.trim()
        : billHeader.reason;

    const payload = {
      personName: billHeader.personName.trim(),
      senderPhone: billHeader.senderPhone?.trim() || '',
      senderCompany: billHeader.senderCompany?.trim() || '',
      place: billHeader.place.trim(),
      senderAddress: billHeader.senderAddress?.trim() || '',
      reason: finalReason,
      referenceNo: billHeader.referenceNo.trim(),
      transactionDate: !isAdmin
        ? new Date().toISOString()
        : billHeader.transactionDate
        ? new Date(billHeader.transactionDate).toISOString()
        : new Date().toISOString(),
      notes: billHeader.notes?.trim() || '',
      items: billItems.map((item) => ({
        productId: parseInt(item.productId, 10),
        quantity: parseInt(item.quantity, 10),
        unitRate: parseFloat(item.unitRate) || 0,
        gstRate: parseFloat(item.gstRate) || 5,
        serialNumbers: item.selectedSerials || [],
      })),
    };

    onSubmit(payload);
  };

  const totalUnits = billItems.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0);
  const totalSerials = billItems.reduce((sum, item) => sum + (item.selectedSerials?.length || 0), 0);

  const activeScannerProd =
    activeScannerItemIndex !== null
      ? products.find((p) => p.id === parseInt(billItems[activeScannerItemIndex]?.productId, 10))
      : null;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. SENDER & RECEIVING GODOWN PARTICULARS (MATCHING STOCK OUT APPEARANCE) */}
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
                backgroundColor: 'rgba(108, 92, 231, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-light)',
              }}
            >
              <FiUser size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                1. Sender Particulars & Receiving Godown Details
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Record supplier particulars, destination storage godown, financial year sequence, and inward movement details
              </span>
            </div>
          </div>

          {/* Quick Universal Directory Search Button */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={FiSearch}
            onClick={() => setIsDirectoryModalOpen(true)}
            style={{ fontWeight: 600 }}
          >
            Search All Senders & Vendors ({allDirectory.length})
          </Button>
        </div>

        {/* 1A. SIDE-BY-SIDE: SENDER (LEFT) & RECEIVING GODOWN (RIGHT) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
            marginBottom: '18px',
          }}
        >
          {/* Card A: SENDER / VENDOR PARTICULARS */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                color: '#1e3a8a',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '8px',
              }}
            >
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1e3a8a' }}></span>
              <span>🏢 Sender / Supplier / Vendor Details</span>
            </div>

            {/* Sender Person Name with inline directory dropdown */}
            <div style={{ position: 'relative' }} ref={directoryDropdownRef}>
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
                  Name of Sender Person / Representative <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                {allDirectory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowDirectoryDropdown((prev) => !prev)}
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
                    }}
                  >
                    <FiSearch size={11} />
                    {showDirectoryDropdown ? 'Hide' : `Directory (${allDirectory.length})`}
                  </button>
                )}
              </div>

              <Input
                icon={FiUser}
                name="personName"
                placeholder="e.g. Rajesh Kumar (Service Engineer)"
                value={billHeader.personName}
                onFocus={() => {
                  if (allDirectory.length > 0) setShowDirectoryDropdown(true);
                }}
                onChange={(e) => {
                  handleHeaderChange(e);
                  setShowDirectoryDropdown(true);
                }}
                error={errors.personName}
                helperText="Type sender name or pick from previous inward history"
                required
              />

              {/* Fast Inline Suggestions Popover */}
              {showDirectoryDropdown && allDirectory.length > 0 && (
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
                    <span>Select from Past Records ({filteredInlineDirectory.length})</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDirectoryDropdown(false);
                          setIsDirectoryModalOpen(true);
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
                        onClick={() => setShowDirectoryDropdown(false)}
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

                  {filteredInlineDirectory.length === 0 ? (
                    <div
                      style={{
                        padding: '14px',
                        textAlign: 'center',
                        fontSize: '0.8125rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      No matching record found
                    </div>
                  ) : (
                    filteredInlineDirectory.map((cust, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectDirectory(cust)}
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
                            {cust.name} {cust.company ? `(${cust.company})` : ''}
                          </div>
                          {cust.place && (
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '2px',
                              }}
                            >
                              <FiMapPin size={11} color="var(--primary-light)" /> {cust.place}
                            </div>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            backgroundColor:
                              cust.rawType === 'in'
                                ? 'rgba(16, 185, 129, 0.12)'
                                : 'rgba(108, 92, 231, 0.12)',
                            color:
                              cust.rawType === 'in'
                                ? 'var(--success)'
                                : 'var(--primary-light)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {cust.type}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Sender Company / Vendor Name */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Sender Company / Vendor Name
                </label>
              </div>
              <Input
                name="senderCompany"
                placeholder="e.g. Deye Solar Service Center / Solis HQ"
                value={billHeader.senderCompany}
                onChange={handleHeaderChange}
              />
              {/* Quick Vendor Preset Chips */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {['Deye', 'Solis', 'Growatt', 'Havells'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setBillHeader((prev) => ({ ...prev, senderCompany: `${v} Solar HQ` }))}
                    style={{
                      fontSize: '0.6875rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    + {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Sender Contact Phone */}
            <div>
              <Input
                icon={FiPhone}
                label="Sender Contact Number"
                name="senderPhone"
                placeholder="e.g. +91 98765 43210"
                value={billHeader.senderPhone}
                onChange={handleHeaderChange}
                helperText="Primary sender contact phone"
              />
            </div>

            {/* Sender Address */}
            <div>
              <Input
                icon={FiMapPin}
                label="Sender Address / Origin Location"
                name="senderAddress"
                placeholder="e.g. Plot 42, Electronics Industrial Area, Phase-2, New Delhi"
                value={billHeader.senderAddress}
                onChange={handleHeaderChange}
                helperText="Origin location where goods dispatched from"
              />
            </div>
          </div>

          {/* Card B: RECEIVING WAREHOUSE / GODOWN LOCATION */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                color: '#0284c7',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '8px',
              }}
            >
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }}></span>
              <span>📍 Receiving Warehouse / Godown Destination</span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Receiving Warehouse / Godown Location <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {activeGodowns.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setBillHeader((prev) => ({ ...prev, place: `${loc} Godown / Bay 1` }))}
                      style={{
                        fontSize: '0.6875rem',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      + {loc}
                    </button>
                  ))}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setGodownModalOpen(true)}
                      style={{
                        fontSize: '0.6875rem',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        border: '1px dashed var(--primary-light)',
                        backgroundColor: 'rgba(108, 92, 231, 0.08)',
                        color: 'var(--primary-light)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                      title="Manage, add, or delete godowns"
                    >
                      ⚙️ Manage / Delete Godowns
                    </button>
                  )}
                </div>
              </div>

              <Input
                icon={FiMapPin}
                name="place"
                placeholder="e.g. Ranchi Godown / Bay 1"
                value={billHeader.place}
                onChange={handleHeaderChange}
                error={errors.place}
                helperText="Primary storage godown location receiving the goods"
                required
              />
            </div>

            {/* Inward Godown Verification Info Box */}
            <div
              style={{
                backgroundColor: 'rgba(2, 132, 199, 0.08)',
                border: '1px dashed rgba(2, 132, 199, 0.35)',
                borderRadius: '10px',
                padding: '16px',
                fontSize: '0.825rem',
                color: '#0369a1',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginTop: 'auto',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.875rem' }}>
                ✓ Inward Storage Rack & Godown Verified
              </div>
              <div style={{ color: '#334155' }}>
                <strong>Storage Godown:</strong> {billHeader.place || 'Ranchi Godown / Bay 1'}
              </div>
              <div style={{ color: '#334155' }}>
                <strong>Warehouse Bay:</strong> Bay 1 / Main Solar Staging Area
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                💡 Arriving quantities and serial numbers will be added directly to this godown stock balance upon registration.
              </div>
            </div>
          </div>
        </div>

        {/* 1B. MOVEMENT & BILL SEQUENCING DETAILS */}
        <div
          style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            color: '#1e3a8a',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>📄 Inward Document & Movement Particulars</span>
        </div>

        <div className="form-grid">
          {/* Movement Reason */}
          <div>
            <Input
              as="select"
              label="Inward Movement Reason"
              name="reason"
              value={billHeader.reason}
              onChange={handleHeaderChange}
              required
            >
              {STOCK_REASONS.in.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Input>

            {billHeader.reason === 'Other' && (
              <div style={{ marginTop: '8px' }}>
                <Input
                  label="Type Custom Reason"
                  name="customReason"
                  placeholder="Specify exact inward purpose..."
                  value={billHeader.customReason}
                  onChange={handleHeaderChange}
                  error={errors.customReason}
                  required
                />
              </div>
            )}
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
                  backgroundColor: 'rgba(30, 58, 138, 0.1)',
                  color: '#1e3a8a',
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

          {/* Inward Reference / Challan / PO # */}
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
                  value={billPrefix}
                  onChange={(e) => handlePrefixChange(e.target.value)}
                  disabled={!isAdmin}
                  title={isAdmin ? "Select bill prefix" : "Prefix is auto-linked to inward reason (Admin can change)"}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    cursor: isAdmin ? 'pointer' : 'default',
                    opacity: isAdmin ? 1 : 0.85,
                  }}
                >
                  <option value="INV">Prefix: INV/</option>
                  <option value="DC">Prefix: DC/</option>
                  <option value="RET">Prefix: RET/</option>
                  <option value="TRF">Prefix: TRF/</option>
                  <option value="INW">Prefix: INW/</option>
                  <option value="CHALLAN">Prefix: CHALLAN/</option>
                  <option value="BILL">Prefix: BILL/</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const newBill = generateBillNumberForFY(
                      selectedFY,
                      pastTransactions,
                      billPrefix
                    );
                    setBillHeader((prev) => ({ ...prev, referenceNo: newBill }));
                    toast.success(`Inward reference updated for FY ${selectedFY}`);
                  }}
                  title="Recalculate sequential bill number for this Financial Year"
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
              placeholder={`e.g. ${billPrefix}/${selectedFY}/0001`}
              value={billHeader.referenceNo}
              onChange={isAdmin ? handleHeaderChange : undefined}
              readOnly={!isAdmin}
              helperText={
                isAdmin
                  ? `Auto-sequenced for FY ${selectedFY} • Admin can edit reference # freely`
                  : `Auto-sequenced for FY ${selectedFY} • Locked (Only Admin can manually edit)`
              }
              required
            />
          </div>

          {/* Inward Date & Time */}
          <div>
            <Input
              icon={FiCalendar}
              label={isAdmin ? "Inward Date & Time (Admin Editable)" : "Inward Date & Time (Auto-Captured)"}
              name="transactionDate"
              type="datetime-local"
              value={billHeader.transactionDate}
              onChange={isAdmin ? handleHeaderChange : undefined}
              disabled={!isAdmin}
              readOnly={!isAdmin}
              helperText={
                isAdmin
                  ? `🕒 Auto-captured time. FY: ${getFinancialYear(billHeader.transactionDate)} (Admin can adjust date/time)`
                  : `🔒 Auto-captured real time. FY: ${getFinancialYear(billHeader.transactionDate)} (Editable only by Admin)`
              }
              required
            />
          </div>
        </div>
      </div>

      {/* 2. MULTI-ITEM INWARD BILL WITH CLEAN SEGMENTED CATEGORY TABS (IDENTICAL TO STOCK OUT) */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(30, 58, 138, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1e3a8a',
              }}
            >
              <FiShoppingBag size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                2. Items in this Inward Shipment ({billItems.length})
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Receive inverters, solar panels, batteries, MCBs, MSBs, wires, consumables, or spares
              </span>
            </div>
          </div>

          {/* Clean Add Item Action in Header */}
          <Button
            type="button"
            variant="secondary"
            icon={FiPlus}
            onClick={handleAddItem}
            style={{ fontWeight: 700, padding: '7px 16px', fontSize: '0.84rem' }}
          >
            Add Another Item
          </Button>
        </div>

        {/* Item Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {billItems.map((item, idx) => {
            const currentTab = item.categoryTab || 'all';
            const activeTabDef = CATEGORY_TABS.find((t) => t.id === currentTab);
            const filteredProducts =
              currentTab === 'all'
                ? products
                : products.filter((p) => Boolean(activeTabDef?.match && activeTabDef.match(p)));

            const prod = products.find((p) => p.id === parseInt(item.productId, 10));
            const unit = prod?.unit || 'pcs';

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.04)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                }}
              >
                {/* 1. Item Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '14px',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'rgba(30, 58, 138, 0.08)',
                        color: '#1e3a8a',
                        border: '1px solid rgba(30, 58, 138, 0.16)',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      <FiBox size={14} />
                      <span>ITEM #{String(idx + 1).padStart(2, '0')}</span>
                    </span>

                    {prod && (
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: '#0f172a',
                        }}
                      >
                        {prod.name}
                      </span>
                    )}
                  </div>

                  {billItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '5px 12px',
                        borderRadius: '8px',
                        transition: 'all 0.15s ease',
                      }}
                      title="Remove this item from inward bill"
                    >
                      <FiTrash2 size={13} />
                      <span>Remove Item</span>
                    </button>
                  )}
                </div>

                {/* 2. Sleek Category Filter (All Visible or Scrollable with Visible Scrollbar) */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Filter by Equipment Category
                      </label>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: '#64748b',
                          backgroundColor: '#f1f5f9',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                        }}
                      >
                        {CATEGORY_TABS.length} Categories
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {categoryViewMode === 'scroll' && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleCategoryScroll(idx, -1)}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              width: '26px',
                              height: '26px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#334155',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              padding: 0,
                            }}
                            title="Scroll categories left"
                          >
                            <FiChevronLeft size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCategoryScroll(idx, 1)}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              width: '26px',
                              height: '26px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#334155',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              padding: 0,
                            }}
                            title="Scroll categories right"
                          >
                            <FiChevronRight size={15} />
                          </button>
                        </div>
                      )}

                      {/* View Switcher: All Visible vs Scroll Bar */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          backgroundColor: '#f1f5f9',
                          borderRadius: '8px',
                          padding: '2px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setCategoryViewMode('all')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.73rem',
                            fontWeight: categoryViewMode === 'all' ? 700 : 500,
                            backgroundColor: categoryViewMode === 'all' ? '#ffffff' : 'transparent',
                            color: categoryViewMode === 'all' ? '#1e3a8a' : '#64748b',
                            border: 'none',
                            boxShadow: categoryViewMode === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          title="Show all categories visible"
                        >
                          <FiEye size={12} />
                          <span>All Visible</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCategoryViewMode('scroll')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.73rem',
                            fontWeight: categoryViewMode === 'scroll' ? 700 : 500,
                            backgroundColor: categoryViewMode === 'scroll' ? '#ffffff' : 'transparent',
                            color: categoryViewMode === 'scroll' ? '#1e3a8a' : '#64748b',
                            border: 'none',
                            boxShadow: categoryViewMode === 'scroll' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          title="Horizontal scroll row with visible scrollbar"
                        >
                          <FiSliders size={12} />
                          <span>Scroll Bar</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pills Container */}
                  <div
                    ref={(el) => {
                      if (el) categoryScrollRefs.current[idx] = el;
                    }}
                    className={categoryViewMode === 'scroll' ? 'category-pills-scroll' : ''}
                    style={{
                      display: 'flex',
                      flexWrap: categoryViewMode === 'all' ? 'wrap' : 'nowrap',
                      gap: '8px',
                      overflowX: categoryViewMode === 'scroll' ? 'auto' : 'visible',
                      paddingBottom: categoryViewMode === 'scroll' ? '8px' : '2px',
                      paddingTop: '2px',
                      WebkitOverflowScrolling: 'touch',
                      scrollbarWidth: categoryViewMode === 'scroll' ? 'thin' : 'auto',
                      scrollbarColor: '#94a3b8 #f1f5f9',
                    }}
                  >
                    {CATEGORY_TABS.map((tab) => {
                      const isActive = currentTab === tab.id;
                      const count =
                        tab.id === 'all'
                          ? products.length
                          : products.filter((p) => tab.match && tab.match(p)).length;

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleItemCategoryTab(idx, tab.id)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '9999px',
                            fontSize: '0.78rem',
                            fontWeight: isActive ? 800 : 600,
                            border: isActive ? '1px solid #1e3a8a' : '1px solid #e2e8f0',
                            backgroundColor: isActive ? '#1e3a8a' : '#f8fafc',
                            color: isActive ? '#ffffff' : '#475569',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                            boxShadow: isActive ? '0 2px 8px rgba(30, 58, 138, 0.25)' : 'none',
                            flexShrink: 0,
                          }}
                        >
                          <span>{tab.label}</span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '1px 6px',
                              borderRadius: '9999px',
                              backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : '#e2e8f0',
                              color: isActive ? '#ffffff' : '#64748b',
                              fontWeight: 700,
                            }}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Product Selection & Quantity in Cohesive Balanced Row */}
                <div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(280px, 1fr) 220px',
                      gap: '16px',
                      alignItems: 'start',
                    }}
                  >
                    <div>
                      <Input
                        as="select"
                        label={`Equipment / Material (${filteredProducts.length} in ${activeTabDef?.label || 'category'})`}
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        error={errors[`item_${idx}_productId`]}
                        required
                      >
                        <option value="">
                          {filteredProducts.length === 0
                            ? `-- No equipment found in this category --`
                            : `-- Choose Equipment / Model (${filteredProducts.length} available) --`}
                        </option>
                        {filteredProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.productType || 'Product'}] {p.name} ({p.sku}) {p.brand ? `• ${p.brand}` : ''} {p.capacity ? `(${p.capacity})` : ''} — Current Stock: {p.quantity} {p.unit || 'pcs'}
                          </option>
                        ))}
                      </Input>
                    </div>

                    <div>
                      <Input
                        label={`Quantity to Inward (${unit})`}
                        type="number"
                        min="1"
                        placeholder="e.g. 1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        error={errors[`item_${idx}_quantity`]}
                        helperText={prod ? `Current Stock: ${prod.quantity} ${unit} (will increase)` : 'Enter arriving quantity'}
                        required
                      />
                    </div>
                  </div>

                  {/* Product Details Overview Strip */}
                  {prod && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '12px 16px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            backgroundColor: '#ffffff',
                            color: '#1e293b',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                          }}
                        >
                          SKU: {prod.sku}
                        </span>
                        {prod.brand && (
                          <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                            Brand: <strong style={{ color: '#0f172a' }}>{prod.brand}</strong>
                          </span>
                        )}
                        {prod.capacity && (
                          <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                            Rating: <strong style={{ color: '#0f172a' }}>{prod.capacity}</strong>
                          </span>
                        )}
                        {prod.phase && (
                          <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                            Phase: <strong style={{ color: '#0f172a' }}>{prod.phase}</strong>
                          </span>
                        )}
                        {prod.dcrType && (
                          <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                            DCR: <strong style={{ color: '#0f172a' }}>{prod.dcrType}</strong>
                          </span>
                        )}
                      </div>

                      {/* Real-time Warehouse Stock Badge */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          color: '#059669',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                        }}
                      >
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: '#10b981',
                          }}
                        />
                        <span>Current Stock: {prod.quantity} {unit} (+{parseInt(item.quantity, 10) || 0} arriving)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Unit Serial Numbers Card */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(30, 58, 138, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1e3a8a',
                        }}
                      >
                        <FiCamera size={17} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            Unit Serial Numbers
                          </h3>
                          {item.selectedSerials?.length > 0 ? (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                color: '#059669',
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                              }}
                            >
                              ✓ {item.selectedSerials.length} Serial(s) Captured
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              (Optional)
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                          Scan barcodes, QR codes, or type serial numbers for incoming equipment
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={FiCamera}
                      onClick={() => setActiveScannerItemIndex(idx)}
                      style={{
                        fontWeight: 700,
                        backgroundColor: '#ffffff',
                        borderColor: '#cbd5e1',
                      }}
                    >
                      Scan Barcode / QR
                    </Button>
                  </div>

                  {/* Serial Entry Row */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <Input
                        placeholder="Type Serial Number and press Enter (e.g. SN-98240)..."
                        value={itemSerialInputs[idx] || ''}
                        onChange={(e) => setItemSerialInputs((prev) => ({ ...prev, [idx]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddDirectSerialToItem(idx);
                          }
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      icon={FiPlus}
                      onClick={() => handleAddDirectSerialToItem(idx)}
                      style={{
                        padding: '0 20px',
                        fontWeight: 700,
                        backgroundColor: '#1e3a8a',
                        borderColor: '#1e3a8a',
                      }}
                    >
                      Add SN
                    </Button>
                  </div>

                  {/* Added Serials Chips */}
                  {item.selectedSerials?.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        maxHeight: '130px',
                        overflowY: 'auto',
                        padding: '10px 12px',
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      {item.selectedSerials.map((sn, sIdx) => (
                        <span
                          key={sIdx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            color: '#0f172a',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontFamily: 'ui-monospace, monospace',
                            fontWeight: 700,
                          }}
                        >
                          <FiZap size={11} color="#1e3a8a" />
                          <span>{sn}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemSerial(idx, sIdx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Remove Serial"
                          >
                            <FiX size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Full-Width Dashed Add Another Equipment Row Button */}
        <div style={{ marginTop: '18px' }}>
          <button
            type="button"
            onClick={handleAddItem}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: '2px dashed var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--primary-light)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all var(--transition-fast)',
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
            <FiPlus size={16} />
            <span>+ Add Another Equipment / Material to this Inward Bill</span>
          </button>
        </div>
      </div>

      {/* 3. LIVE INWARD RECEIPT SUMMARY */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Items in Inward Bill
          </span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            {billItems.length} Distinct Products
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Units Received
          </span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-light)', marginTop: '2px' }}>
            +{totalUnits} Units
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Serial Numbers Captured
          </span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            {totalSerials} Serials
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Gate Entry Status
          </span>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--success)', marginTop: '2px' }}>
            READY FOR INWARD ENTRY
          </div>
        </div>
      </div>

      {/* 4. NOTES & SUBMIT INWARD BILL */}
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
          label="Inward Remarks / Gate Pass Delivery Notes"
          name="notes"
          placeholder="Enter carton seals, physical inspection condition, packaging remarks..."
          value={billHeader.notes}
          onChange={handleHeaderChange}
          rows={2}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={FiCheckCircle}
            style={{
              padding: '13px 32px',
              fontSize: '1rem',
              fontWeight: 800,
              backgroundColor: '#1e3a8a',
              borderColor: '#1e3a8a',
            }}
          >
            {loading
              ? 'Processing Inward...'
              : `Confirm & Generate Stock In Entry (${billItems.length} Items)`}
          </Button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {activeScannerItemIndex !== null && (
        <BarcodeScannerModal
          isOpen={true}
          onClose={() => setActiveScannerItemIndex(null)}
          onAddSerials={handleAddScannedSerials}
          existingSerials={billItems[activeScannerItemIndex]?.selectedSerials || []}
          title={`Scan Barcodes for ${activeScannerProd?.name || 'Selected Equipment'}`}
        />
      )}

      {/* Universal Supplier & Sender Directory Search Modal */}
      <Modal
        isOpen={isDirectoryModalOpen}
        onClose={() => setIsDirectoryModalOpen(false)}
        title="Universal Supplier & Inward Sender Directory"
        subtitle={`Search across all ${allDirectory.length} historical vendors, technicians, and project senders`}
        maxWidth="750px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            icon={FiSearch}
            placeholder="Search by vendor name, company, origin address, phone..."
            value={modalSearchTerm}
            onChange={(e) => setModalSearchTerm(e.target.value)}
            autoFocus
          />

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
              All Records ({allDirectory.length})
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
              Suppliers / Inward Senders ({allDirectory.filter((d) => d.rawType === 'in').length})
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
              Dispatch Clients ({allDirectory.filter((d) => d.rawType === 'out').length})
            </button>
          </div>

          <div
            style={{
              maxHeight: '380px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {filteredModalDirectory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                <FiUser size={36} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <h4>No matching records found</h4>
                <p style={{ fontSize: '0.8125rem' }}>Try refining your search keyword</p>
              </div>
            ) : (
              filteredModalDirectory.map((item, idx) => (
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
                        {item.name} {item.company ? `(${item.company})` : ''}
                      </span>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor:
                            item.rawType === 'in'
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'rgba(108, 92, 231, 0.12)',
                          color:
                            item.rawType === 'in'
                              ? 'var(--success)'
                              : 'var(--primary-light)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {item.type}
                      </span>
                    </div>

                    {item.place && (
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '4px',
                        }}
                      >
                        <FiMapPin size={13} color="var(--primary-light)" style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.place}
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Movements: <strong>{item.count}</strong></span>
                      {item.date && (
                        <span>Last Active: <strong>{formatDateTime(item.date)}</strong></span>
                      )}
                      {item.reason && <span>Recent: <em>{item.reason}</em></span>}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleSelectDirectory(item)}
                    style={{ flexShrink: 0 }}
                  >
                    Select & Apply
                  </Button>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsDirectoryModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Godown Add & Delete Modal */}
      {isAdmin && (
        <GodownModal
          isOpen={godownModalOpen}
          onClose={() => setGodownModalOpen(false)}
        />
      )}
    </form>
  );
};

export default StockInForm;
