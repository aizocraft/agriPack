'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0
  });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    // Check if user is logged in and is an admin
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const userData = JSON.parse(userInfo);
      if (!userData.isAdmin) {
        window.location.href = '/';
        return;
      }
      setUser(userData);
      fetchAdminData();
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch orders
      const ordersRes = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordersData = await ordersRes.json();
      setOrders(ordersData.orders || []);
      
      // Fetch products
      const productsRes = await fetch('/api/products');
      const productsData = await productsRes.json();
      setProducts(productsData.products || []);
      
      // Calculate stats
      const totalRevenue = (ordersData.orders || []).reduce(
        (sum, order) => sum + (order.totalPrice || 0), 0
      );
      
      setStats({
        totalOrders: ordersData.orders?.length || 0,
        totalProducts: productsData.products?.length || 0,
        totalUsers: 0, // Would need a users API endpoint
        totalRevenue
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        // Update the order in the local state
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, status } : order
        ));
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  if (loading && !user) {
    return (
      <div className="container">
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9800',
      processing: '#2196f3',
      shipped: '#9c27b0',
      delivered: '#4caf50',
      cancelled: '#f44336'
    };
    return colors[status] || '#757575';
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {user?.name}!</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalOrders}</span>
            <span className="stat-label">Total Orders</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🛍️</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalProducts}</span>
            <span className="stat-label">Products</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalUsers}</span>
            <span className="stat-label">Users</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-value">KSh {stats.totalRevenue.toLocaleString()}</span>
            <span className="stat-label">Total Revenue</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button 
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
      </div>

      {/* Orders Table */}
      {activeTab === 'orders' && (
        <div className="admin-section">
          <h2>All Orders</h2>
          {orders.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <span className="order-id">{order._id.slice(-8)}</span>
                      </td>
                      <td>
                        {order.shippingAddress?.street}, {order.shippingAddress?.city}
                      </td>
                      <td>{order.orderItems?.length || 0} items</td>
                      <td>KSh {order.totalPrice?.toLocaleString()}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ background: getStatusColor(order.status) }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                          className="status-select"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No Orders Yet</h3>
              <p>Orders will appear here when customers make purchases</p>
            </div>
          )}
        </div>
      )}

      {/* Products Table */}
      {activeTab === 'products' && (
        <div className="admin-section">
          <h2>All Products</h2>
          {products.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Farmer</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="product-cell">
                          <div className="product-image">
                            {product.image ? (
                              <img src={product.image} alt={product.name} />
                            ) : (
                              <span>🥬</span>
                            )}
                          </div>
                          <span>{product.name}</span>
                        </div>
                      </td>
                      <td>{product.category}</td>
                      <td>KSh {product.price}/{product.unit}</td>
                      <td>{product.stock}</td>
                      <td>{product.farmer?.name || 'N/A'}</td>
                      <td>
                        {product.isActive ? (
                          <span className="badge badge-primary">Active</span>
                        ) : (
                          <span className="badge badge-secondary">Inactive</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>No Products Yet</h3>
              <p>Products will appear here when farmers add them</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .dashboard-header {
          margin-bottom: 32px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-icon {
          font-size: 2.5rem;
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .stat-label {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .admin-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          background: white;
          padding: 8px;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
        }

        .tab-btn {
          padding: 12px 24px;
          background: transparent;
          border-radius: var(--radius);
          font-weight: 500;
          transition: var(--transition);
        }

        .tab-btn.active {
          background: var(--primary);
          color: white;
        }

        .admin-section {
          background: white;
          padding: 32px;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
        }

        .admin-section h2 {
          margin-bottom: 24px;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 16px;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        th {
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .order-id {
          font-family: monospace;
          background: #f5f5f5;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-select {
          padding: 8px;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          font-size: 0.875rem;
        }

        .product-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .product-image {
          width: 40px;
          height: 40px;
          border-radius: var(--radius);
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .admin-tabs {
            flex-direction: column;
          }

          th, td {
            padding: 8px;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
}
