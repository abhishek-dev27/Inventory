import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { FiPlus, FiBox, FiFileText, FiPrinter } from 'react-icons/fi';
import ProductTable from '../../components/products/ProductTable';
import ProductSearch from '../../components/products/ProductSearch';
import ProductDetails from '../../components/products/ProductDetails';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { productService } from '../../services/productService';
import { useAuth } from '../../hooks/useAuth';
import { exportProductCatalogPdf, triggerPrint } from '../../utils/exportPdf';
import toast from 'react-hot-toast';

const Products = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialType = location.state?.productType || searchParams.get('type') || '';
  const initialCategory = location.state?.category || searchParams.get('category') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [productType, setProductType] = useState(initialType);
  const [locationFilter, setLocationFilter] = useState('');
  const [availableTypes, setAvailableTypes] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const { isAdmin } = useAuth();

  const fetchMeta = async () => {
    try {
      const [tRes, cRes] = await Promise.allSettled([
        productService.getProductTypes(),
        productService.getCategories(),
      ]);
      if (tRes.status === 'fulfilled' && tRes.value?.data) {
        setAvailableTypes(tRes.value.data);
      }
      if (cRes.status === 'fulfilled' && cRes.value?.data) {
        setAvailableCategories(cRes.value.data);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAll({
        page,
        limit: 20,
        search: searchTerm,
        category,
        productType,
        location: locationFilter,
      });
      setProducts(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(debounce);
  }, [searchTerm, category, productType, locationFilter, page]);

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      await productService.delete(deleteCandidate.id);
      toast.success('Product deleted successfully');
      setDeleteCandidate(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products Directory</h1>
          <p className="page-subtitle">Manage catalog items, pricing, SKU codes, and godown stock</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            icon={FiFileText}
            onClick={() => exportProductCatalogPdf(products, { category, productType, searchTerm })}
            disabled={products.length === 0}
          >
            Export PDF
          </Button>
          <Button
            variant="secondary"
            icon={FiPrinter}
            onClick={triggerPrint}
            disabled={products.length === 0}
          >
            Print Sheet
          </Button>
          <Link to="/products/add">
            <Button variant="primary" icon={FiPlus}>
              Add New Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <ProductSearch
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setPage(1);
        }}
        productType={productType}
        onProductTypeChange={(val) => {
          setProductType(val);
          setPage(1);
        }}
        category={category}
        onCategoryChange={(val) => {
          setCategory(val);
          setPage(1);
        }}
        location={locationFilter}
        onLocationChange={(val) => {
          setLocationFilter(val);
          setPage(1);
        }}
        categories={availableCategories}
        productTypes={availableTypes}
      />

      {/* Table Content */}
      {loading ? (
        <Loader text="Loading products..." />
      ) : (
        <>
          <ProductTable
            products={products}
            onViewDetails={(p) => setSelectedProduct(p)}
            onDelete={(p) => setDeleteCandidate(p)}
            isAdmin={isAdmin}
          />

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={page === p ? 'active' : ''}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page === pagination.pages}
                onClick={() => setPage((prev) => Math.min(prev + 1, pagination.pages))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Details View Modal */}
      <ProductDetails
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteCandidate?.name}" (${deleteCandidate?.sku})? This cannot be undone.`}
        confirmText="Delete Product"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default Products;
