import React from 'react';
import Input from '../common/Input';
import { FiSearch } from 'react-icons/fi';
import { CATEGORIES, PRODUCT_TYPES } from '../../utils/constants';

const QUICK_TABS = [
  { id: '', label: 'All Types' },
  { id: 'Ongrid Inverter', label: '⚡ Ongrid Inverter' },
  { id: 'Hybrid Inverter', label: '🔋 Hybrid Inverter' },
  { id: 'Panels', label: '☀️ Solar Panels' },
  { id: 'MCB', label: '⚡ MCB (1/2/4 Phase)' },
  { id: 'MSB', label: '🔌 MSB' },
  { id: 'Wires', label: '🧵 Wires' },
  { id: 'Structure', label: '🏗️ Structure' },
  { id: 'Consumable', label: '🔩 Consumable' },
  { id: 'Spare', label: '🛡️ Spare' },
];

const ProductSearch = ({
  searchTerm,
  onSearchChange,
  category,
  onCategoryChange,
  productType,
  onProductTypeChange,
  categories = CATEGORIES,
  productTypes = PRODUCT_TYPES,
}) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Category Pills Ribbon */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '12px',
          scrollbarWidth: 'thin',
        }}
      >
        {QUICK_TABS.map((tab) => {
          const isActive = (productType || '') === tab.id;
          return (
            <button
              key={tab.id || 'all'}
              type="button"
              onClick={() => onProductTypeChange && onProductTypeChange(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <div style={{ minWidth: '240px' }}>
          <Input
            icon={FiSearch}
            placeholder="Search by Unique ID, name, type, brand..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div>
          <Input
            as="select"
            value={productType || ''}
            onChange={(e) => onProductTypeChange && onProductTypeChange(e.target.value)}
          >
            <option value="">All Product Types</option>
            {productTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Input>
        </div>

        <div>
          <Input
            as="select"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Input>
        </div>
      </div>
    </div>
  );
};

export default ProductSearch;
