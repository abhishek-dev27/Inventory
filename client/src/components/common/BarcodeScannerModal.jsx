
import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { Html5Qrcode } from 'html5-qrcode';
import {
  FiCamera,
  FiZap,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiList,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const BarcodeScannerModal = ({
  isOpen,
  onClose,
  onAddSerials,
  existingSerials = [],
  title = 'Barcode & Serial Number Scanner',
}) => {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual'
  const [scannedList, setScannedList] = useState([]);
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'interactive-barcode-scanner-viewport';

  useEffect(() => {
    if (isOpen) {
      setScannedList([]);
      setManualInput('');
      setCameraError(null);
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // Handle starting camera scanner
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (html5QrCodeRef.current) {
        await stopCamera();
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 180 },
        aspectRatio: 1.777778,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // ignore frame scan errors
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error('Camera init error:', err);
      setCameraError(
        'Unable to access camera. Please check camera permissions or use the direct manual entry tab.'
      );
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.error('Error stopping camera:', err);
    } finally {
      html5QrCodeRef.current = null;
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      const timer = setTimeout(() => {
        startCamera();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen, activeTab]);

  const handleScanSuccess = (decodedText) => {
    const cleanText = decodedText.trim();
    if (!cleanText) return;

    // Check if already in current list or existing
    if (scannedList.includes(cleanText) || existingSerials.includes(cleanText)) {
      toast('Serial already recorded', { icon: 'ℹ️' });
      return;
    }

    // Play quick beep sound
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch {
      // audio context not available
    }

    setScannedList((prev) => [...prev, cleanText]);
    toast.success(`Scanned: ${cleanText}`);
  };

  const handleAddManual = (e) => {
    if (e) e.preventDefault();
    if (!manualInput.trim()) return;

    // Split by comma, space, or newline
    const items = manualInput
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const newItems = [];
    items.forEach((item) => {
      if (!scannedList.includes(item) && !existingSerials.includes(item) && !newItems.includes(item)) {
        newItems.push(item);
      }
    });

    if (newItems.length > 0) {
      setScannedList((prev) => [...prev, ...newItems]);
      toast.success(`Added ${newItems.length} serial number(s)`);
      setManualInput('');
    } else {
      toast('All entered serials are already registered', { icon: 'ℹ️' });
    }
  };

  const handleRemoveItem = (index) => {
    setScannedList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApply = () => {
    if (scannedList.length > 0) {
      onAddSerials(scannedList);
      toast.success(`Applied ${scannedList.length} serial number(s) to product`);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title={title}
      subtitle="Scan serial number barcodes / QR codes or type directly"
      maxWidth="580px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Mode Selector Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeTab === 'camera' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'camera' ? 'var(--primary-light)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'camera' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <FiCamera size={16} />
            Camera / Barcode Scanner
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeTab === 'manual' ? 'var(--surface)' : 'transparent',
              color: activeTab === 'manual' ? 'var(--primary-light)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'manual' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <FiList size={16} />
            Direct Keypad / Hardware Gun
          </button>
        </div>

        {/* Tab 1: Live Camera Scanner */}
        {activeTab === 'camera' && (
          <div>
            <div
              id={scannerContainerId}
              style={{
                width: '100%',
                minHeight: '220px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                backgroundColor: '#000000',
                position: 'relative',
              }}
            />

            {cameraError && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger)',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FiAlertCircle size={16} />
                <span>{cameraError}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '8px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}
            >
              <span>Aim camera at inverter serial barcode / QR sticker</span>
              <button
                type="button"
                onClick={startCamera}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-light)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                Restart Camera
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Manual Keypad / Hardware Barcode Gun */}
        {activeTab === 'manual' && (
          <form onSubmit={handleAddManual}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="Enter or Gun-Scan Serial Number"
                  placeholder="Type SN or scan with USB barcode scanner (e.g. SN-DEYE-892144)"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ marginTop: '24px' }}>
                <Button type="submit" variant="primary" icon={FiPlus}>
                  Add
                </Button>
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Tip: You can paste multiple serial numbers separated by commas or line breaks.
            </span>
          </form>
        )}

        {/* Scanned Serial Numbers Review List */}
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            backgroundColor: 'var(--surface)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
              Queue ({scannedList.length} Serials Scanned)
            </span>
            {scannedList.length > 0 && (
              <button
                type="button"
                onClick={() => setScannedList([])}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Clear All
              </button>
            )}
          </div>

          {scannedList.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '20px',
                color: 'var(--text-muted)',
                fontSize: '0.8125rem',
              }}
            >
              No serial numbers scanned yet. Aim your camera or type above.
            </div>
          ) : (
            <div
              style={{
                maxHeight: '140px',
                overflowY: 'auto',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
              }}
            >
              {scannedList.map((sn, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--primary-bg)',
                    border: '1px solid var(--primary-border)',
                    color: 'var(--primary-light)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                >
                  <FiZap size={11} />
                  <span>{sn}</span>
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
                      padding: 0,
                    }}
                  >
                    <FiX size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              stopCamera();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            icon={FiCheckCircle}
            onClick={handleApply}
            disabled={scannedList.length === 0}
          >
            Apply ({scannedList.length}) Serials
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BarcodeScannerModal;
