'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

export default function AddToCartButton({ product }) {
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const router = useRouter();

  const handleAddToCart = () => {
    setLoading(true);
    
    // Add to cart
    addToCart(product, qty);
    
    // Show success feedback
    setLoading(false);
    setAdded(true);
    
    setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, qty);
    router.push('/cart');
  };

  return (
    <div className="add-to-cart-container">
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
        <span className="quantity-unit">({product.unit})</span>
      </div>

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
          background: #f5f5f5;
          padding: 4px;
          border-radius: var(--radius);
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
        }

        .quantity-unit {
          color: var(--text-secondary);
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
        }
      `}</style>
    </div>
  );
}
