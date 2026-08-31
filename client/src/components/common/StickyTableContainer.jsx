import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * StickyTableContainer
 * Ensures the horizontal scrollbar is ALWAYS visible pinned at the bottom of the screen (viewport)
 * while viewing any long table, without having to scroll all the way to the end of the sheet.
 */
const StickyTableContainer = ({ children, className = '', style = {} }) => {
  const containerRef = useRef(null);
  const scrollbarRef = useRef(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [containerBounds, setContainerBounds] = useState({ left: 0, width: 0 });
  const [showStickyScroll, setShowStickyScroll] = useState(false);
  const isSyncing = useRef(false);

  const checkOverflowAndPosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const sw = containerRef.current.scrollWidth;
    const cw = containerRef.current.clientWidth;
    const windowHeight = window.innerHeight;

    const hasHorizontalOverflow = sw > cw;
    // Show floating bottom scrollbar if table has horizontal overflow AND its bottom is below the viewport
    const isTableInView = rect.top < windowHeight && rect.bottom > windowHeight;

    setScrollWidth(sw);
    setContainerBounds({ left: rect.left, width: rect.width });
    setShowStickyScroll(hasHorizontalOverflow && isTableInView);

    if (scrollbarRef.current && containerRef.current && !isSyncing.current) {
      scrollbarRef.current.scrollLeft = containerRef.current.scrollLeft;
    }
  }, []);

  useEffect(() => {
    checkOverflowAndPosition();
    window.addEventListener('scroll', checkOverflowAndPosition, { passive: true });
    window.addEventListener('resize', checkOverflowAndPosition);

    const observer = new ResizeObserver(() => checkOverflowAndPosition());
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('scroll', checkOverflowAndPosition);
      window.removeEventListener('resize', checkOverflowAndPosition);
      observer.disconnect();
    };
  }, [checkOverflowAndPosition, children]);

  const handleStickyScroll = (e) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    if (containerRef.current) {
      containerRef.current.scrollLeft = e.target.scrollLeft;
    }
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  const handleContainerScroll = (e) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    if (scrollbarRef.current) {
      scrollbarRef.current.scrollLeft = e.target.scrollLeft;
    }
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Main Table Container */}
      <div
        ref={containerRef}
        className={`table-container ${className}`}
        onScroll={handleContainerScroll}
        style={{
          overflowX: 'auto',
          width: '100%',
          ...style,
        }}
      >
        {children}
      </div>

      {/* Floating Sticky Horizontal Scrollbar (stays pinned to the screen bottom) */}
      {showStickyScroll && (
        <div
          ref={scrollbarRef}
          onScroll={handleStickyScroll}
          className="floating-sticky-scrollbar"
          style={{
            position: 'fixed',
            bottom: 0,
            left: `${containerBounds.left}px`,
            width: `${containerBounds.width}px`,
            height: '14px',
            overflowX: 'auto',
            overflowY: 'hidden',
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            zIndex: 999,
            borderTop: '1px solid var(--border)',
            boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.12)',
            scrollbarWidth: 'thin',
            scrollbarColor: '#818cf8 #f1f5f9',
          }}
          title="Scroll Left / Right"
        >
          <div style={{ width: `${scrollWidth}px`, height: '1px' }} />
        </div>
      )}
    </div>
  );
};

export default StickyTableContainer;
