'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart, updateCartItemQty } = useCart();
  const [loading, setLoading] = useState(false);

  // Calculate totals
  const itemsPrice = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const taxPrice = itemsPrice * 0.1; // 10% tax
  const shippingPrice = itemsPrice > 1000 ? 0 : 150; // Free shipping over KSh 1000
  const totalPrice = itemsPrice + taxPrice + shippingPrice;

  const handleQuantityChange = (item, newQty) => {
    if (newQty <= 0) {
      removeFromCart(item._id);
    } else {
      updateCartItemQty(item._id, newQty);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    window.location.href = '/checkout';
  };

  if (cartItems.length === 0) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <h3 className="empty-state-title">Your Cart is Empty</h3>
          <p className="empty-state-text">Looks like you haven't added any items to your cart yet</p>
          <Link href="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
        <style jsx>{`
          .empty-state {
            padding: 64px 16px;
            text-align: center;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '24px' }}>Shopping Cart</h1>

      <div className="cart-layout">
        {/* Cart Items */}
        <div className="cart-items">
          {cartItems.map((item) => (
            <div key={item._id} className="cart-item">
              <div className="cart-item-image">
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                    🥬
                  </div>
                )}
              </div>
              
              <div className="cart-item-details">
                <Link href={`/products/${item._id}`} className="cart-item-title">
                  {item.name}
                </Link>
                <p className="cart-item-price">KSh {item.price} / {item.unit}</p>
              </div>

              {/* Quantity Controls */}
              <div className="cart-item-quantity">
                <span className="qty-label">Qty:</span>
                <div className="qty-controls">
                  <button 
                    className="qty-btn"
                    onClick={() => handleQuantityChange(item, item.qty - 1)}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    className="qty-input"
                    value={item.qty}
                    onChange={(e) => handleQuantityChange(item, parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.125"
                  />
                  <button 
                    className="qty-btn"
                    onClick={() => handleQuantityChange(item, item.qty + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="cart-item-subtotal">
                <p className="subtotal-label">Subtotal</p>
                <p className="subtotal-amount">KSh {(item.price * item.qty).toLocaleString()}</p>
              </div>

              <button 
                className="remove-btn"
                onClick={() => removeFromCart(item._id)}
                aria-label="Remove item"
              >
                🗑️
              </button>
            </div>
          ))}

          <button className="btn btn-outline" onClick={clearCart}>
            Clear Cart
          </button>
        </div>

        {/* Cart Summary */}
        <div className="cart-summary">
          <h3 className="cart-summary-title">Order Summary</h3>
          
          <div className="cart-summary-row">
            <span>Subtotal ({cartItems.length} items)</span>
            <span>KSh {itemsPrice.toLocaleString()}</span>
          </div>
          
          <div className="cart-summary-row">
            <span>Tax (10%)</span>
            <span>KSh {taxPrice.toLocaleString()}</span>
          </div>
          
          <div className="cart-summary-row">
            <span>Shipping</span>
            <span>{shippingPrice === 0 ? 'FREE' : `KSh ${shippingPrice}`}</span>
          </div>

          {shippingPrice > 0 && (
            <p className="free-shipping-hint">Add KSh {(1000 - itemsPrice).toLocaleString()} more for free shipping!</p>
          )}
          
          <div className="cart-summary-row cart-summary-total">
            <span>Total</span>
            <span>KSh {totalPrice.toLocaleString()}</span>
          </div>

          <button 
            className="btn btn-primary btn-large checkout-btn"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Proceed to Checkout'}
          </button>

          <Link href="/products" className="continue-shopping">
            Continue Shopping
          </Link>
        </div>
      </div>

      <style jsx>{`
        .cart-layout {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 32px;
          padding: 32px 0;
        }

        .cart-items {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .cart-item {
          display: grid;
          grid-template-columns: 80px 1fr auto auto auto;
          gap: 16px;
          align-items: center;
          padding: 16px;
          background: var(--surface);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
        }

        .cart-item-image {
          width: 80px;
          height: 80px;
          border-radius: var(--radius);
          overflow: hidden;
          background: #f5f5f5;
        }

        .cart-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cart-item-title {
          font-weight: 600;
          color: var(--text-primary);
        }

        .cart-item-title:hover {
          color: var(--primary);
        }

        .cart-item-price {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .cart-item-quantity {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .qty-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .qty-controls {
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--border);
          border-radius: var(--radius);
          padding: 2px;
        }

        .qty-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: var(--transition);
          color: var(--text-primary);
        }

        .qty-btn:hover {
          background: var(--primary);
          color: white;
        }

        .qty-input {
          width: 50px;
          height: 28px;
          text-align: center;
          border: none;
          background: transparent;
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .qty-input:focus {
          outline: none;
        }

        .cart-item-subtotal {
          text-align: right;
        }

        .subtotal-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .subtotal-amount {
          font-weight: 600;
          color: var(--primary);
        }

        .remove-btn {
          background: none;
          padding: 8px;
          font-size: 1.25rem;
          transition: var(--transition);
        }

        .remove-btn:hover {
          transform: scale(1.1);
        }

        .free-shipping-hint {
          font-size: 0.875rem;
          color: var(--secondary);
          text-align: center;
          margin: 12px 0;
          padding: 8px;
          background: #fff3e0;
          border-radius: 4px;
        }

        .checkout-btn {
          width: 100%;
          margin-top: 16px;
        }

        .continue-shopping {
          display: block;
          text-align: center;
          margin-top: 16px;
          color: var(--primary);
          font-weight: 500;
        }

        .continue-shopping:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .cart-layout {
            grid-template-columns: 1fr;
          }

          .cart-item {
            grid-template-columns: 60px 1fr;
            grid-template-rows: auto auto auto;
            gap: 12px;
          }

          .cart-item-image {
            width: 60px;
            height: 60px;
          }

          .cart-item-quantity {
            grid-column: 2;
            justify-self: start;
          }

          .cart-item-subtotal {
            grid-column: 2;
            text-align: left;
          }

          .remove-btn {
            grid-column: 2;
            justify-self: start;
          }
        }
      `}</style>
    </div>
  );
}
