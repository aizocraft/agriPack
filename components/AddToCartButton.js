'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

export default function AddToCartButton({ product }) {
  const [qty, setQty] = useState(1);
  const [qtyType, setQtyType] = useState('whole'); // 'whole' or 'fraction'
  const [fraction, setFraction] = useState(1); // 1/4=0.25, 1/2=0.5, 3/4=0.75, 1/8=0.125
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const router = useRouter();

  // Calculate total quantity
  const getTotalQty = () => {
    if (qtyType === 'fraction') {
      return fraction;
    }
    return qty;
  };

  const handleAddToCart = () => {
    setLoading(true);
    
    // Add to cart with the calculated quantity
    const totalQty = getTotalQty();
    addToCart(product, totalQty);
    
    // Show success feedback
    setLoading(false);
    setAdded(true);
    
    setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  const handleBuyNow = () => {
    const totalQty = getTotalQty();
    addToCart(product, totalQty);
    router.push('/cart');
  };

  // Fraction options
  const fractionOptions = [
    { value: 0.125, label: '1/8' },
    { value: 0.25, label: '1/4' },
    { value: 0.5, label: '1/2' },
    { value: 0.75, label: '3/4' },
  ];

  return (
    <div className="add-to-cart-container">
      {/* Quantity Type Toggle */}
      <div className="qty-type-toggle">
        <button 
          className={`qty-type-btn ${qtyType === 'whole' ? 'active' : ''}`}
          onClick={() => setQtyType('whole')}
        >
          Whole ({product.unit})
        </button>
        <button 
          className={`qty-type-btn ${qtyType === 'fraction' ? 'active' : ''}`}
          onClick={() => setQtyType('fraction')}
        >
          Fraction
        </button>
      </div>

      {/* Quantity Selector */}
      {qtyType === 'whole' ? (
        <div className="quantity-selector">
          <label>Quantity:</label>
          <div className="quantity-controls">
            <button 
              className="quantity-btn"
              onClick={() => setQty(Math.max(1, qty - 1))}
              disabled={qty <= 1}
            >
              −
            </button>
            <span className="quantity-value">{qty}</span>
            <button 
              className="quantity-btn"
              onClick={() => setQty(Math.min(product.stock, qty + 1))}
              disabled={qty >= product.stock}
            >
              +
            </button>
          </div>
          <span className="quantity-unit">({product.unit}{qty > 1 ? 's' : ''})</span>
        </div>
      ) : (
        <div className="fraction-selector">
          <label>Select Amount:</label>
          <div className="fraction-options">
            {fractionOptions.map((opt) => (
              <button
                key={opt.value}
                className={`fraction-btn ${fraction === opt.value ? 'active' : ''}`}
                onClick={() => setFraction(opt.value)}
              >
                {opt.label} {product.unit}
              </button>
            ))}
          </div>
          <div className="selected-fraction">
            Selected: <strong>{fraction} {product.unit}</strong>
          </div>
        </div>
      )}

      <div className="action-buttons">
        <button 
          className={`btn btn-primary btn-large ${added ? 'added' : ''}`}
          onClick={handleAddToCart}
          disabled={loading || product.stock === 0}
        >
          {loading ? 'Adding...' : added ? '✓ Added to Cart!' : 'Add to Cart'}
        </button>
        
        <button 
          className="btn btn-secondary btn-large"
          onClick={handleBuyNow}
          disabled={product.stock === 0}
        >
          Buy Now
        </button>
      </div>

      <style jsx>{`
        .add-to-cart-container {
          margin-bottom: 24px;
        }

        .qty-type-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          background: var(--border);
          padding: 4px;
          border-radius: var(--radius);
        }

        .qty-type-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          background: transparent;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
          color: var(--text-secondary);
        }

        .qty-type-btn.active {
          background: var(--primary);
          color: white;
        }

        .qty-type-btn:hover:not(.active) {
          background: rgba(0,0,0,0.05);
        }

        .quantity-selector {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .quantity-selector label {
          font-weight: 500;
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--surface);
          padding: 4px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
        }

        .quantity-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 1px solid var(--border);
          border-radius: 4px;
          font-size: 1.25rem;
          transition: var(--transition);
          color: var(--text-primary);
        }

        .quantity-btn:hover:not(:disabled) {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .quantity-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quantity-value {
          font-size: 1.125rem;
          font-weight: 600;
          min-width: 40px;
          text-align: center;
          color: var(--text-primary);
        }

        .quantity-unit {
          color: var(--text-secondary);
        }

        .fraction-selector {
          margin-bottom: 20px;
        }

        .fraction-selector label {
          display: block;
          font-weight: 500;
          margin-bottom: 12px;
        }

        .fraction-options {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .fraction-btn {
          padding: 12px 8px;
          border: 2px solid var(--border);
          background: var(--surface);
          border-radius: var(--radius);
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          color: var(--text-primary);
          font-size: 0.9rem;
        }

        .fraction-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .fraction-btn.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .selected-fraction {
          margin-top: 12px;
          padding: 8px 12px;
          background: var(--surface);
          border-radius: var(--radius);
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .selected-fraction strong {
          color: var(--primary);
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .action-buttons .btn {
          flex: 1;
        }

        .btn.added {
          background: var(--success);
        }

        @media (max-width: 480px) {
          .action-buttons {
            flex-direction: column;
          }

          .fraction-options {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
