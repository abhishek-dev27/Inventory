import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StockOutForm from '../../components/stock/StockOutForm';
import Loader from '../../components/common/Loader';
import { productService } from '../../services/productService';
import { stockService } from '../../services/stockService';
import toast from 'react-hot-toast';

const StockOut = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const preSelectedProduct = location.state?.selectedProduct || null;
  const prefillCustomer = location.state?.prefillCustomer || null;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getAll({ limit: 500 });
        setProducts(response.data || []);
      } catch (err) {
        toast.error('Failed to load products list');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleStockOut = async (formData) => {
    setSubmitting(true);
    try {
      await stockService.stockOut(formData);
      toast.success('Stock deducted successfully!');
      navigate('/stock/history');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deduct stock');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader fullScreen text="Loading products..." />;
  }

  return (
    <div className="page-container" style={{ maxWidth: '100%', width: '100%' }}>
      <div className="page-header" style={{ marginBottom: '22px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            Multi-Item Stock Outward & Dispatch Bill
          </h1>
          <p className="page-subtitle">
            Generate a single consolidated dispatch bill with customer details and multiple inventory items
          </p>
        </div>
      </div>

      <StockOutForm
        products={products}
        preSelectedProduct={preSelectedProduct}
        prefillCustomer={prefillCustomer}
        onSubmit={handleStockOut}
        loading={submitting}
      />
    </div>
  );
};

export default StockOut;
