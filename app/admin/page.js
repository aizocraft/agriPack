'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalFarmers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0
  });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Pagination
  const [ordersPage, setOrdersPage] = useState(1);
  const [productsPage, setProductsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
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
      
      // Fetch users
      const usersRes = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);
      
      // Calculate stats
      const allOrders = ordersData.orders || [];
      const pendingOrders = allOrders.filter(o => o.status === 'pending').length;
      const deliveredOrders = allOrders.filter(o => o.status === 'delivered').length;
      const totalRevenue = allOrders.reduce(
        (sum, order) => sum + (order.totalPrice || 0), 0
      );
      const farmers = usersData.users?.filter(u => u.isFarmer).length || 0;
      
      setStats({
        totalOrders: allOrders.length,
        totalProducts: productsData.products?.length || 0,
        totalUsers: usersData.users?.length || 0,
        totalFarmers: farmers,
        totalRevenue,
        pendingOrders,
        deliveredOrders
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
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, status } : order
        ));
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const toggleProductActive = async (productId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (res.ok) {
        setProducts(products.map(p => 
          p._id === productId ? { ...p, isActive: !currentStatus } : p
        ));
      }
    } catch (error) {
      console.error('Error toggling product:', error);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) return false;
    if (orderSearch) {
      const searchLower = orderSearch.toLowerCase();
      const customerName = order.user?.name?.toLowerCase() || '';
      const orderId = order._id.toLowerCase();
      if (!customerName.includes(searchLower) && !orderId.includes(searchLower)) return false;
    }
    return true;
  });

  // Filter products
  const filteredProducts = products.filter(product => {
    if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;
    if (productSearch) {
      const searchLower = productSearch.toLowerCase();
      if (!product.name?.toLowerCase().includes(searchLower)) return false;
    }
    return true;
  });

  // Pagination
  const paginatedOrders = filteredOrders.slice(
    (ordersPage - 1) * itemsPerPage,
    ordersPage * itemsPerPage
  );
  const paginatedProducts = filteredProducts.slice(
    (productsPage - 1) * itemsPerPage,
    productsPage * itemsPerPage
  );
  const paginatedUsers = users.slice(
    (usersPage - 1) * itemsPerPage,
    usersPage * itemsPerPage
  );

  const totalOrdersPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const totalProductsPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const totalUsersPages = Math.ceil(users.length / itemsPerPage);

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

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
        <button className="btn btn-primary" onClick={fetchAdminData}>
          ↻ Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalOrders}</span>
            <span className="stat-label">Total Orders</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <span className="stat-value">{stats.pendingOrders}</span>
            <span className="stat-label">Pending Orders</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">{stats.deliveredOrders}</span>
            <span className="stat-label">Delivered</span>
          </div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-value">KSh {stats.totalRevenue.toLocaleString()}</span>
            <span className="stat-label">Total Revenue</span>
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
          <div className="stat-icon">👨‍🌾</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalFarmers}</span>
            <span className="stat-label">Farmers</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders ({filteredOrders.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Products ({filteredProducts.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
      </div>

      {/* Dashboard Overview */}
      {activeTab === 'dashboard' && (
        <div className="admin-section">
          <h2>Recent Activity</h2>
          <div className="overview-grid">
            <div className="overview-card">
              <h3>Recent Orders</h3>
              <div className="recent-list">
                {orders.slice(0, 5).map(order => (
                  <div key={order._id} className="recent-item">
                    <div>
                      <span className="recent-id">#{order._id.slice(-6)}</span>
                      <span className="recent-customer">{order.user?.name || 'Guest'}</span>
                    </div>
                    <span className="recent-amount">KSh {order.totalPrice?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="overview-card">
              <h3>Top Products</h3>
              <div className="recent-list">
                {products.slice(0, 5).map(product => (
                  <div key={product._id} className="recent-item">
                    <span className="recent-name">{product.name}</span>
                    <span className="recent-stock">{product.stock} {product.unit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="overview-card">
              <h3>Order Status Distribution</h3>
              <div className="status-distribution">
                {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => {
                  const count = orders.filter(o => o.status === status).length;
                  const percentage = orders.length ? (count / orders.length * 100).toFixed(1) : 0;
                  return (
                    <div key={status} className="status-bar">
                      <span className="status-name">{status}</span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${percentage}%`, background: getStatusColor(status) }}
                        ></div>
                      </div>
                      <span className="status-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {activeTab === 'orders' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>All Orders</h2>
            <div className="filters">
              <input
                type="text"
                placeholder="Search orders..."
                value={orderSearch}
                onChange={(e) => { setOrderSearch(e.target.value); setOrdersPage(1); }}
                className="search-input"
              />
              <select
                value={orderStatusFilter}
                onChange={(e) => { setOrderStatusFilter(e.target.value); setOrdersPage(1); }}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          {paginatedOrders.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <span className="order-id">#{order._id.slice(-8)}</span>
                      </td>
                      <td>
                        <div className="customer-info">
                          <span>{order.user?.name || 'Guest'}</span>
                          <small>{order.user?.phone || order.shippingAddress?.phone || 'N/A'}</small>
                        </div>
                      </td>
                      <td>{order.orderItems?.length || 0} items</td>
                      <td className="amount">KSh {order.totalPrice?.toLocaleString()}</td>
                      <td>
                        <span className={`payment-badge ${order.isPaid ? 'paid' : 'unpaid'}`}>
                          {order.isPaid ? '✓ Paid' : '○ Unpaid'}
                        </span>
                      </td>
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
              
              {totalOrdersPages > 1 && (
                <div className="pagination">
                  <button onClick={() => setOrdersPage(p => Math.max(1, p - 1))} disabled={ordersPage === 1}>Previous</button>
                  <span>Page {ordersPage} of {totalOrdersPages}</span>
                  <button onClick={() => setOrdersPage(p => Math.min(totalOrdersPages, p + 1))} disabled={ordersPage === totalOrdersPages}>Next</button>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No Orders Found</h3>
              <p>No orders match your search criteria</p>
            </div>
          )}
        </div>
      )}

      {/* Products Table */}
      {activeTab === 'products' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>All Products</h2>
            <div className="filters">
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); setProductsPage(1); }}
                className="search-input"
              />
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setProductsPage(1); }}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          
          {paginatedProducts.length > 0 ? (
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => (
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
                      <td>
                        <span className={product.stock < 10 ? 'low-stock' : ''}>
                          {product.stock}
                        </span>
                      </td>
                      <td>{product.farmer?.name || 'N/A'}</td>
                      <td>
                        <button
                          className={`toggle-btn ${product.isActive ? 'active' : 'inactive'}`}
                          onClick={() => toggleProductActive(product._id, product.isActive)}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td>
                        <Link href={`/products/${product._id}`} className="btn btn-small">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {totalProductsPages > 1 && (
                <div className="pagination">
                  <button onClick={() => setProductsPage(p => Math.max(1, p - 1))} disabled={productsPage === 1}>Previous</button>
                  <span>Page {productsPage} of {totalProductsPages}</span>
                  <button onClick={() => setProductsPage(p => Math.min(totalProductsPages, p + 1))} disabled={productsPage === totalProductsPages}>Next</button>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>No Products Found</h3>
              <p>No products match your search criteria</p>
            </div>
          )}
        </div>
      )}

      {/* Users Table */}
      {activeTab === 'users' && (
        <div className="admin-section">
          <h2>All Users</h2>
          
          {paginatedUsers.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.phone || 'N/A'}</td>
                      <td>
                        <div className="role-badges">
                          {user.isAdmin && <span className="role-badge admin">Admin</span>}
                          {user.isFarmer && <span className="role-badge farmer">Farmer</span>}
                          {!user.isAdmin && !user.isFarmer && <span className="role-badge customer">Customer</span>}
                        </div>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-small">Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {totalUsersPages > 1 && (
                <div className="pagination">
                  <button onClick={() => setUsersPage(p => Math.max(1, p - 1))} disabled={usersPage === 1}>Previous</button>
                  <span>Page {usersPage} of {totalUsersPages}</span>
                  <button onClick={() => setUsersPage(p => Math.min(totalUsersPages, p + 1))} disabled={usersPage === totalUsersPages}>Next</button>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <h3>No Users Found</h3>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-card.highlight {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
        }

        .stat-icon {
          font-size: 2rem;
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .stat-label {
          font-size: 0.85rem;
          opacity: 0.8;
        }

        .admin-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          background: white;
          padding: 8px;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          overflow-x: auto;
        }

        .tab-btn {
          padding: 12px 20px;
          background: transparent;
          border-radius: var(--radius);
          font-weight: 500;
          transition: var(--transition);
          white-space: nowrap;
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

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .filters {
          display: flex;
          gap: 12px;
        }

        .search-input, .filter-select {
          padding: 10px 16px;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          font-size: 0.95rem;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 14px;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        th {
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .order-id {
          font-family: monospace;
          background: #f5f5f5;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .customer-info, .product-cell, .user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .product-image, .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: var(--radius);
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .user-avatar {
          font-weight: 600;
          color: var(--primary);
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .amount {
          font-weight: 600;
        }

        .payment-badge {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .payment-badge.paid {
          background: #d1fae5;
          color: #065f46;
        }

        .payment-badge.unpaid {
          background: #fef3c7;
          color: #92400e;
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
          padding: 6px 10px;
          border: 1px solid var(--border);
          border-radius: 4px;
          font-size: 0.85rem;
        }

        .toggle-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .toggle-btn.active {
          background: #d1fae5;
          color: #065f46;
        }

        .toggle-btn.inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .low-stock {
          color: #dc2626;
          font-weight: 600;
        }

        .role-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .role-badge {
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .role-badge.admin { background: #7c3aed; color: white; }
        .role-badge.farmer { background: #059669; color: white; }
        .role-badge.customer { background: #6b7280; color: white; }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding: 20px;
          border-top: 1px solid var(--border);
        }

        .pagination button {
          padding: 8px 16px;
          border: 1px solid var(--border);
          background: white;
          border-radius: 4px;
          cursor: pointer;
          transition: var(--transition);
        }

        .pagination button:hover:not(:disabled) {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .overview-card {
          background: #f9fafb;
          padding: 20px;
          border-radius: var(--radius);
        }

        .overview-card h3 {
          margin-bottom: 16px;
          font-size: 1rem;
        }

        .recent-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recent-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: white;
          border-radius: 6px;
        }

        .recent-id {
          font-family: monospace;
          margin-right: 8px;
        }

        .recent-customer, .recent-name {
          font-weight: 500;
        }

        .recent-amount, .recent-stock {
          font-weight: 600;
          color: var(--primary);
        }

        .status-distribution {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .status-bar {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-name {
          width: 80px;
          font-size: 0.85rem;
          text-transform: capitalize;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .status-count {
          width: 30px;
          text-align: right;
          font-weight: 600;
          font-size: 0.85rem;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .filters {
            flex-direction: column;
            width: 100%;
          }

          .search-input, .filter-select {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
