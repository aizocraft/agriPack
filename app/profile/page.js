'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
      fetchOrders();
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleDeleteProfile = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/profile', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        window.location.href = '/';
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete profile');
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      alert('An error occurred while deleting your profile');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!user) {
    return (
      <div className="container">
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="profile-header">
        <div className="profile-avatar">
          {user.name?.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h1>{user.name}</h1>
          <p>{user.email}</p>
          {user.isFarmer && <span className="badge badge-primary">Farmer</span>}
          {user.isAdmin && <span className="badge badge-secondary">Admin</span>}
        </div>
      </div>

      <div className="profile-sections">
        <div className="profile-section">
          <h2>Account Details</h2>
          <div className="detail-card">
            <div className="detail-row">
              <span className="detail-label">Name</span>
              <span className="detail-value">{user.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email</span>
              <span className="detail-value">{user.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Phone</span>
              <span className="detail-value">{user.phone || 'Not provided'}</span>
            </div>
            {user.address && (
              <div className="detail-row">
                <span className="detail-label">Address</span>
                <span className="detail-value">
                  {user.address.street}, {user.address.city}
                </span>
              </div>
            )}
          </div>
          
          <div className="profile-actions">
            <button 
              className="btn btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Profile
            </button>
          </div>
        </div>

        <div className="profile-section">
          <h2>My Orders</h2>
          {orders.length > 0 ? (
            <div className="orders-list">
              {orders.map((order) => (
                <div 
                  key={order._id} 
                  className="order-card clickable"
                  onClick={() => handleOrderClick(order)}
                >
                  <div className="order-header">
                    <span className="order-id">Order #{order._id.slice(-8)}</span>
                    <span className={`order-status ${order.status}`}>{order.status}</span>
                  </div>
                  <div className="order-details">
                    <span>{order.orderItems?.length} items</span>
                    <span>KSh {order.totalPrice?.toLocaleString()}</span>
                  </div>
                  <div className="order-footer">
                    <span className="order-date">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`payment-status ${order.isPaid ? 'paid' : 'unpaid'}`}>
                      {order.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No orders yet</p>
              <Link href="/products" className="btn btn-primary">
                Start Shopping
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Profile</h2>
              <button className="close-btn" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="delete-warning">
                ⚠️ Are you sure you want to delete your profile? This action cannot be undone and all your data will be permanently removed.
              </p>
              <div className="delete-actions">
                <button 
                  className="btn btn-danger"
                  onClick={handleDeleteProfile}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete My Profile'}
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <button className="close-btn" onClick={() => setShowOrderModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="order-detail-row">
                <span className="label">Order ID:</span>
                <span className="value">#{selectedOrder._id.slice(-8)}</span>
              </div>
              <div className="order-detail-row">
                <span className="label">Payment Method:</span>
                <span className="value">{selectedOrder.paymentMethod?.toUpperCase()}</span>
              </div>
              <div className="order-detail-row">
                <span className="label">Payment Status:</span>
                <span className={`badge ${selectedOrder.isPaid ? 'badge-success' : 'badge-warning'}`}>
                  {selectedOrder.isPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
              <div className="order-detail-row">
                <span className="label">Order Status:</span>
                <span className={`badge badge-${selectedOrder.status}`}>{selectedOrder.status}</span>
              </div>
              <div className="order-detail-row">
                <span className="label">Date:</span>
                <span className="value">{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
              </div>
              
              {selectedOrder.shippingAddress && (
                <>
                  <h3>Shipping Address</h3>
                  <div className="shipping-address">
                    <p>{selectedOrder.shippingAddress.street}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                  </div>
                </>
              )}
              
              <h3>Items</h3>
              <div className="order-items">
                {selectedOrder.orderItems?.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <div className="item-image">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <span className="placeholder-icon">📦</span>
                      )}
                    </div>
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-qty">Qty: {item.qty}</span>
                    </div>
                    <span className="item-price">KSh {(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              
              <div className="order-totals">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>KSh {selectedOrder.itemsPrice?.toLocaleString()}</span>
                </div>
                {selectedOrder.shippingPrice > 0 && (
                  <div className="total-row">
                    <span>Shipping:</span>
                    <span>KSh {selectedOrder.shippingPrice?.toLocaleString()}</span>
                  </div>
                )}
                {selectedOrder.taxPrice > 0 && (
                  <div className="total-row">
                    <span>Tax:</span>
                    <span>KSh {selectedOrder.taxPrice?.toLocaleString()}</span>
                  </div>
                )}
                <div className="total-row final">
                  <span>Total:</span>
                  <span>KSh {selectedOrder.totalPrice?.toLocaleString()}</span>
                </div>
              </div>

              {selectedOrder.paymentResult && (
                <div className="payment-info">
                  <h3>Payment Details</h3>
                  <div className="payment-detail">
                    <span>Transaction ID:</span>
                    <span>{selectedOrder.paymentResult.id}</span>
                  </div>
                  <div className="payment-detail">
                    <span>Amount:</span>
                    <span>KSh {selectedOrder.paymentResult.amount?.toLocaleString()}</span>
                  </div>
                  {selectedOrder.paymentResult.phoneNumber && (
                    <div className="payment-detail">
                      <span>Phone:</span>
                      <span>{selectedOrder.paymentResult.phoneNumber}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .profile-header {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 32px 0;
        }

        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
        }

        .profile-info h1 {
          margin-bottom: 4px;
        }

        .profile-info p {
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .profile-sections {
          display: grid;
          gap: 32px;
        }

        .profile-section {
          background: white;
          padding: 24px;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
        }

        .profile-section h2 {
          margin-bottom: 20px;
        }

        .profile-actions {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }

        .btn-danger {
          background: var(--error);
          color: white;
          padding: 12px 24px;
          border-radius: var(--radius);
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-danger:hover {
          background: #b71c1c;
        }

        .btn-danger:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .detail-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }

        .detail-label {
          color: var(--text-secondary);
        }

        .detail-value {
          font-weight: 500;
        }

        .order-card {
          padding: 16px;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          margin-bottom: 12px;
          cursor: pointer;
          transition: 0.3s;
        }

        .order-card.clickable:hover {
          border-color: var(--primary);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .order-id {
          font-weight: 600;
        }

        .order-status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          text-transform: capitalize;
        }

        .order-status.pending { background: #fff3e0; color: #ff9800; }
        .order-status.processing { background: #e3f2fd; color: #2196f3; }
        .order-status.delivered { background: #e8f5e9; color: #4caf50; }
        .order-status.shipped { background: #e1f5fe; color: #0288d1; }

        .order-details {
          display: flex;
          justify-content: space-between;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .order-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .order-date {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .payment-status {
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .payment-status.paid {
          background: #d1fae5;
          color: #065f46;
        }

        .payment-status.unpaid {
          background: #fef3c7;
          color: #92400e;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }

        .modal-body {
          padding: 20px;
        }

        .delete-warning {
          background: #ffebee;
          padding: 16px;
          border-radius: var(--radius);
          margin-bottom: 20px;
          color: #c62828;
        }

        .delete-actions {
          display: flex;
          gap: 12px;
        }

        .delete-actions .btn {
          flex: 1;
        }

        .order-detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }

        .order-detail-row .label {
          color: #666;
        }

        .order-detail-row .value {
          font-weight: 500;
        }

        .badge-success {
          background: #d1fae5;
          color: #065f46;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .badge-warning {
          background: #fef3c7;
          color: #92400e;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .badge-pending, .badge-processing, .badge-shipped, .badge-delivered {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          text-transform: capitalize;
        }

        .badge-pending { background: #fff3e0; color: #ff9800; }
        .badge-processing { background: #e3f2fd; color: #2196f3; }
        .badge-shipped { background: #e1f5fe; color: #0288d1; }
        .badge-delivered { background: #e8f5e9; color: #4caf50; }

        h3 {
          margin: 20px 0 10px;
          font-size: 1rem;
          color: #333;
        }

        .shipping-address {
          background: #f9f9f9;
          padding: 12px;
          border-radius: 8px;
        }

        .shipping-address p {
          margin: 4px 0;
          color: #666;
        }

        .order-items {
          margin: 10px 0;
          background: #f9f9f9;
          border-radius: 8px;
          padding: 10px;
        }

        .order-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }

        .order-item:last-child {
          border-bottom: none;
        }

        .item-image {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          overflow: hidden;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .placeholder-icon {
          font-size: 1.5rem;
        }

        .item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .item-name {
          font-weight: 500;
        }

        .item-qty {
          font-size: 0.875rem;
          color: #666;
        }

        .item-price {
          font-weight: 500;
        }

        .order-totals {
          margin-top: 15px;
          padding: 15px;
          background: #f0fff4;
          border-radius: 8px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
        }

        .total-row.final {
          border-top: 1px solid #c6f6d5;
          margin-top: 10px;
          padding-top: 10px;
          font-weight: bold;
          font-size: 1.1rem;
        }

        .payment-info {
          margin-top: 20px;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .payment-detail {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .profile-header {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
