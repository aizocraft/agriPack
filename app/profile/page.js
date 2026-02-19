'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
        </div>

        <div className="profile-section">
          <h2>My Orders</h2>
          {orders.length > 0 ? (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <span className="order-id">Order #{order._id.slice(-8)}</span>
                    <span className={`order-status ${order.status}`}>{order.status}</span>
                  </div>
                  <div className="order-details">
                    <span>{order.orderItems?.length} items</span>
                    <span>KSh {order.totalPrice?.toLocaleString()}</span>
                  </div>
                  <div className="order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
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

        .order-details {
          display: flex;
          justify-content: space-between;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .order-date {
          font-size: 0.875rem;
          color: var(--text-secondary);
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
