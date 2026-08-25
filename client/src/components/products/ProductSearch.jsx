import React from 'react';
import Input from '../common/Input';
import { FiSearch } from 'react-icons/fi';
import { CATEGORIES, PRODUCT_TYPES, GODOWN_LOCATIONS } from '../../utils/constants';

const TYPE_ICONS = {
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

const ProductSearch = ({
  searchTerm,
  onSearchChange,
  category,
  onCategoryChange,
  productType,
  onProductTypeChange,
  location,
  onLocationChange,
  categories = CATEGORIES,
  productTypes = PRODUCT_TYPES,
}) => {
  // Combine predefined PRODUCT_TYPES and any custom types from database
  const combinedTypes = Array.from(
    new Set([...PRODUCT_TYPES, ...(Array.isArray(productTypes) ? productTypes : [])])
  ).filter(Boolean);

  const combinedCategories = Array.from(
    new Set([...CATEGORIES, ...(Array.isArray(categories) ? categories : [])])
  ).filter(Boolean);

  const tabs = [
    { id: '', label: 'All Types' },
    ...combinedTypes.map((type) => {
      const icon = TYPE_ICONS[type] || '🏷️';
      return {
        id: type,
        label: `${icon} ${type}`,
      };
    }),
  ];

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Category Pills Ribbon - All Visible Together */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '16px',
          alignItems: 'center',
        }}
      >
        {tabs.map((tab) => {
          const isActive = (productType || '') === tab.id;
          return (
            <button
              key={tab.id || 'all'}
              type="button"
              onClick={() => onProductTypeChange && onProductTypeChange(tab.id)}
              style={{
                padding: '6px 13px',
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <div style={{ minWidth: '220px' }}>
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
            {combinedTypes.map((type) => (
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
            {combinedCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Input>
        </div>

        {onLocationChange && (
          <div>
            <Input
              as="select"
              value={location || ''}
              onChange={(e) => onLocationChange(e.target.value)}
            >
              <option value="">All Godowns</option>
              {GODOWN_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  🏢 {loc} Godown
                </option>
              ))}
            </Input>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSearch;
