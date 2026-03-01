'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function CheckoutPage() {
  const { cartItems, shippingAddress, paymentMethod, saveShippingAddress, savePaymentMethod, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, initiating, waiting, success, failed
  const [mpesaCheckoutRequestID, setMpesaCheckoutRequestID] = useState('');
  const pollingIntervalRef = useRef(null);
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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Poll for payment status when waiting for payment
  useEffect(() => {
    if (paymentStatus === 'waiting' && orderId) {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const token = localStorage.getItem('token');
          const headers = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const res = await fetch(`/api/orders/${orderId}`, {
            headers
          });
          
          if (res.ok) {
            const order = await res.json();
            if (order.isPaid) {
              // Payment confirmed!
              clearInterval(pollingIntervalRef.current);
              setPaymentStatus('success');
            }
          }
        } catch (err) {
          console.error('Error polling payment status:', err);
        }
      }, 3000); // Poll every 3 seconds

      // Timeout after 2 minutes
      setTimeout(() => {
        if (pollingIntervalRef.current && paymentStatus === 'waiting') {
          clearInterval(pollingIntervalRef.current);
          setPaymentStatus('timeout');
        }
      }, 120000); // 2 minutes timeout
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [paymentStatus, orderId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

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
          country: 'Kenya',
          phone: formData.phone
        },
        paymentMethod: paymentMethod || 'mpesa',
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        phoneNumber: formData.phone
      };

      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Only add authorization header if user is logged in
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });

      const data = await res.json();

      if (res.ok) {
        setOrderId(data._id);
        
        // Check if M-Pesa was initiated
        if (paymentMethod === 'mpesa' && data.mpesaCheckoutRequestID) {
          setMpesaCheckoutRequestID(data.mpesaCheckoutRequestID);
          setPaymentStatus('waiting');
          clearCart();
        } else {
          // For COD or if M-Pesa failed to initiate
          setOrderPlaced(true);
          setPaymentStatus('success');
          clearCart();
        }
      } else {
        setError(data.message || 'Failed to place order');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render M-Pesa payment processing UI
  const renderPaymentProcessing = () => (
    <div className="payment-processing">
      <div className="processing-icon">📱</div>
      <h2>Check Your Phone</h2>
      <p className="processing-amount">KSh {totalPrice.toLocaleString()}</p>
      <p className="processing-instructions">
        A pop-up has been sent to your phone <strong>{formData.phone}</strong>. 
        Enter your M-Pesa PIN to complete the payment.
      </p>
      
      {paymentStatus === 'waiting' && (
        <div className="processing-status">
          <div className="spinner"></div>
          <p>Waiting for payment confirmation...</p>
          <p className="processing-hint">This may take up to 2 minutes</p>
        </div>
      )}

      {paymentStatus === 'success' && (
        <div className="payment-success">
          <div className="success-icon">✓</div>
          <h3>Payment Successful!</h3>
          <p>Your order has been confirmed.</p>
        </div>
      )}

      {paymentStatus === 'timeout' && (
        <div className="payment-timeout">
          <div className="warning-icon">⚠️</div>
          <h3>Payment Timeout</h3>
          <p>We didn't receive payment confirmation. Your order is still pending.</p>
          <p>You can check your phone for any pending M-Pesa prompts, or try again.</p>
          <div className="timeout-actions">
            <button 
              onClick={() => {
                setPaymentStatus('pending');
                setOrderPlaced(true);
              }} 
              className="btn btn-primary"
            >
              View Order
            </button>
            <button 
              onClick={() => {
                setPaymentStatus('pending');
                setOrderId('');
                setMpesaCheckoutRequestID('');
              }} 
              className="btn btn-outline"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {paymentStatus === 'waiting' && (
        <div className="payment-actions">
          <button 
            onClick={() => {
              setPaymentStatus('pending');
              setOrderId('');
              setMpesaCheckoutRequestID('');
            }} 
            className="btn btn-outline"
          >
            Cancel
          </button>
        </div>
      )}

      <style jsx>{`
        .payment-processing {
          text-align: center;
          padding: 48px 24px;
          max-width: 500px;
          margin: 0 auto;
        }

        .processing-icon {
          font-size: 4rem;
          margin-bottom: 24px;
        }

        .processing-amount {
          font-size: 2rem;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 16px;
        }

        .processing-instructions {
          color: var(--text-secondary);
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .processing-status {
          margin-top: 24px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .processing-hint {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-top: 8px;
        }

        .payment-success {
          margin-top: 24px;
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

        .payment-timeout {
          margin-top: 24px;
        }

        .warning-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .timeout-actions, .payment-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-top: 24px;
        }
      `}</style>
    </div>
  );

  // Show M-Pesa payment processing when waiting for payment
  if (paymentStatus === 'waiting' || paymentStatus === 'success' || paymentStatus === 'timeout') {
    return (
      <div className="container">
        {renderPaymentProcessing()}
        {paymentStatus === 'success' && (
          <div className="order-success-footer">
            <p>Your order ID is: <strong>{orderId}</strong></p>
            <div className="success-buttons">
              <Link href="/products" className="btn btn-primary">
                Continue Shopping
              </Link>
              <Link href="/profile" className="btn btn-outline">
                View Orders
              </Link>
            </div>
          </div>
        )}
        <style jsx>{`
          .order-success-footer {
            text-align: center;
            padding: 24px;
            margin-top: 24px;
            background: white;
            border-radius: var(--radius);
            box-shadow: var(--shadow);
          }
          .success-buttons {
            display: flex;
            gap: 16px;
            justify-content: center;
            margin-top: 24px;
          }
        `}</style>
      </div>
    );
  }

  if (orderPlaced) {
    const isCOD = paymentMethod === 'cod';
    return (
      <div className="container">
        <div className="order-success">
          <div className="success-icon">✓</div>
          <h1>Order Placed Successfully!</h1>
          <p>Your order ID is: <strong>{orderId}</strong></p>
          
          {isCOD ? (
            <div className="cod-message">
              <div className="payment-type-icon">💵</div>
              <h3>Cash on Delivery</h3>
              <p className="cod-amount">Amount to Pay: <strong>KSh {totalPrice.toLocaleString()}</strong></p>
              <p className="cod-instructions">
                Please have <strong>KSh {totalPrice.toLocaleString()}</strong> ready when the delivery person arrives at your doorstep.
              </p>
              <p className="cod-note">📱 Our delivery team will call you before arriving. Keep your phone accessible.</p>
              <div className="cod-tips">
                <p>💡 Tips for smooth delivery:</p>
                <ul>
                  <li>Have exact change ready</li>
                  <li>Be available at the delivery address</li>
                  <li>Check your order before payment</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="mpesa-message">
              <div className="payment-type-icon">📱</div>
              <h3>M-Pesa Payment</h3>
              <p className="mpesa-instructions">
                A pop-up was sent to your phone. Please enter your M-Pesa PIN to complete payment of <strong>KSh {totalPrice.toLocaleString()}</strong>.
              </p>
              <p className="mpesa-note">📲 Confirmation will be sent via SMS once payment is received.</p>
              <div className="mpesa-tips">
                <p>💡 Didn't get the prompt?</p>
                <ul>
                  <li>Check your phone for any pending M-Pesa messages</li>
                  <li>Ensure you have enough M-Pesa balance</li>
                  <li>Wait up to 2 minutes for the prompt</li>
                </ul>
              </div>
            </div>
          )}
          
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
          .cod-message, .mpesa-message {
            background: white;
            border-radius: 12px;
            padding: 24px;
            margin: 20px 0;
            text-align: left;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }
          .payment-type-icon {
            font-size: 2.5rem;
            margin-bottom: 12px;
            text-align: center;
          }
          .cod-message h3, .mpesa-message h3 {
            text-align: center;
            margin-bottom: 16px;
            color: var(--text-primary);
          }
          .cod-message {
            border: 2px solid #ffc107;
            background: linear-gradient(to bottom, #fffde7 0%, #fff8e1 100%);
          }
          .mpesa-message {
            border: 2px solid #22c55e;
            background: linear-gradient(to bottom, #f0fdf4 0%, #dcfce7 100%);
          }
          .cod-amount {
            font-size: 1.5rem;
            color: #f57c00;
            margin-bottom: 12px;
            text-align: center;
          }
          .cod-instructions, .mpesa-instructions {
            color: #333;
            margin-bottom: 12px;
            line-height: 1.6;
          }
          .cod-note, .mpesa-note {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 16px;
          }
          .cod-tips, .mpesa-tips {
            background: rgba(255,255,255,0.7);
            border-radius: 8px;
            padding: 16px;
            margin-top: 16px;
          }
          .cod-tips p, .mpesa-tips p {
            font-weight: 600;
            margin-bottom: 8px;
            color: #555;
          }
          .cod-tips ul, .mpesa-tips ul {
            margin: 0;
            padding-left: 20px;
            color: #666;
            font-size: 0.9rem;
          }
          .cod-tips li, .mpesa-tips li {
            margin-bottom: 4px;
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
                  <label className="form-label">Zip Code (Optional)</label>
                  <input
                    type="text"
                    name="zipCode"
                    className="form-input"
                    value={formData.zipCode}
                    onChange={handleChange}
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
