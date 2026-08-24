import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StockInForm from '../../components/stock/StockInForm';
import Loader from '../../components/common/Loader';
import { productService } from '../../services/productService';
import { stockService } from '../../services/stockService';
import toast from 'react-hot-toast';

const StockIn = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const preSelectedProduct = location.state?.selectedProduct || null;

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

  const handleStockIn = async (formData) => {
    setSubmitting(true);
    try {
      await stockService.stockIn(formData);
      toast.success('Stock added successfully!');
      navigate('/stock/history');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add stock');
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
            Stock Inward Registration
          </h1>
          <p className="page-subtitle">Receive incoming goods, purchase orders, or client RMA returns</p>
        </div>
      </div>

      <StockInForm
        products={products}
        preSelectedProduct={preSelectedProduct}
        onSubmit={handleStockIn}
        loading={submitting}
      />
    </div>
  );
};

export default StockIn;
