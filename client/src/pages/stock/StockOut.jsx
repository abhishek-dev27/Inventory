import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StockOutForm from '../../components/stock/StockOutForm';
import TaxInvoiceModal from '../../components/stock/TaxInvoiceModal';
import Loader from '../../components/common/Loader';
import { productService } from '../../services/productService';
import { stockService } from '../../services/stockService';
import { formatDate } from '../../utils/formatDate';
import { getHSNCode } from '../../utils/exportPdf';
import toast from 'react-hot-toast';

const StockOut = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

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

  const handleStockOut = async (formData, invoicePayload) => {
    setSubmitting(true);
    try {
      const response = await stockService.stockOut(formData);
      toast.success('Stock deducted successfully! Tax Invoice generated.');

      // Construct complete invoiceData
      const inv = invoicePayload || {
        invoiceNo: formData.referenceNo || response.billReference || 'INV-26-001',
        date: formData.dispatchDate ? formatDate(new Date(formData.dispatchDate)) : formatDate(formData.transactionDate || new Date()),
        time: formData.dispatchTime || '',
        driverName: formData.driverName || '',
        driverPhone: formData.driverPhone || '',
        vehicleNo: formData.vehicleNo || '',
        refProposal: formData.refProposal || `RSP-${(formData.referenceNo || '26-001').replace(/^[A-Z]+\//, '').replace(/^[A-Z]+-/, '')}`,
        buyer: {
          name: formData.personName,
          place: formData.place,
          state: formData.state || 'Jharkhand',
          phone: formData.receiverPhone || '',
          gstin: formData.buyerGstin || '',
        },
        consignee: {
          name: formData.shipToName || formData.personName,
          place: formData.shipToAddress || formData.place,
          state: formData.shipToState || formData.state || 'Jharkhand',
          phone: formData.shipToPhone || formData.receiverPhone || '',
        },
        supply: {
          placeOfSupply: formData.placeOfSupply || 'Jharkhand',
          natureOfTransaction: formData.natureOfTransaction || 'B2B Solar Product Supply',
          paymentTerms: formData.paymentTerms || '100% Advance Payment before dispatch',
          transport: formData.transport || 'SafeXpress / Road Transport Logistics',
          driverName: formData.driverName || '',
          driverPhone: formData.driverPhone || '',
          vehicleNo: formData.vehicleNo || '',
          dispatchDate: formData.dispatchDate || '',
          dispatchTime: formData.dispatchTime || '',
          status: 'ISSUED',
        },
        items: (formData.items || []).map((it) => {
          const prod = products.find((p) => p.id === it.productId);
          const rate = parseFloat(it.unitRate) || parseFloat(prod?.price) || 26000;
          const gst = parseFloat(it.gstRate) || 5;
          const qty = parseFloat(it.quantity) || 1;
          const total = rate * qty * (1 + gst / 100);
          return {
            description: prod?.name || 'Solar Equipment',
            brand: prod?.brand || '',
            itemCode: prod?.sku || '',
            hsn: prod?.hsn || getHSNCode(prod),
            quantity: qty,
            unit: prod?.unit || 'pcs',
            unitRate: rate,
            gstRate: `${gst}%`,
            total,
            serialNumbers: it.serialNumbers || [],
          };
        }),
      };

      // Compute totals if not computed
      let taxable = 0;
      let totalGst = 0;
      (inv.items || []).forEach((it) => {
        const rate = parseFloat(it.unitRate) || 0;
        const qty = parseFloat(it.quantity) || 0;
        const gst = parseFloat(String(it.gstRate).replace('%', '')) || 5;
        const lineTaxable = rate * qty;
        const lineGst = lineTaxable * (gst / 100);
        taxable += lineTaxable;
        totalGst += lineGst;
      });
      inv.totals = {
        taxableAmount: taxable,
        gstAmount: totalGst,
        grandTotal: taxable + totalGst,
      };

      setGeneratedInvoice(inv);
      setIsInvoiceModalOpen(true);
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
            Multi-Item Stock Outward & Delivery Challan
          </h1>
          <p className="page-subtitle">
            Deduct stock from godown and generate an official Sologix Energy Delivery Challan & Gate Pass with unit serials
          </p>
        </div>
      </div>

      <StockOutForm
        products={products}
        preSelectedProduct={preSelectedProduct}
        onSubmit={handleStockOut}
        loading={submitting}
      />

      {generatedInvoice && (
        <TaxInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          invoiceData={generatedInvoice}
          onNewDispatch={() => {
            setIsInvoiceModalOpen(false);
            window.location.reload();
          }}
          onGoHistory={() => {
            setIsInvoiceModalOpen(false);
            navigate('/stock/history');
          }}
        />
      )}
    </div>
  );
};

export default StockOut;
