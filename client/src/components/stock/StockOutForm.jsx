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
} from 'react-icons/fi';
import Input from '../common/Input';
import Button from '../common/Button';
import Modal from '../common/Modal';
import BarcodeScannerModal from '../common/BarcodeScannerModal';
import { STOCK_REASONS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  getFinancialYear,
  generateBillNumber,
  generateBillNumberForFY,
  getFinancialYearsList,
  formatDateTime,
} from '../../utils/formatDate';
import { stockService } from '../../services/stockService';
import { customerService } from '../../services/customerService';
import toast from 'react-hot-toast';

export const CATEGORY_TABS = [
  { id: 'all', label: 'All Items', icon: FiLayers },
  {
    id: 'inverters',
    label: '⚡ Inverters',
    match: (p) => {
      const type = (p.productType || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      const sku = (p.sku || '').toUpperCase();
      return (
        type.includes('inverter') ||
        cat.includes('inverter') ||
        name.includes('inverter') ||
        sku.startsWith('OGI') ||
        sku.startsWith('HYB')
      );
    },
  },
  {
    id: 'panels',
    label: '☀️ Solar Panels',
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
    id: 'spares',
    label: '🛡️ Spare',
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
];

const StockOutForm = ({
  products = [],
  onSubmit,
  loading = false,
  preSelectedProduct = null,
  prefillCustomer = null,
}) => {
  const initialDate = new Date().toISOString().slice(0, 16);
  const initialFY = getFinancialYear(initialDate);

  // Financial Year & Bill Prefix State
  const [selectedFY, setSelectedFY] = useState(initialFY);
  const [billPrefix, setBillPrefix] = useState('BILL');
  const availableFinancialYears = getFinancialYearsList(6, 3);

  // 1. Customer Header at TOP
  const [billHeader, setBillHeader] = useState({
    personName: prefillCustomer?.personName || '',
    place: prefillCustomer?.place || '',
    reason: prefillCustomer?.reason || 'Project Site Dispatch',
    referenceNo: prefillCustomer?.referenceNo || generateBillNumberForFY(initialFY, [], 'BILL'),
    transactionDate: initialDate,
    notes: '',
  });

  useEffect(() => {
    if (prefillCustomer) {
      setBillHeader((prev) => ({
        ...prev,
        personName: prefillCustomer.personName || prev.personName,
        place: prefillCustomer.place || prev.place,
        reason: prefillCustomer.reason || prev.reason,
        referenceNo: prefillCustomer.referenceNo || prev.referenceNo,
      }));
    }
  }, [prefillCustomer]);

  // Universal Customer Directory & Modal State
  const [pastTransactions, setPastTransactions] = useState([]);
  const [allDirectory, setAllDirectory] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalFilterTab, setModalFilterTab] = useState('all'); // all, out, in
  const customerDropdownRef = useRef(null);

  // Fetch all transactions, registered customers, and product senders for universal search
  useEffect(() => {
    const loadDirectoryData = async () => {
      try {
        const [txRes, custRes] = await Promise.allSettled([
          stockService.getTransactions({ limit: 1000 }),
          customerService.getAll({ limit: 1000 }),
        ]);

        const txs = txRes.status === 'fulfilled' ? txRes.value.data || [] : [];
        const registeredCustomers = custRes.status === 'fulfilled' ? custRes.value.data || [] : [];
        setPastTransactions(txs);

        const list = [];

        // 1. Registered BD Customers
        registeredCustomers.forEach((c) => {
          if (c.customerName && c.customerName.trim()) {
            list.push({
              name: c.customerName.trim(),
              place: c.address ? c.address.trim() : '',
              type: `Registered BD Lead (${c.systemType || 'Solar'}${c.capacity ? ` - ${c.capacity}` : ''})`,
              rawType: 'out',
              reason: `Project Dispatch - ${c.systemType || 'Solar'}`,
              referenceNo: c.uniqueId || '',
              date: c.dateOfVisit || c.createdAt,
            });
          }
        });

        // 2. Transactions (both outward clients & inward suppliers)
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

  // Close customer dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
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
      selectedSerials: [],
    },
  ]);

  const [activeScannerItemIndex, setActiveScannerItemIndex] = useState(null);
  const [errors, setErrors] = useState({});

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setBillHeader((prev) => {
      const updated = { ...prev, [name]: value };
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

  const handleSelectCustomer = (cust) => {
    setBillHeader((prev) => ({
      ...prev,
      personName: cust.name || cust.personName,
      place: cust.place || prev.place,
    }));
    setShowCustomerDropdown(false);
    setIsCustomerModalOpen(false);
    setErrors((prev) => ({ ...prev, personName: '', place: '' }));
    toast.success(`Selected: ${cust.name || cust.personName}`);
  };

  const filteredInlineCustomers = allDirectory.filter((c) => {
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

  const handleAddScannedSerials = (scannedList) => {
    if (activeScannerItemIndex === null) return;
    const item = billItems[activeScannerItemIndex];
    const prod = products.find((p) => p.id === parseInt(item.productId, 10));
    if (!prod) return;

    let available = [];
    try {
      available = Array.isArray(prod.serialNumbers)
        ? prod.serialNumbers
        : JSON.parse(prod.serialNumbers || '[]');
    } catch {
      available = [];
    }

    const valid = scannedList.filter((s) => available.includes(s));
    if (valid.length === 0) {
      toast.error('Scanned serials do not match available stock for this product');
      return;
    }

    setBillItems((prev) => {
      const updated = [...prev];
      const currentSerials = updated[activeScannerItemIndex].selectedSerials || [];
      const merged = Array.from(new Set([...currentSerials, ...valid]));
      updated[activeScannerItemIndex] = {
        ...updated[activeScannerItemIndex],
        selectedSerials: merged,
        quantity: String(merged.length),
      };
      return updated;
    });

    toast.success(`Selected ${valid.length} serial(s) for ${prod.name}`);
  };

  const validate = () => {
    const errs = {};
    if (!billHeader.personName?.trim()) {
      errs.personName = 'Customer / Receiver person name is required at the top';
    }
    if (!billHeader.place?.trim()) {
      errs.place = 'Project site / Destination location is required';
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      personName: billHeader.personName.trim(),
      place: billHeader.place.trim(),
      reason: billHeader.reason,
      referenceNo: billHeader.referenceNo.trim(),
      transactionDate: billHeader.transactionDate
        ? new Date(billHeader.transactionDate).toISOString()
        : new Date().toISOString(),
      notes: billHeader.notes.trim(),
      items: billItems.map((item) => ({
        productId: parseInt(item.productId, 10),
        quantity: parseInt(item.quantity, 10),
        serialNumbers: item.selectedSerials || [],
      })),
    };

    onSubmit(payload);
  };

  // Calculations for Bill Summary
  const totalUnits = billItems.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0);
  const totalBillValuation = billItems.reduce((sum, item) => {
    const prod = products.find((p) => p.id === parseInt(item.productId, 10));
    const qty = parseInt(item.quantity, 10) || 0;
    const price = parseFloat(prod?.price) || 0;
    return sum + qty * price;
  }, 0);

  const activeScannerProd =
    activeScannerItemIndex !== null
      ? products.find((p) => p.id === parseInt(billItems[activeScannerItemIndex]?.productId, 10))
      : null;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. CUSTOMER & BILL HEADER AT THE TOP */}
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
                1. Customer & Dispatch Destination Particulars
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Select client from history, choose financial year, and auto-generate official bill number
              </span>
            </div>
          </div>

          {/* Quick Universal Directory Search Button */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={FiSearch}
            onClick={() => setIsCustomerModalOpen(true)}
            style={{ fontWeight: 600 }}
          >
            Search All Clients & Sites ({allDirectory.length})
          </Button>
        </div>

        <div className="form-grid">
          {/* Customer / Receiver Name with Fast Inline Dropdown */}
          <div style={{ position: 'relative' }} ref={customerDropdownRef}>
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
                Customer / Receiver Person Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              {allDirectory.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCustomerDropdown((prev) => !prev)}
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
                  {showCustomerDropdown
                    ? 'Hide List'
                    : `Browse ${allDirectory.length} Past Records`}
                </button>
              )}
            </div>

            <Input
              icon={FiUser}
              name="personName"
              placeholder="e.g. Vikram Singh (Client Project Head)"
              value={billHeader.personName}
              onFocus={() => {
                if (allDirectory.length > 0) setShowCustomerDropdown(true);
              }}
              onChange={(e) => {
                handleHeaderChange(e);
                setShowCustomerDropdown(true);
              }}
              error={errors.personName}
              helperText="Type customer name or search & pick from all past records"
              required
            />

            {/* Fast Inline Suggestions Popover */}
            {showCustomerDropdown && allDirectory.length > 0 && (
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
                  <span>Select from Past Records ({filteredInlineCustomers.length})</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomerDropdown(false);
                        setIsCustomerModalOpen(true);
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
                      onClick={() => setShowCustomerDropdown(false)}
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

                {filteredInlineCustomers.length === 0 ? (
                  <div
                    style={{
                      padding: '14px',
                      textAlign: 'center',
                      fontSize: '0.8125rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    No matching record found (entering as new name)
                  </div>
                ) : (
                  filteredInlineCustomers.map((cust, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectCustomer(cust)}
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

          {/* Place / Destination */}
          <div>
            <Input
              icon={FiMapPin}
              label="Place / Project Site / Delivery Address"
              name="place"
              placeholder="e.g. 100kW Rooftop Solar Project - Site B, Jaipur"
              value={billHeader.place}
              onChange={handleHeaderChange}
              error={errors.place}
              helperText="Project installation address or client delivery site"
              required
            />
          </div>

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
                  <option value="BILL">Prefix: BILL/</option>
                  <option value="INV">Prefix: INV/</option>
                  <option value="DC">Prefix: DC/</option>
                  <option value="CHALLAN">Prefix: CHALLAN/</option>
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
              onChange={handleHeaderChange}
              helperText={`Auto-sequenced for FY ${selectedFY} (updates if financial year or date changes)`}
            />
          </div>

          {/* Date & Time with Financial Year Sync */}
          <div>
            <Input
              icon={FiCalendar}
              label="Date & Time of Dispatch"
              name="transactionDate"
              type="datetime-local"
              value={billHeader.transactionDate}
              onChange={handleHeaderChange}
              helperText={`Selected Date belongs to Financial Year: ${getFinancialYear(billHeader.transactionDate)}`}
              required
            />
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
            + Add Another Item
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
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '20px',
                  position: 'relative',
                }}
              >
                {/* Item Row Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '14px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      📦 ITEM #{idx + 1}
                    </span>
                    {prod && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: 'var(--surface)',
                          color: 'var(--primary-light)',
                          border: '1px solid var(--border)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {prod.productType || prod.category}
                      </span>
                    )}
                  </div>

                  {billItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px',
                      }}
                      title="Remove this item from bill"
                    >
                      <FiTrash2 size={13} />
                      <span>Remove Item</span>
                    </button>
                  )}
                </div>

                {/* HORIZONTAL CATEGORY TAB BAR */}
                <div style={{ marginBottom: '14px' }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      overflowX: 'auto',
                      paddingBottom: '4px',
                      scrollbarWidth: 'thin',
                    }}
                  >
                    {CATEGORY_TABS.map((tab) => {
                      const isActive = currentTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleItemCategoryTab(idx, tab.id)}
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

                {/* 1. Full-Width Product Selection Dropdown */}
                <div style={{ marginBottom: '14px' }}>
                  <Input
                    as="select"
                    label={`Select Equipment / Item (${filteredProducts.length} available in ${activeTabDef?.label || 'tab'})`}
                    value={item.productId}
                    onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                    error={errors[`item_${idx}_productId`]}
                    required
                  >
                    <option value="">
                      {filteredProducts.length === 0
                        ? `-- No products found in this category --`
                        : `-- Choose Equipment / Item (${filteredProducts.length} available) --`}
                    </option>
                    {filteredProducts.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                        [{p.productType || 'Product'}] {p.name} ({p.sku}) {p.brand ? `• ${p.brand}` : ''} {p.capacity ? `(${p.capacity})` : ''} {p.phase ? `[${p.phase}]` : ''} {p.dcrType ? `[${p.dcrType}]` : ''} — Stock: {p.quantity} {p.unit || 'pcs'} {p.quantity === 0 ? '— (OUT OF STOCK)' : ''}
                      </option>
                    ))}
                  </Input>
                </div>

                {/* 2. Quantity Row */}
                <div>
                  <Input
                    label={`Quantity to Dispatch (${unit})`}
                    type="number"
                    min="1"
                    max={prod ? prod.quantity : undefined}
                    placeholder="e.g. 5"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    error={errors[`item_${idx}_quantity`]}
                    helperText={prod ? `Available in warehouse: ${prod.quantity} ${unit}` : undefined}
                    required
                  />
                </div>

                {/* Serial Numbers Selection (If product has serials) */}
                {availableSerials.length > 0 && (
                  <div
                    style={{
                      marginTop: '14px',
                      paddingTop: '12px',
                      borderTop: '1px dashed var(--border)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                        flexWrap: 'wrap',
                        gap: '6px',
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        ⚡ Select Serials ({item.selectedSerials?.length || 0} of {availableSerials.length} chosen):
                      </span>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={FiCamera}
                        onClick={() => setActiveScannerItemIndex(idx)}
                      >
                        Scan Barcode
                      </Button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '90px', overflowY: 'auto' }}>
                      {availableSerials.map((sn, snIdx) => {
                        const isSelected = item.selectedSerials?.includes(sn);
                        return (
                          <button
                            key={snIdx}
                            type="button"
                            onClick={() => toggleSerial(idx, sn)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              border: isSelected ? '1px solid var(--primary-light)' : '1px solid var(--border)',
                              backgroundColor: isSelected ? 'rgba(108, 92, 231, 0.15)' : 'var(--surface)',
                              color: isSelected ? 'var(--primary-light)' : 'var(--text-primary)',
                              fontFamily: 'ui-monospace, monospace',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {isSelected ? <FiCheck size={11} color="var(--primary-light)" /> : <FiZap size={10} color="var(--text-muted)" />}
                            <span>{sn}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
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

      {/* 3. LIVE BILL SUMMARY */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Items in Bill
          </span>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            {billItems.length} Distinct Products
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Units Dispatched
          </span>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-light)', marginTop: '2px' }}>
            {totalUnits} Units
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
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
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Universal Client & Destination Site Directory"
        subtitle={`Search across all ${allDirectory.length} historical clients, project sites, and vendor contacts`}
        maxWidth="750px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Modal Search Bar */}
          <Input
            icon={FiSearch}
            placeholder="Search by customer name, project site, delivery address, company..."
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
                    onClick={() => handleSelectCustomer(item)}
                    style={{ flexShrink: 0 }}
                  >
                    Select & Apply
                  </Button>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsCustomerModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  );
};

export default StockOutForm;
