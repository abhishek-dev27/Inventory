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
  FiCheck,
  FiCheckCircle,
  FiShoppingBag,
  FiLayers,
  FiSun,
  FiBox,
  FiTool,
  FiShield,
  FiActivity,
  FiSliders,
  FiSearch,
  FiRefreshCw,
  FiX,
  FiClock,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import Input from '../common/Input';
import Button from '../common/Button';
import Modal from '../common/Modal';
import BarcodeScannerModal from '../common/BarcodeScannerModal';
import GodownModal from '../godowns/GodownModal';
import { STOCK_REASONS, GODOWN_LOCATIONS, REASON_PREFIX_MAP_OUT } from '../../utils/constants';
import { useGodowns } from '../../context/GodownContext';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  getFinancialYear,
  generateBillNumber,
  generateBillNumberForFY,
  getFinancialYearsList,
  formatDateTime,
  formatDate,
  getCurrentLocalDateTime,
} from '../../utils/formatDate';
import { getHSNCode } from '../../utils/exportPdf';
import TaxInvoiceModal from './TaxInvoiceModal';
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

const StockOutForm = ({
  products = [],
  onSubmit,
  loading = false,
  preSelectedProduct = null,
}) => {
  const { isAdmin } = useAuth();
  const { godownNames } = useGodowns();
  const activeGodowns = godownNames && godownNames.length > 0 ? godownNames : GODOWN_LOCATIONS;
  const initialDate = getCurrentLocalDateTime();
  const initialFY = getFinancialYear(initialDate);

  // Auto-update real time for non-admins (editable only by admin)
  useEffect(() => {
    if (isAdmin) return;
    const updateTime = () => {
      const now = new Date();
      const nowStr = getCurrentLocalDateTime();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 5);
      setBillHeader((prev) => ({
        ...prev,
        transactionDate: nowStr,
        dispatchDate: dateStr,
        dispatchTime: timeStr,
      }));
    };
    updateTime();
    const timer = setInterval(updateTime, 5000);
    return () => clearInterval(timer);
  }, [isAdmin]);

  // Financial Year & Bill Prefix State
  const initialReason = 'Delivery Challan';
  const initialPrefix = REASON_PREFIX_MAP_OUT[initialReason] || 'DC';
  const [selectedFY, setSelectedFY] = useState(initialFY);
  const [billPrefix, setBillPrefix] = useState(initialPrefix);
  const [godownModalOpen, setGodownModalOpen] = useState(false);
  const availableFinancialYears = getFinancialYearsList(6, 3);

  const now = new Date();
  const defaultDateStr = now.toISOString().slice(0, 10);
  const defaultTimeStr = now.toTimeString().slice(0, 5);

  const [sameAsBillTo, setSameAsBillTo] = useState(true);

  // 1. Dispatch & Consignee Header at TOP
  const [billHeader, setBillHeader] = useState({
    personName: '',
    place: '',
    receiverPhone: '',
    state: 'Jharkhand',
    buyerGstin: '',
    shipToName: '',
    shipToAddress: '',
    shipToPhone: '',
    shipToState: 'Jharkhand',
    placeOfSupply: 'Jharkhand',
    natureOfTransaction: 'B2B Solar Product Supply',
    paymentTerms: '100% Advance Payment before dispatch',
    transport: 'SafeXpress / Road Transport Logistics',
    driverName: '',
    driverPhone: '',
    vehicleNo: '',
    dispatchDate: defaultDateStr,
    dispatchTime: defaultTimeStr,
    refProposal: '',
    reason: initialReason,
    customReason: '',
    referenceNo: generateBillNumberForFY(initialFY, [], initialPrefix),
    transactionDate: initialDate,
    notes: '',
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Category View Mode: 'all' (all 15 categories visible) | 'scroll' (horizontal scrollbar with left/right navigation)
  const [categoryViewMode, setCategoryViewMode] = useState('all');
  const categoryScrollRefs = useRef({});

  const handleCategoryScroll = (itemIdx, direction) => {
    const el = categoryScrollRefs.current[itemIdx];
    if (el) {
      el.scrollBy({ left: direction * 260, behavior: 'smooth' });
    }
  };

  // Universal Contact Directory & Modal State
  const [pastTransactions, setPastTransactions] = useState([]);
  const [allDirectory, setAllDirectory] = useState([]);
  const [showDirectoryDropdown, setShowDirectoryDropdown] = useState(false);
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalFilterTab, setModalFilterTab] = useState('all'); // all, out, in
  const directoryDropdownRef = useRef(null);

  // Fetch all transactions and product senders for universal directory search
  useEffect(() => {
    const loadDirectoryData = async () => {
      try {
        const txRes = await stockService.getTransactions({ limit: 1000 });
        const txs = txRes?.data || [];
        setPastTransactions(txs);

        const list = [];

        // 1. Transactions (both outward dispatches & inward suppliers)
        txs.forEach((t) => {
          if (t.personName && t.personName.trim()) {
            list.push({
              name: t.personName.trim(),
              place: t.place ? t.place.trim() : '',
              type: t.type === 'out' ? 'Dispatch Client' : 'Supplier / Vendor',
              rawType: t.type || 'out',
              reason: t.reason || '',
              referenceNo: t.referenceNo || '',
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
              type: 'Material Sender / Supplier',
              rawType: 'in',
              reason: p.senderReason || 'Product Inward',
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
    toast.success(`Generated Bill Sequence for FY ${newFY}`);
  };

  // Handle Bill Prefix change (e.g. BILL, INV, DC)
  const handlePrefixChange = (newPrefix) => {
    setBillPrefix(newPrefix);
    const newBillNo = generateBillNumberForFY(selectedFY, pastTransactions, newPrefix);
    setBillHeader((prev) => ({
      ...prev,
      referenceNo: newBillNo,
    }));
  };

  // 2. Multi-Item Bill Array with categoryTab filter per item
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
        const autoPrefix = REASON_PREFIX_MAP_OUT[value] || 'OUT';
        setBillPrefix(autoPrefix);
        updated.referenceNo = generateBillNumberForFY(selectedFY, pastTransactions, autoPrefix);
      }
      if (name === 'transactionDate') {
        // Automatically sync Financial Year & Bill Number when date changes
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
      place: cust.place || prev.place,
      receiverPhone: cust.phone || prev.receiverPhone,
    }));
    setShowDirectoryDropdown(false);
    setIsDirectoryModalOpen(false);
    setErrors((prev) => ({ ...prev, personName: '', place: '' }));
    toast.success(`Selected: ${cust.name || cust.personName}`);
  };

  const filteredInlineDirectory = allDirectory.filter((c) => {
    const q = (billHeader.personName || '').toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.place && c.place.toLowerCase().includes(q))
    );
  });

  const filteredModalDirectory = allDirectory.filter((item) => {
    if (modalFilterTab === 'out' && item.rawType !== 'out') return false;
    if (modalFilterTab === 'in' && item.rawType !== 'in') return false;

    const term = modalSearchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      item.name.toLowerCase().includes(term) ||
      (item.place && item.place.toLowerCase().includes(term)) ||
      (item.reason && item.reason.toLowerCase().includes(term)) ||
      (item.type && item.type.toLowerCase().includes(term))
    );
  });

  const handleItemCategoryTab = (index, tabId) => {
    setBillItems((prev) => {
      const updated = [...prev];
      const currentItem = updated[index];
      const activeTabDef = CATEGORY_TABS.find((t) => t.id === tabId);

      const currentProd = products.find((p) => p.id === parseInt(currentItem.productId, 10));
      const isCurrentProdInTab =
        tabId === 'all' || (currentProd && activeTabDef?.match && activeTabDef.match(currentProd));

      updated[index] = {
        ...currentItem,
        categoryTab: tabId,
        productId: isCurrentProdInTab ? currentItem.productId : '',
        selectedSerials: isCurrentProdInTab ? currentItem.selectedSerials : [],
      };
      return updated;
    });
  };

  const handleItemChange = (index, field, value) => {
    setBillItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (field === 'productId') {
        updated[index].selectedSerials = [];
        const chosen = products.find((p) => p.id === parseInt(value, 10));
        if (chosen) {
          const matchingTab = CATEGORY_TABS.find((t) => t.match && t.match(chosen));
          if (matchingTab) {
            updated[index].categoryTab = matchingTab.id;
          }
          updated[index].unitRate = chosen.price ? String(chosen.price) : '26000';
          if (!updated[index].gstRate) updated[index].gstRate = '5';
        }
      }
      return updated;
    });
    setErrors((prev) => ({ ...prev, [`item_${index}_${field}`]: '' }));
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
      toast.error('Bill must contain at least one item');
      return;
    }
    setBillItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const toggleSerial = (itemIndex, serial) => {
    setBillItems((prev) => {
      const updated = [...prev];
      const currentSerials = updated[itemIndex].selectedSerials || [];
      const exists = currentSerials.includes(serial);
      const newSerials = exists
        ? currentSerials.filter((s) => s !== serial)
        : [...currentSerials, serial];

      updated[itemIndex] = {
        ...updated[itemIndex],
        selectedSerials: newSerials,
        quantity: newSerials.length > 0 ? String(newSerials.length) : updated[itemIndex].quantity,
      };
      return updated;
    });
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
    toast.success(`Added serial: ${currentVal}`);
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

    toast.success(`Added ${scannedList.length} serial(s)`);
  };

  const validate = () => {
    const errs = {};
    if (!billHeader.personName?.trim()) {
      errs.personName = 'Receiver / Consignee person name is required at the top';
    }
    if (!billHeader.place?.trim()) {
      errs.place = 'Project site / Destination location is required';
    }
    if (billHeader.reason === 'Other' && !billHeader.customReason?.trim()) {
      errs.customReason = 'Please specify custom dispatch reason';
    }

    billItems.forEach((item, idx) => {
      if (!item.productId) {
        errs[`item_${idx}_productId`] = 'Select an equipment item';
      } else {
        const prod = products.find((p) => p.id === parseInt(item.productId, 10));
        const qty = parseInt(item.quantity, 10);
        if (!item.quantity || isNaN(qty) || qty <= 0) {
          errs[`item_${idx}_quantity`] = 'Quantity must be at least 1';
        } else if (prod && qty > prod.quantity) {
          errs[`item_${idx}_quantity`] = `Max available: ${prod.quantity} ${prod.unit || 'pcs'}`;
        }
      }
    });

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please fix the highlighted fields in the bill');
    }
    return Object.keys(errs).length === 0;
  };

  const calculateCurrentInvoiceData = () => {
    let taxableAmount = 0;
    let gstAmount = 0;
    const items = billItems.map((item) => {
      const prod = products.find((p) => p.id === parseInt(item.productId, 10));
      const qty = parseInt(item.quantity, 10) || 1;
      const rate = parseFloat(item.unitRate) || parseFloat(prod?.price) || 26000;
      const gst = parseFloat(item.gstRate) || 5;
      const lineTaxable = rate * qty;
      const lineGst = lineTaxable * (gst / 100);
      const total = lineTaxable + lineGst;
      taxableAmount += lineTaxable;
      gstAmount += lineGst;
      return {
        description: prod?.name || 'Solar Equipment Item',
        brand: prod?.brand || '',
        itemCode: prod?.sku || '',
        hsn: prod?.hsn || getHSNCode(prod),
        quantity: qty,
        unit: prod?.unit || 'pcs',
        unitRate: rate,
        gstRate: `${gst}%`,
        total,
        serialNumbers: item.selectedSerials || [],
      };
    });

    const shortFY = (selectedFY.split('-')[0] || '').slice(-2);
    const defaultRefProp = `RSP-${shortFY}-001`;

    // Format dispatch time to 12-hour format e.g. "06:40 PM" if needed
    let formattedTime = billHeader.dispatchTime || '';
    if (formattedTime && formattedTime.includes(':')) {
      const [h, m] = formattedTime.split(':');
      const hourNum = parseInt(h, 10);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const h12 = hourNum % 12 || 12;
      formattedTime = `${String(h12).padStart(2, '0')}:${m} ${ampm}`;
    }

    const challanDate = billHeader.dispatchDate
      ? formatDate(new Date(billHeader.dispatchDate))
      : formatDate(billHeader.transactionDate || new Date());

    const activeBuyer = {
      name: billHeader.personName?.trim() || 'Abdul Aziz',
      place: billHeader.place?.trim() || 'Bariyatu',
      state: billHeader.state?.trim() || 'Jharkhand',
      phone: billHeader.receiverPhone?.trim() || '',
      gstin: billHeader.buyerGstin?.trim() || '',
    };

    const activeConsignee = sameAsBillTo
      ? {
          name: activeBuyer.name,
          place: activeBuyer.place,
          state: activeBuyer.state,
          phone: activeBuyer.phone,
        }
      : {
          name: billHeader.shipToName?.trim() || activeBuyer.name,
          place: billHeader.shipToAddress?.trim() || activeBuyer.place,
          state: billHeader.shipToState?.trim() || activeBuyer.state,
          phone: billHeader.shipToPhone?.trim() || activeBuyer.phone,
        };

    return {
      invoiceNo: billHeader.referenceNo || `INV-${shortFY}-001`,
      date: challanDate,
      time: formattedTime,
      driverName: billHeader.driverName?.trim() || '',
      driverPhone: billHeader.driverPhone?.trim() || '',
      vehicleNo: billHeader.vehicleNo?.trim() || '',
      refProposal: billHeader.refProposal || defaultRefProp,
      buyer: activeBuyer,
      consignee: activeConsignee,
      supply: {
        placeOfSupply: billHeader.placeOfSupply || 'Jharkhand',
        natureOfTransaction: billHeader.natureOfTransaction || 'B2B Solar Product Supply',
        paymentTerms: billHeader.paymentTerms || '100% Advance Payment before dispatch',
        transport: billHeader.transport || 'SafeXpress / Road Transport Logistics',
        driverName: billHeader.driverName?.trim() || '',
        driverPhone: billHeader.driverPhone?.trim() || '',
        vehicleNo: billHeader.vehicleNo?.trim() || '',
        dispatchDate: challanDate,
        dispatchTime: formattedTime,
        status: 'ISSUED',
      },
      items,
      totals: {
        taxableAmount,
        gstAmount,
        grandTotal: taxableAmount + gstAmount,
      },
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const invoiceData = calculateCurrentInvoiceData();

    // Format dispatch time for submission
    const now = new Date();
    let formattedTime = billHeader.dispatchTime || '';
    if (formattedTime && formattedTime.includes(':')) {
      const [h, m] = formattedTime.split(':');
      const hourNum = parseInt(h, 10);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const h12 = hourNum % 12 || 12;
      formattedTime = `${String(h12).padStart(2, '0')}:${m} ${ampm}`;
    }

    const challanDate = billHeader.dispatchDate
      ? formatDate(new Date(billHeader.dispatchDate))
      : formatDate(billHeader.transactionDate || now);

    const finalDispatchTime = !isAdmin
      ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      : formattedTime;
    const finalDispatchDate = !isAdmin ? formatDate(now) : challanDate;

    const finalReason =
      billHeader.reason === 'Other' && billHeader.customReason?.trim()
        ? billHeader.customReason.trim()
        : billHeader.reason;

    const payload = {
      personName: billHeader.personName.trim(),
      place: billHeader.place.trim(),
      reason: finalReason,
      referenceNo: billHeader.referenceNo.trim(),
      transactionDate: !isAdmin
        ? new Date().toISOString()
        : billHeader.transactionDate
        ? new Date(billHeader.transactionDate).toISOString()
        : new Date().toISOString(),
      notes: [
        billHeader.notes?.trim() || '',
        billHeader.driverName ? `Driver: ${billHeader.driverName.trim()}` : '',
        billHeader.driverPhone ? `Driver Ph: ${billHeader.driverPhone.trim()}` : '',
        billHeader.vehicleNo ? `Vehicle: ${billHeader.vehicleNo.trim()}` : '',
        formattedTime ? `Time: ${formattedTime}` : '',
      ]
        .filter(Boolean)
        .join(' | '),
      receiverPhone: billHeader.receiverPhone?.trim() || '',
      state: billHeader.state?.trim() || 'Jharkhand',
      buyerGstin: billHeader.buyerGstin?.trim() || '',
      shipToName: sameAsBillTo ? billHeader.personName.trim() : (billHeader.shipToName?.trim() || billHeader.personName.trim()),
      shipToAddress: sameAsBillTo ? billHeader.place.trim() : (billHeader.shipToAddress?.trim() || billHeader.place.trim()),
      shipToPhone: sameAsBillTo ? billHeader.receiverPhone?.trim() : (billHeader.shipToPhone?.trim() || billHeader.receiverPhone?.trim()),
      shipToState: sameAsBillTo ? (billHeader.state?.trim() || 'Jharkhand') : (billHeader.shipToState?.trim() || 'Jharkhand'),
      placeOfSupply: billHeader.placeOfSupply?.trim() || 'Jharkhand',
      natureOfTransaction: billHeader.natureOfTransaction?.trim() || 'B2B Solar Product Supply',
      paymentTerms: billHeader.paymentTerms?.trim() || '100% Advance Payment before dispatch',
      transport: billHeader.transport?.trim() || 'SafeXpress / Road Transport Logistics',
      driverName: billHeader.driverName?.trim() || '',
      driverPhone: billHeader.driverPhone?.trim() || '',
      vehicleNo: billHeader.vehicleNo?.trim() || '',
      dispatchDate: finalDispatchDate,
      dispatchTime: finalDispatchTime,
      refProposal: billHeader.refProposal?.trim() || '',
      items: billItems.map((item) => {
        const prod = products.find((p) => p.id === parseInt(item.productId, 10));
        return {
          productId: parseInt(item.productId, 10),
          quantity: parseInt(item.quantity, 10),
          unitRate: parseFloat(item.unitRate) || parseFloat(prod?.price) || 26000,
          gstRate: parseFloat(item.gstRate) || 5,
          serialNumbers: item.selectedSerials || [],
        };
      }),
    };

    onSubmit(payload, invoiceData);
  };

  // Calculations for Bill Summary
  const totalUnits = billItems.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0);
  const totalSerials = billItems.reduce((sum, item) => sum + (item.selectedSerials?.length || 0), 0);

  const activeScannerProd =
    activeScannerItemIndex !== null
      ? products.find((p) => p.id === parseInt(billItems[activeScannerItemIndex]?.productId, 10))
      : null;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. CONSIGNEE & BILL HEADER AT THE TOP */}
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
                1. Bill To (Buyer) & Ship To (Consignee) Details
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Set official billing recipient, delivery destination site, financial year sequence, and dispatch logistics
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
            Search All Clients & Sites ({allDirectory.length})
          </Button>
        </div>

        {/* 1A. SIDE-BY-SIDE: BILLED TO (LEFT) & SHIPPED TO (RIGHT) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
            marginBottom: '18px',
          }}
        >
          {/* Card A: BILLED TO (BUYER DETAILS) */}
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
              <span>🏢 Billed To (Buyer / Reseller Details)</span>
            </div>

            {/* Buyer Name with Fast Dropdown */}
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
                  Buyer / Company Name <span style={{ color: 'var(--danger)' }}>*</span>
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
                placeholder="e.g. Vikram Singh / Solar Project Head"
                value={billHeader.personName}
                onFocus={() => {
                  if (allDirectory.length > 0) setShowDirectoryDropdown(true);
                }}
                onChange={(e) => {
                  handleHeaderChange(e);
                  setShowDirectoryDropdown(true);
                }}
                error={errors.personName}
                helperText="Buyer name printed on Billed To card of Challan & Invoice"
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
                        Open Directory
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
                            {cust.name}
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
                              cust.rawType === 'out'
                                ? 'rgba(108, 92, 231, 0.12)'
                                : 'rgba(16, 185, 129, 0.12)',
                            color:
                              cust.rawType === 'out'
                                ? 'var(--primary-light)'
                                : 'var(--success)',
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

            {/* Buyer Place / Billing Address */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Billing Address / City <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {activeGodowns.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setBillHeader((prev) => ({ ...prev, place: `${loc}` }))}
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
                placeholder="e.g. Bariyatu, Ranchi, Jharkhand"
                value={billHeader.place}
                onChange={handleHeaderChange}
                error={errors.place}
                helperText="Registered billing address printed on Billed To card"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <Input
                  label="Buyer Contact Phone"
                  name="receiverPhone"
                  placeholder="e.g. 7739772921"
                  value={billHeader.receiverPhone}
                  onChange={handleHeaderChange}
                  helperText="Primary buyer phone"
                />
              </div>

              <div>
                <Input
                  label="Billing State"
                  name="state"
                  placeholder="e.g. Jharkhand"
                  value={billHeader.state}
                  onChange={handleHeaderChange}
                  helperText="State of buyer"
                />
              </div>
            </div>

            <div>
              <Input
                label="Buyer GSTIN / Tax ID (Optional)"
                name="buyerGstin"
                placeholder="e.g. 20AABCS1234F1Z5"
                value={billHeader.buyerGstin}
                onChange={handleHeaderChange}
                helperText="Optional GSTIN printed on tax invoice & challan"
              />
            </div>
          </div>

          {/* Card B: SHIPPED TO (CONSIGNEE / DELIVERY SITE) */}
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
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '8px',
                flexWrap: 'wrap',
                gap: '8px',
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
                }}
              >
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }}></span>
                <span>📍 Shipped To (Consignee / Site)</span>
              </div>

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: sameAsBillTo ? 'var(--primary-light)' : 'var(--text-secondary)',
                  backgroundColor: 'var(--surface)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                }}
              >
                <input
                  type="checkbox"
                  checked={sameAsBillTo}
                  onChange={(e) => setSameAsBillTo(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: '#1e3a8a' }}
                />
                <span>Same as Bill To</span>
              </label>
            </div>

            {sameAsBillTo ? (
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
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.875rem' }}>
                  ✓ Shipping details are synced with Billed To
                </div>
                <div style={{ color: '#334155' }}>
                  <strong>Consignee:</strong> {billHeader.personName || 'Same as Buyer Name'}
                </div>
                <div style={{ color: '#334155' }}>
                  <strong>Delivery Site:</strong> {billHeader.place || 'Same as Billing Address'}
                </div>
                <div style={{ color: '#334155' }}>
                  <strong>Destination State:</strong> {billHeader.state || 'Jharkhand'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  💡 To specify a separate delivery site address, site supervisor, or transfer godown, uncheck <strong>"Same as Bill To"</strong> above.
                </div>
              </div>
            ) : (
              <>
                <div>
                  <Input
                    icon={FiUser}
                    label="Consignee / Site Receiver Person"
                    name="shipToName"
                    placeholder="e.g. Ramesh Singh (Site Engineer / Consignee)"
                    value={billHeader.shipToName}
                    onChange={handleHeaderChange}
                    helperText="Person receiving goods at destination project site"
                  />
                </div>

                <div>
                  <Input
                    icon={FiMapPin}
                    label="Delivery Site / Project Installation Address"
                    name="shipToAddress"
                    placeholder="e.g. 50kW Rooftop Plant, Tupudana Industrial Area, Ranchi"
                    value={billHeader.shipToAddress}
                    onChange={handleHeaderChange}
                    helperText="Exact physical address where goods are unloaded"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <Input
                      label="Site Contact Phone"
                      name="shipToPhone"
                      placeholder="e.g. 9876543210"
                      value={billHeader.shipToPhone}
                      onChange={handleHeaderChange}
                      helperText="Site engineer / supervisor contact"
                    />
                  </div>

                  <div>
                    <Input
                      label="Destination State"
                      name="shipToState"
                      placeholder="e.g. Jharkhand"
                      value={billHeader.shipToState}
                      onChange={handleHeaderChange}
                      helperText="State of delivery"
                    />
                  </div>
                </div>
              </>
            )}
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
          <span>📄 Challan Document & Movement Particulars</span>
        </div>

        <div className="form-grid">
          {/* Dispatch Reason */}
          <div>
            <Input
              as="select"
              label="Dispatch Purpose / Movement Reason"
              name="reason"
              value={billHeader.reason}
              onChange={handleHeaderChange}
              required
            >
              {STOCK_REASONS.out.map((r) => (
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
                  placeholder="Specify exact dispatch purpose..."
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
                  backgroundColor: 'rgba(108, 92, 231, 0.12)',
                  color: 'var(--primary-light)',
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
              helperText="Generates bill numbers starting and numbered per financial year"
            >
              {availableFinancialYears.map((fy) => (
                <option key={fy} value={fy}>
                  Financial Year {fy} {fy === getFinancialYear(new Date()) ? '(Current Year)' : ''}
                </option>
              ))}
            </Input>
          </div>

          {/* Bill / Invoice Ref # with Prefix & Auto-Generate */}
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
                Bill / Invoice / Challan #
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={billPrefix}
                  onChange={(e) => handlePrefixChange(e.target.value)}
                  disabled={!isAdmin}
                  title={isAdmin ? "Select bill prefix" : "Prefix is auto-linked to outward reason (Admin can change)"}
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
                  <option value="DC">Prefix: DC/</option>
                  <option value="INV">Prefix: INV/</option>
                  <option value="RET">Prefix: RET/</option>
                  <option value="TRF">Prefix: TRF/</option>
                  <option value="OUT">Prefix: OUT/</option>
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
                    toast.success(`Bill number updated for FY ${selectedFY}`);
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

          {/* Date & Time with Financial Year Sync */}
          <div>
            <Input
              icon={FiCalendar}
              label={isAdmin ? "Date & Time of Dispatch (Admin Editable)" : "Date & Time of Dispatch (Auto-Captured)"}
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

          {/* Transport / Dispatch Logistics */}
          <div>
            <Input
              label="Transport / Logistics Partner"
              name="transport"
              placeholder="e.g. SafeXpress / Road Transport Logistics"
              value={billHeader.transport}
              onChange={handleHeaderChange}
              helperText="Carrier or logistics method printed on invoice"
            />
          </div>
        </div>

        {/* Driver, Vehicle & Dispatch Details for Delivery Challan */}
        <div
          style={{
            marginTop: '18px',
            paddingTop: '16px',
            borderTop: '1px dashed #e2e8f0',
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              color: '#1e3a8a',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🚚 Delivery Challan Driver & Vehicle Logistics</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
            }}
          >
            <div>
              <Input
                label="Vehicle Number"
                name="vehicleNo"
                placeholder="e.g. JH-01-AB-1234"
                value={billHeader.vehicleNo}
                onChange={handleHeaderChange}
                helperText="Vehicle reg no. printed on delivery challan"
              />
            </div>

            <div>
              <Input
                label="Driver Name"
                name="driverName"
                placeholder="e.g. Ramesh Kumar"
                value={billHeader.driverName}
                onChange={handleHeaderChange}
                helperText="Driver in charge of vehicle dispatch"
              />
            </div>

            <div>
              <Input
                label="Driver Contact No"
                name="driverPhone"
                placeholder="e.g. +91 98765 43210"
                value={billHeader.driverPhone}
                onChange={handleHeaderChange}
                helperText="Driver mobile for delivery verification"
              />
            </div>

            <div>
              <Input
                label={isAdmin ? "Dispatch Date (Admin Editable)" : "Dispatch Date (Auto-Captured)"}
                name="dispatchDate"
                type="date"
                value={billHeader.dispatchDate}
                onChange={isAdmin ? handleHeaderChange : undefined}
                disabled={!isAdmin}
                readOnly={!isAdmin}
                helperText={
                  isAdmin
                    ? "Challan movement date • Admin can adjust"
                    : "🔒 Auto-captured real date • Locked (Only Admin can edit)"
                }
              />
            </div>

            <div>
              <Input
                label={isAdmin ? "Dispatch Time (Admin Editable)" : "Dispatch Time (Auto-Captured)"}
                name="dispatchTime"
                type="time"
                value={billHeader.dispatchTime}
                onChange={isAdmin ? handleHeaderChange : undefined}
                disabled={!isAdmin}
                readOnly={!isAdmin}
                helperText={
                  isAdmin
                    ? "Gate-out movement time • Admin can adjust"
                    : "🔒 Auto-captured real time • Locked (Only Admin can edit)"
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. MULTI-ITEM DISPATCH BILL WITH CLEAN SEGMENTED CATEGORY TABS */}
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
                backgroundColor: 'rgba(244, 63, 94, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--danger)',
              }}
            >
              <FiShoppingBag size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                2. Items in this Dispatch Bill ({billItems.length})
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Add inverters, solar panels, MCBs, MSBs, wires, consumables, or spares
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
            const unitPrice = parseFloat(prod?.price) || 0;
            const itemQty = parseInt(item.quantity, 10) || 0;
            const rowTotal = itemQty * unitPrice;

            let availableSerials = [];
            if (prod && prod.serialNumbers) {
              try {
                availableSerials = Array.isArray(prod.serialNumbers)
                  ? prod.serialNumbers
                  : JSON.parse(prod.serialNumbers || '[]');
              } catch {
                availableSerials = [];
              }
            }

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
                      title="Remove this item from bill"
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
                      {/* Left/Right Smooth Scroll Controls in Scroll Mode */}
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
                          <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                            [{p.productType || 'Product'}] {p.name} ({p.sku}) {p.brand ? `• ${p.brand}` : ''} {p.capacity ? `(${p.capacity})` : ''} — Stock: {p.quantity} {p.unit || 'pcs'} {p.quantity === 0 ? '— (OUT OF STOCK)' : ''}
                          </option>
                        ))}
                      </Input>
                    </div>

                    <div>
                      <Input
                        label={`Quantity to Dispatch (${unit})`}
                        type="number"
                        min="1"
                        max={prod ? prod.quantity : undefined}
                        placeholder="e.g. 1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        error={errors[`item_${idx}_quantity`]}
                        helperText={prod ? `Max available: ${prod.quantity} ${unit}` : undefined}
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
                          backgroundColor: prod.quantity > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: prod.quantity > 0 ? '#059669' : '#dc2626',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          border: prod.quantity > 0 ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                        }}
                      >
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: prod.quantity > 0 ? '#10b981' : '#ef4444',
                          }}
                        />
                        <span>Warehouse Stock: {prod.quantity} {unit} available</span>
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
                          Scan barcodes, type serial numbers, or pick from available warehouse stock
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

                  {/* Available In-Stock Serials Picker */}
                  {availableSerials.length > 0 && (
                    <div style={{ paddingTop: '8px', borderTop: '1px dashed #cbd5e1' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '6px',
                          flexWrap: 'wrap',
                          gap: '6px',
                        }}
                      >
                        <span style={{ fontSize: '0.73rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          ⚡ Click to select from registered in-stock serials ({availableSerials.length} available):
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          Selected: {item.selectedSerials?.length || 0} / {availableSerials.length}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
                        {availableSerials.map((sn, snIdx) => {
                          const isSelected = item.selectedSerials?.includes(sn);
                          return (
                            <button
                              key={snIdx}
                              type="button"
                              onClick={() => toggleSerial(idx, sn)}
                              style={{
                                padding: '3px 9px',
                                borderRadius: '6px',
                                border: isSelected ? '1px solid #10b981' : '1px solid #cbd5e1',
                                backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.12)' : '#ffffff',
                                color: isSelected ? '#059669' : '#334155',
                                fontFamily: 'ui-monospace, monospace',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {isSelected ? <FiCheck size={12} color="#059669" /> : <FiZap size={11} color="#94a3b8" />}
                              <span>{sn}</span>
                            </button>
                          );
                        })}
                      </div>
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
            <span>+ Add Another Equipment / Material to this Bill</span>
          </button>
        </div>
      </div>

      {/* 3. LIVE DISPATCH SUMMARY */}
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
            Total Items in Bill
          </span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            {billItems.length} Distinct Products
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Units Dispatched
          </span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-light)', marginTop: '2px' }}>
            {totalUnits} Units
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Serial Numbers Attached
          </span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            {totalSerials} Serials
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Gate Pass Dispatch Status
          </span>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--success)', marginTop: '2px' }}>
            READY FOR DISPATCH
          </div>
        </div>
      </div>

      {/* 4. NOTES & SUBMIT DISPATCH BILL */}
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
          label="Dispatch Remarks / Gate Pass Notes"
          name="notes"
          placeholder="Enter driver details, vehicle number, carton seals, testing remarks..."
          value={billHeader.notes}
          onChange={handleHeaderChange}
          rows={2}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsPreviewOpen(true)}
            style={{
              padding: '12px 22px',
              fontSize: '0.95rem',
              fontWeight: 700,
            }}
          >
            👁️ Preview Delivery Challan
          </Button>

          <Button
            type="submit"
            variant="danger"
            loading={loading}
            icon={FiCheckCircle}
            style={{
              padding: '13px 32px',
              fontSize: '1rem',
              fontWeight: 800,
            }}
          >
            {loading
              ? 'Processing Multi-Item Bill...'
              : `Confirm & Generate Stock Out Bill (${billItems.length} Items)`}
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
          title={`Scan Barcodes for ${activeScannerProd?.name || 'Selected Item'}`}
        />
      )}

      {/* Universal Client & Contact Directory Search Modal */}
      <Modal
        isOpen={isDirectoryModalOpen}
        onClose={() => setIsDirectoryModalOpen(false)}
        title="Universal Client & Destination Site Directory"
        subtitle={`Search across all ${allDirectory.length} historical clients, project sites, and vendor contacts`}
        maxWidth="750px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Modal Search Bar */}
          <Input
            icon={FiSearch}
            placeholder="Search by receiver name, project site, delivery address, company..."
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
              All Records ({allDirectory.length})
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
          </div>

          {/* Directory Records List */}
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
                        {item.name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor:
                            item.rawType === 'out'
                              ? 'rgba(108, 92, 231, 0.12)'
                              : 'rgba(16, 185, 129, 0.12)',
                          color:
                            item.rawType === 'out'
                              ? 'var(--primary-light)'
                              : 'var(--success)',
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
                      <span>Dispatches/Movements: <strong>{item.count}</strong></span>
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

      {/* Live Tax Invoice Preview Modal */}
      {isPreviewOpen && (
        <TaxInvoiceModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          invoiceData={calculateCurrentInvoiceData()}
        />
      )}

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

export default StockOutForm;
