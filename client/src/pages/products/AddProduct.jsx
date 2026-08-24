import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import ProductForm from '../../components/products/ProductForm';
import Button from '../../components/common/Button';
import { productService } from '../../services/productService';
import toast from 'react-hot-toast';

const AddProduct = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (formData) => {
    setLoading(true);
    try {
      await productService.create(formData);
      toast.success('Product created successfully!');
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '100%', width: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/products">
          <Button variant="ghost" size="sm" icon={FiArrowLeft}>
            Back to Products
          </Button>
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h1 className="page-title" style={{ fontSize: '1.4rem' }}>
              Add New Product
            </h1>
            <p className="page-subtitle">Register a new item in the warehouse inventory</p>
          </div>
        </div>

        <ProductForm onSubmit={handleCreate} loading={loading} />
      </div>
    </div>
  );
};

export default AddProduct;
