import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  FiPieChart,
  FiZap,
  FiSun,
  FiSliders,
  FiBox,
  FiActivity,
  FiTool,
  FiShield,
  FiLayers,
  FiPackage,
  FiCheckCircle,
  FiArrowUpRight,
} from 'react-icons/fi';

const CATEGORY_META = {
  'Ongrid Inverter': { color: '#6366f1', icon: FiZap, label: 'Ongrid Inverter' },
  'Hybrid Inverter': { color: '#8b5cf6', icon: FiZap, label: 'Hybrid Inverter' },
  'Panels': { color: '#f59e0b', icon: FiSun, label: 'Solar Panels' },
  'MCB': { color: '#ec4899', icon: FiSliders, label: 'MCB (1/2/4 Phase)' },
  'MSB': { color: '#06b6d4', icon: FiBox, label: 'MSB / Switchgear' },
  'Wires': { color: '#3b82f6', icon: FiActivity, label: 'Wires & DC Cables' },
  'Structure': { color: '#10b981', icon: FiLayers, label: 'Mounting Structure' },
  'Consumable': { color: '#f97316', icon: FiTool, label: 'Consumables' },
  'Spare': { color: '#eab308', icon: FiShield, label: 'Spares & RMA' },
  'Other': { color: '#64748b', icon: FiPackage, label: 'Other Products' },
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const meta = CATEGORY_META[data.name] || CATEGORY_META['Other'];
    const Icon = meta.icon;

    return (
      <div
        style={{
          backgroundColor: '#090d16',
          color: '#ffffff',
          padding: '12px 16px',
          borderRadius: '12px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
          border: `1px solid ${meta.color}`,
          fontFamily: 'var(--font-sans)',
          minWidth: '200px',
          zIndex: 99999,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: meta.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Icon size={13} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff' }}>
            {data.name}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span>Available Stock:</span>
            <span style={{ fontWeight: 700, color: '#ffffff' }}>{data.totalQuantity} Units</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span>Catalog Items:</span>
            <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{data.productCount} SKUs</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', paddingTop: '4px', borderTop: '1px solid #1e293b' }}>
            <span>Share of Stock:</span>
            <span style={{ fontWeight: 800, color: meta.color }}>
              {data.percentage ? `${data.percentage.toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop: '8px',
            fontSize: '0.72rem',
            color: '#c7d2fe',
            backgroundColor: 'rgba(99, 102, 241, 0.25)',
            padding: '4px 8px',
            borderRadius: '6px',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          👉 Click to open {data.name}
        </div>
      </div>
    );
  }
  return null;
};

const CategoryDistributionChart = ({ breakdown = [], totalStock = 0 }) => {
  const navigate = useNavigate();

  // Normalize data with colors and percentages based on stock units
  const chartData = (breakdown || []).map((item) => {
    const meta = CATEGORY_META[item.name] || CATEGORY_META['Other'];
    const qty = parseInt(item.totalQuantity, 10) || 0;
    const percentage = totalStock > 0 ? (qty / totalStock) * 100 : 0;

    return {
      ...item,
      value: qty,
      color: meta.color,
      icon: meta.icon,
      label: meta.label,
      percentage,
    };
  });

  const activeData = chartData.filter((d) => d.value > 0);

  const handleCategoryClick = (categoryName) => {
    navigate('/products', { state: { productType: categoryName } });
  };

  return (
    <div
      className="card"
      style={{
        padding: '24px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '18px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiPieChart size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Available Stock Distribution by Product Type
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Click any category or chart slice to view filtered items in the Products Catalog
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Circular Donut Chart (Left) + Detailed Category Legend Cards (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 340px) 1fr',
          gap: '24px',
          alignItems: 'center',
          minWidth: 0,
        }}
      >
        {/* Left: Circular Donut Graph */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '280px',
            minHeight: '280px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 0,
          }}
        >
          {activeData.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No inventory stock data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={activeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={108}
                  paddingAngle={4}
                  cornerRadius={6}
                  dataKey="value"
                  animationDuration={900}
                  onClick={(entry) => entry && entry.name && handleCategoryClick(entry.name)}
                  style={{ cursor: 'pointer' }}
                >
                  {activeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--surface)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{ zIndex: 99999, pointerEvents: 'none' }}
                  content={<CustomTooltip />}
                />
              </PieChart>
            </ResponsiveContainer>
          )}

          {/* Donut Center Counter Pill */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              zIndex: 2,
              backgroundColor: 'var(--surface)',
              width: '128px',
              height: '128px',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.03)',
            }}
          >
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: '0.04em',
                display: 'block',
              }}
            >
              Total Stock
            </span>
            <div
              style={{
                fontSize: '1.4rem',
                fontWeight: 900,
                color: 'var(--text-primary)',
                marginTop: '1px',
                letterSpacing: '-0.02em',
              }}
            >
              {totalStock} Units
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                color: 'var(--success)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                marginTop: '2px',
              }}
            >
              <FiCheckCircle size={10} /> Active In Stock
            </span>
          </div>
        </div>

        {/* Right: Detailed Category Cards Breakdown */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
            maxHeight: '300px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {chartData.map((item) => {
            const Icon = item.icon || FiBox;
            const hasStock = item.totalQuantity > 0;

            return (
              <div
                key={item.name}
                onClick={() => handleCategoryClick(item.name)}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: hasStock ? `1px solid var(--border)` : '1px dashed var(--border)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  opacity: hasStock ? 1 : 0.6,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 18px rgba(0,0,0,0.08)`;
                  e.currentTarget.style.borderColor = item.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = hasStock ? 'var(--border)' : 'var(--border)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={12} />
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: item.color,
                      }}
                    >
                      {item.percentage ? `${item.percentage.toFixed(1)}%` : '0%'}
                    </span>
                    <FiArrowUpRight size={12} color="var(--text-muted)" />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {item.productCount} SKU{item.productCount !== 1 ? 's' : ''}
                  </span>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>
                      {item.totalQuantity} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>units</span>
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    width: '100%',
                    height: '4px',
                    backgroundColor: 'rgba(0,0,0,0.06)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    marginTop: '2px',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(item.percentage, hasStock ? 4 : 0))}%`,
                      height: '100%',
                      backgroundColor: item.color,
                      borderRadius: '2px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryDistributionChart;
