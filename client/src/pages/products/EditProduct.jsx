import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import ProductForm from '../../components/products/ProductForm';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { productService } from '../../services/productService';
import toast from 'react-hot-toast';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productService.getById(id);
        setProduct(response.data);
      } catch (err) {
        toast.error('Failed to load product');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const handleUpdate = async (formData) => {
    setUpdating(true);
    try {
      await productService.update(id, formData);
      toast.success('Product updated successfully!');
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update product');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <Loader fullScreen text="Loading product details..." />;
  }

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
              Edit Product: {product?.name}
            </h1>
            <p className="page-subtitle">Update SKU, category, price, and threshold parameters</p>
          </div>
        </div>

        <ProductForm
          initialData={product}
          onSubmit={handleUpdate}
          loading={updating}
          isEdit
        />
      </div>
    </div>
  );
};

export default EditProduct;
