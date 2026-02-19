'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function CheckoutPage() {
  const { cartItems, shippingAddress, paymentMethod, saveShippingAddress, savePaymentMethod, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    street: shippingAddress.street || '',
    city: shippingAddress.city || '',
    state: shippingAddress.state || '',
    zipCode: shippingAddress.zipCode || '',
    phone: shippingAddress.phone || ''
  });

  // Calculate totals
  const itemsPrice = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const taxPrice = itemsPrice * 0.1;
  const shippingPrice = itemsPrice > 1000 ? 0 : 150;
  const totalPrice = itemsPrice + taxPrice + shippingPrice;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login?redirect=checkout');
        return;
      }

      const orderData = {
        orderItems: cartItems.map(item => ({
          name: item.name,
          qty: item.qty,
          price: item.price,
          product: item._id,
          image: item.image
        })),
        shippingAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: 'Kenya'
        },
        paymentMethod: paymentMethod || 'mpesa',
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        phoneNumber: formData.phone
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await res.json();

      if (res.ok) {
        setOrderId(data._id);
        setOrderPlaced(true);
        clearCart();
      } else {
        setError(data.message || 'Failed to place order');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="container">
        <div className="order-success">
          <div className="success-icon">✓</div>
          <h1>Order Placed Successfully!</h1>
          <p>Your order ID is: <strong>{orderId}</strong></p>
          <p>We'll send you a confirmation SMS with delivery details.</p>
          <div className="success-buttons">
            <Link href="/products" className="btn btn-primary">
              Continue Shopping
            </Link>
            <Link href="/profile" className="btn btn-outline">
              View Orders
            </Link>
          </div>
        </div>
        <style jsx>{`
          .order-success {
            text-align: center;
            padding: 64px 16px;
          }
          .success-icon {
            width: 80px;
            height: 80px;
            background: var(--success);
            color: white;
            font-size: 3rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
          }
          .success-buttons {
            display: flex;
            gap: 16px;
            justify-content: center;
            margin-top: 32px;
          }
        `}</style>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <h3 className="empty-state-title">Your Cart is Empty</h3>
          <Link href="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '24px' }}>Checkout</h1>

      <div className="checkout-layout">
        {/* Checkout Form */}
        <div className="checkout-form">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Shipping Address</h3>
              
              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  name="street"
                  className="form-input"
                  value={formData.street}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    name="city"
                    className="form-input"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">County/State</label>
                  <input
                    type="text"
                    name="state"
                    className="form-input"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Zip Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    className="form-input"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-input"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Payment Method</h3>
              
              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="mpesa"
                    checked={paymentMethod === 'mpesa' || !paymentMethod}
                    onChange={() => savePaymentMethod('mpesa')}
                  />
                  <span className="payment-icon">📱</span>
                  <span className="payment-text">
                    <strong>M-Pesa</strong>
                    <small>Pay via mobile money</small>
                  </span>
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => savePaymentMethod('cod')}
                  />
                  <span className="payment-icon">💵</span>
                  <span className="payment-text">
                    <strong>Cash on Delivery</strong>
                    <small>Pay when you receive</small>
                  </span>
                </label>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button 
              type="submit" 
              className="btn btn-primary btn-large"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Place Order - KSh ${totalPrice.toLocaleString()}`}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <h3>Order Summary</h3>
          
          <div className="summary-items">
            {cartItems.map((item) => (
              <div key={item._id} className="summary-item">
                <div className="summary-item-info">
                  <span className="summary-item-name">{item.name}</span>
                  <span className="summary-item-qty">x{item.qty}</span>
                </div>
                <span className="summary-item-price">
                  KSh {(item.price * item.qty).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>KSh {itemsPrice.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Tax (10%)</span>
              <span>KSh {taxPrice.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>{shippingPrice === 0 ? 'FREE' : `KSh ${shippingPrice}`}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>KSh {totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 32px;
          padding: 32px 0;
        }

        .form-section {
          background: white;
          padding: 24px;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          margin-bottom: 24px;
        }

        .form-section h3 {
          margin-bottom: 20px;
          font-size: 1.125rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .payment-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .payment-option {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border: 2px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
          transition: var(--transition);
        }

        .payment-option:has(input:checked) {
          border-color: var(--primary);
          background: #f5f9f5;
        }

        .payment-option input {
          width: 20px;
          height: 20px;
        }

        .payment-icon {
          font-size: 1.5rem;
        }

        .payment-text {
          display: flex;
          flex-direction: column;
        }

        .payment-text small {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .order-summary {
          background: white;
          padding: 24px;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          height: fit-content;
          position: sticky;
          top: 100px;
        }

        .order-summary h3 {
          margin-bottom: 20px;
          font-size: 1.125rem;
        }

        .summary-items {
          margin-bottom: 20px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }

        .summary-item:last-child {
          border-bottom: none;
        }

        .summary-item-info {
          display: flex;
          gap: 8px;
        }

        .summary-item-qty {
          color: var(--text-secondary);
        }

        .summary-totals {
          border-top: 2px solid var(--border);
          padding-top: 16px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          color: var(--text-secondary);
        }

        .summary-row.total {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          border-top: 2px solid var(--border);
          padding-top: 12px;
          margin-top: 12px;
        }

        @media (max-width: 768px) {
          .checkout-layout {
            grid-template-columns: 1fr;
          }

          .order-summary {
            position: static;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
