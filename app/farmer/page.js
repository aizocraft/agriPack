'use client';

import { useState, useEffect, useMemo } from 'react';

export default function FarmerDashboard() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'orders', 'reports'
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Pagination states
  const [productsPage, setProductsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [orderFilter, setOrderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  
  // Reports states
  const [reportType, setReportType] = useState('orders');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [mpesaForm, setMpesaForm] = useState({
    phoneNumber: '',
    amount: '',
    transactionId: ''
  });
  
  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    unit: 'kg',
    image: ''
  });

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const userData = JSON.parse(userInfo);
      if (!userData.isFarmer) {
        window.location.href = '/';
        return;
      }
      setUser(userData);
      fetchFarmerData(userData._id);
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchFarmerData = async (userId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const [productsRes, ordersRes] = await Promise.all([
        fetch(`/api/products?farmer=${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/orders?type=farmer', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const productsData = await productsRes.json();
      const ordersData = await ordersRes.json();

      setProducts(productsData.products || []);
      setOrders(ordersData.orders || []);
    } catch (error) {
      console.error('Error fetching farmer data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total revenue from PAID orders only
  const calculatePaidRevenue = () => {
    return orders.reduce((sum, order) => {
      if (order.isPaid) {
        return sum + (order.farmerTotal || 0);
      }
      return sum;
    }, 0);
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (paymentFilter === 'paid' && !order.isPaid) return false;
    if (paymentFilter === 'unpaid' && order.isPaid) return false;
    return true;
  });

  // Filter orders for reports based on date range
  const filteredReportOrders = useMemo(() => {
    let filtered = [...orders];
    
    if (dateRange.start) {
      filtered = filtered.filter(o => new Date(o.createdAt) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(o => new Date(o.createdAt) <= new Date(dateRange.end));
    }
    if (searchQuery) {
      filtered = filtered.filter(o => 
        o._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.user?.phone?.includes(searchQuery)
      );
    }
    
    return filtered;
  }, [orders, dateRange, searchQuery]);

  // Report calculations
  const reportStats = useMemo(() => {
    const reportOrders = filteredReportOrders;
    
    const totalOrders = reportOrders.length;
    const totalRevenue = reportOrders.reduce((sum, o) => sum + (o.farmerTotal || 0), 0);
    const paidOrders = reportOrders.filter(o => o.isPaid).length;
    const pendingOrders = reportOrders.filter(o => !o.isPaid).length;
    const deliveredOrders = reportOrders.filter(o => o.status === 'delivered').length;
    const pendingDeliveries = reportOrders.filter(o => o.status !== 'delivered').length;
    
    // Orders by status
    const ordersByStatus = reportOrders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});
    
    // Orders by payment
    const ordersByPayment = {
      paid: paidOrders,
      unpaid: pendingOrders
    };
    
    // Daily revenue for the last 30 days
    const dailyRevenue = reportOrders.reduce((acc, o) => {
      const date = new Date(o.createdAt).toLocaleDateString();
      acc[date] = (acc[date] || 0) + (o.farmerTotal || 0);
      return acc;
    }, {});
    
    return {
      totalOrders,
      totalRevenue,
      paidOrders,
      pendingOrders,
      deliveredOrders,
      pendingDeliveries,
      ordersByStatus,
      ordersByPayment,
      dailyRevenue
    };
  }, [filteredReportOrders]);

// Download report as CSV
  const downloadReport = () => {
    const reportOrders = filteredReportOrders;
    
    const headers = ['Order ID', 'Customer', 'Phone', 'Items', 'Total', 'Payment Status', 'Order Status', 'Date'];
    const rows = reportOrders.map(order => [
      order._id,
      order.user?.name || 'Guest',
      order.user?.phone || 'N/A',
      order.orderItems?.map(i => `${i.name} x${i.qty}`).join(', '),
      order.farmerTotal || 0,
      order.isPaid ? 'Paid' : 'Unpaid',
      order.status,
      new Date(order.createdAt).toLocaleDateString()
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agripack-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Download report as PDF
  const downloadPDF = () => {
    const reportOrders = filteredReportOrders;
    const dateStr = new Date().toLocaleDateString();
    
    // Generate HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>AgriPack Report - ${dateStr}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2e7d32; }
    .header h1 { color: #2e7d32; font-size: 28px; margin-bottom: 5px; }
    .header p { color: #666; font-size: 14px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-box { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-box.highlight { background: #e8f5e9; border: 1px solid #a5d6a7; }
    .stat-value { font-size: 20px; font-weight: bold; color: #2e7d32; }
    .stat-label { font-size: 12px; color: #666; }
    .section { margin-bottom: 30px; }
    .section h2 { font-size: 18px; color: #2e7d32; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #2e7d32; color: white; padding: 10px; text-align: left; }
    td { padding: 8px 10px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) { background: #f9f9f9; }
    .badge { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
    .badge-paid { background: #d1fae5; color: #065f46; }
    .badge-unpaid { background: #fef3c7; color: #92400e; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-processing { background: #dbeafe; color: #1e40af; }
    .badge-shipped { background: #e0e7ff; color: #3730a3; }
    .badge-delivered { background: #d1fae5; color: #065f46; }
    .footer { margin-top: 30px; text-align: center; color: #999; font-size: 11px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌾 AgriPack Report</h1>
    <p>Generated on ${dateStr} | Farmer: ${user?.name}</p>
  </div>
  
  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-value">${reportStats.totalOrders}</div>
      <div class="stat-label">Total Orders</div>
    </div>
    <div class="stat-box highlight">
      <div class="stat-value">KSh ${reportStats.totalRevenue.toLocaleString()}</div>
      <div class="stat-label">Total Revenue</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${reportStats.paidOrders}</div>
      <div class="stat-label">Paid Orders</div>
    </div>
  </div>
  
  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-value">${reportStats.pendingOrders}</div>
      <div class="stat-label">Pending Payments</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${reportStats.deliveredOrders}</div>
      <div class="stat-label">Delivered</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${reportStats.pendingDeliveries}</div>
      <div class="stat-label">Pending Deliveries</div>
    </div>
  </div>
  
  <div class="section">
    <h2>Orders by Status</h2>
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Count</th>
          <th>Percentage</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(reportStats.ordersByStatus).map(([status, count]) => `
        <tr>
          <td><span class="badge badge-${status}">${status}</span></td>
          <td>${count}</td>
          <td>${reportStats.totalOrders ? ((count / reportStats.totalOrders) * 100).toFixed(1) : 0}%</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <div class="section">
    <h2>Recent Orders (${Math.min(reportOrders.length, 50)})</h2>
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
        </tr>
      </thead>
      <tbody>
        ${reportOrders.slice(0, 50).map(order => `
        <tr>
          <td>#${order._id.slice(-6)}</td>
          <td>${order.user?.name || 'Guest'}</td>
          <td>${order.orderItems?.length || 0} items</td>
          <td>KSh ${(order.farmerTotal || 0).toLocaleString()}</td>
          <td><span class="badge ${order.isPaid ? 'badge-paid' : 'badge-unpaid'}">${order.isPaid ? 'Paid' : 'Unpaid'}</span></td>
          <td><span class="badge badge-${order.status}">${order.status}</span></td>
          <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <div class="footer">
    <p>AgriPack - Fresh from Farm to Table | www.agripack.com</p>
  </div>
</body>
</html>`;
    
    // Create a new window with the content and trigger print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  // Pagination
  const paginatedProducts = products.slice(
    (productsPage - 1) * itemsPerPage,
    productsPage * itemsPerPage
  );

  const paginatedOrders = filteredOrders.slice(
    (ordersPage - 1) * itemsPerPage,
    ordersPage * itemsPerPage
  );

  const totalProductsPages = Math.ceil(products.length / itemsPerPage);
  const totalOrdersPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return null;
    
    setUploadingImage(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await res.json();
      if (data.imageUrl) {
        return data.imageUrl;
      }
      return null;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      unit: product.unit || 'kg',
      image: product.image || ''
    });
    setImagePreview(product.image || null);
    setSelectedImage(null);
    setShowProductForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      let imageUrl = productForm.image;
      if (selectedImage) {
        const uploadedUrl = await handleImageUpload();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      const method = editingProduct ? 'PUT' : 'POST';
      const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products';
      
      const productData = editingProduct 
        ? { ...productForm, image: imageUrl }
        : { ...productForm, farmer: user._id, image: imageUrl };
      
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });

      if (res.ok) {
        const updatedProduct = await res.json();
        if (editingProduct) {
          setProducts(products.map(p => p._id === updatedProduct._id ? updatedProduct : p));
        } else {
          setProducts([...products, updatedProduct]);
        }
        
        setShowProductForm(false);
        setEditingProduct(null);
        setProductForm({ name: '', description: '', price: '', category: '', stock: '', unit: 'kg', image: '' });
        setSelectedImage(null);
        setImagePreview(null);
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Action failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setProducts(products.filter(p => p._id !== productId));
        alert('Product deleted successfully');
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
    setMpesaForm({
      phoneNumber: order.user?.phone || '',
      amount: order.farmerTotal?.toString() || '',
      transactionId: ''
    });
  };

  const handleMarkDelivered = async () => {
    if (!selectedOrder) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${selectedOrder._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'delivered' })
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders(orders.map(o => o._id === updatedOrder._id ? updatedOrder : o));
        setSelectedOrder(updatedOrder);
        alert('Order marked as delivered successfully!');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('An error occurred while updating the order');
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedOrder) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${selectedOrder._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPaid: true })
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders(orders.map(o => o._id === updatedOrder._id ? updatedOrder : o));
        setSelectedOrder(updatedOrder);
        alert('Order marked as paid successfully!');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('An error occurred while updating the order');
    }
  };

  const handleMpesaPayment = async () => {
    if (!selectedOrder || !mpesaForm.transactionId) {
      alert('Please enter transaction ID');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${selectedOrder._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isPaid: true,
          paymentResult: {
            id: mpesaForm.transactionId,
            status: 'Completed',
            phoneNumber: mpesaForm.phoneNumber,
            amount: parseFloat(mpesaForm.amount)
          }
        })
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders(orders.map(o => o._id === updatedOrder._id ? updatedOrder : o));
        setSelectedOrder(updatedOrder);
        setShowMpesaModal(false);
        alert('Payment recorded successfully');
      } else {
        alert('Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('An error occurred');
    }
  };

  // Toggle handlers for quick status/payment updates
  const toggleOrderStatus = async (orderId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'pending' ? 'processing' : 
                        currentStatus === 'processing' ? 'shipped' : 'delivered';
      
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders(orders.map(o => o._id === updatedOrder._id ? updatedOrder : o));
      }
    } catch (error) {
      console.error('Error toggling order status:', error);
    }
  };

  const togglePaymentStatus = async (orderId, currentPaid) => {
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPaid: !currentPaid })
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders(orders.map(o => o._id === updatedOrder._id ? updatedOrder : o));
      }
    } catch (error) {
      console.error('Error toggling payment status:', error);
    }
  };

  if (loading && !user) return <div className="container p-10 text-center">Loading Dashboard...</div>;

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h1>Farmer Dashboard</h1>
          <p>Welcome back, <strong>{user?.name}</strong></p>
        </div>
        <button 
          className={`btn ${showProductForm ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => {
            setShowProductForm(!showProductForm);
            if(showProductForm) {
              setEditingProduct(null);
              setSelectedImage(null);
              setImagePreview(null);
            }
          }}
        >
          {showProductForm ? 'Close Form' : '+ Add Product'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{products.length}</span>
            <span className="stat-label">Products</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{orders.length}</span>
            <span className="stat-label">Orders</span>
          </div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-info">
            <span className="stat-value">KSh {calculatePaidRevenue().toLocaleString()}</span>
            <span className="stat-label">Total Revenue (Paid)</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          My Products
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Incoming Orders
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📊 Reports
        </button>
      </div>

      <div className="dashboard-content">
        {/* Product Form - Shows for both Add and Edit */}
        {showProductForm && (
          <div className="form-card animate-fade-in">
            <h2>{editingProduct ? `Edit: ${editingProduct.name}` : 'Add New Product'}</h2>
            <form onSubmit={handleProductSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name</label>
                  <input type="text" className="form-input" value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-input" value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})} required>
                    <option value="">Select Category</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Grains">Grains</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-input" rows="2" value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} required></textarea>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (KSh)</label>
                  <input type="number" className="form-input" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input type="number" className="form-input" value={productForm.stock} onChange={(e) => setProductForm({...productForm, stock: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select className="form-input" value={productForm.unit} onChange={(e) => setProductForm({...productForm, unit: e.target.value})}>
                    <option value="kg">kg</option>
                    <option value="piece">piece</option>
                    <option value="liter">liter</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Product Image</label>
                <input 
                  type="file" 
                  className="form-input" 
                  accept="image/*"
                  onChange={handleImageSelect}
                />
                {(imagePreview || productForm.image) && (
                  <div className="image-preview">
                    <img src={imagePreview || productForm.image} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
                  </div>
                )}
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading || uploadingImage}>
                {loading || uploadingImage ? 'Processing...' : editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </form>
          </div>
        )}

        {/* Tab: Products */}
        {activeTab === 'products' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="product-thumb">
                        {product.image ? (
                          <img src={product.image} alt={product.name} />
                        ) : (
                          <span className="placeholder-icon">🥬</span>
                        )}
                      </div>
                    </td>
                    <td><strong>{product.name}</strong></td>
                    <td>KSh {product.price}/{product.unit}</td>
                    <td>{product.stock}</td>
                    <td><span className={`badge ${product.isActive ? 'badge-primary' : 'badge-secondary'}`}>{product.isActive ? 'Active' : 'Hidden'}</span></td>
                    <td>
                      <button className="btn btn-small btn-outline" onClick={() => handleEditClick(product)}>Edit</button>
                      <button className="btn btn-small btn-danger" onClick={() => handleDeleteProduct(product._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            {totalProductsPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-btn" 
                  onClick={() => setProductsPage(p => Math.max(1, p - 1))}
                  disabled={productsPage === 1}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {productsPage} of {totalProductsPages}
                </span>
                <button 
                  className="pagination-btn" 
                  onClick={() => setProductsPage(p => Math.min(totalProductsPages, p + 1))}
                  disabled={productsPage === totalProductsPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Orders */}
        {activeTab === 'orders' && (
          <div className="table-container">
            {/* Filters */}
            <div className="table-filters">
              <select 
                value={statusFilter} 
                onChange={(e) => { setStatusFilter(e.target.value); setOrdersPage(1); }}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
              
              <select 
                value={paymentFilter} 
                onChange={(e) => { setPaymentFilter(e.target.value); setOrdersPage(1); }}
                className="filter-select"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product & Qty</th>
                  <th>Revenue</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  order.orderItems?.map((item, idx) => (
                    <tr key={`${order._id}-${idx}`}>
                      <td>#{order._id.slice(-6)}</td>
                      <td>{order.user?.name || 'Guest'}<br/><small>{order.user?.phone}</small></td>
                      <td>{item.name} (x{item.qty})</td>
                      <td>KSh {(item.price * item.qty).toLocaleString()}</td>
                      <td>
                        <button 
                          className={`toggle-btn ${order.isPaid ? 'paid' : 'unpaid'}`}
                          onClick={() => togglePaymentStatus(order._id, order.isPaid)}
                        >
                          {order.isPaid ? '✓ Paid' : '○ Unpaid'}
                        </button>
                      </td>
                      <td>
                        <button 
                          className={`toggle-btn status-${order.status}`}
                          onClick={() => toggleOrderStatus(order._id, order.status)}
                        >
                          {order.status}
                        </button>
                      </td>
                      <td>
                        <button className="btn btn-small btn-outline" onClick={() => handleOrderClick(order)}>View</button>
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalOrdersPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-btn" 
                  onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                  disabled={ordersPage === 1}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {ordersPage} of {totalOrdersPages}
                </span>
                <button 
                  className="pagination-btn" 
                  onClick={() => setOrdersPage(p => Math.min(totalOrdersPages, p + 1))}
                  disabled={ordersPage === totalOrdersPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Reports */}
        {activeTab === 'reports' && (
          <div className="reports-container">
            {/* Report Filters */}
            <div className="report-filters">
              <div className="filter-group">
                <label>Search Order ID or Customer:</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Start Date:</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                />
              </div>
              <div className="filter-group">
                <label>End Date:</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                />
              </div>
<button className="btn btn-primary" onClick={downloadReport}>
                📄 CSV
              </button>
              <button className="btn btn-secondary" onClick={downloadPDF}>
                📑 PDF
              </button>
            </div>

            {/* Report Stats */}
            <div className="report-stats-grid">
              <div className="report-stat-card">
                <div className="report-stat-icon">📦</div>
                <div className="report-stat-info">
                  <span className="report-stat-value">{reportStats.totalOrders}</span>
                  <span className="report-stat-label">Total Orders</span>
                </div>
              </div>
              <div className="report-stat-card highlight">
                <div className="report-stat-icon">💰</div>
                <div className="report-stat-info">
                  <span className="report-stat-value">KSh {reportStats.totalRevenue.toLocaleString()}</span>
                  <span className="report-stat-label">Total Revenue</span>
                </div>
              </div>
              <div className="report-stat-card success">
                <div className="report-stat-icon">✅</div>
                <div className="report-stat-info">
                  <span className="report-stat-value">{reportStats.paidOrders}</span>
                  <span className="report-stat-label">Paid Orders</span>
                </div>
              </div>
              <div className="report-stat-card warning">
                <div className="report-stat-icon">⏳</div>
                <div className="report-stat-info">
                  <span className="report-stat-value">{reportStats.pendingOrders}</span>
                  <span className="report-stat-label">Pending Payments</span>
                </div>
              </div>
              <div className="report-stat-card info">
                <div className="report-stat-icon">🚚</div>
                <div className="report-stat-info">
                  <span className="report-stat-value">{reportStats.deliveredOrders}</span>
                  <span className="report-stat-label">Delivered</span>
                </div>
              </div>
              <div className="report-stat-card">
                <div className="report-stat-icon">📋</div>
                <div className="report-stat-info">
                  <span className="report-stat-value">{reportStats.pendingDeliveries}</span>
                  <span className="report-stat-label">Pending Deliveries</span>
                </div>
              </div>
            </div>

{/* Orders by Status - Visual Chart */}
            <div className="report-section">
              <h3>📊 Orders by Status</h3>
              
              {/* Pie Chart for Orders by Status */}
              <div className="chart-container">
                <div className="pie-chart-wrapper">
                  <svg viewBox="0 0 100 100" className="pie-chart">
                    {(() => {
                      const total = reportStats.totalOrders;
                      if (total === 0) return null;
                      const colors = {
                        pending: '#f59e0b',
                        processing: '#3b82f6',
                        shipped: '#8b5cf6',
                        delivered: '#10b981'
                      };
                      let cumulativePercent = 0;
                      return Object.entries(reportStats.ordersByStatus).map(([status, count]) => {
                        const percent = (count / total) * 100;
                        const startAngle = cumulativePercent * 3.6;
                        cumulativePercent += percent;
                        const endAngle = cumulativePercent * 3.6;
                        const largeArc = percent > 50 ? 1 : 0;
                        const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                        const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                        const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                        const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                        return (
                          <path
                            key={status}
                            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={colors[status] || '#ccc'}
                            className="pie-segment"
                          />
                        );
                      });
                    })()}
                    <circle cx="50" cy="50" r="25" fill="white" />
                  </svg>
                </div>
                
                {/* Legend */}
                <div className="chart-legend">
                  {Object.entries(reportStats.ordersByStatus).map(([status, count]) => {
                    const colors = {
                      pending: '#f59e0b',
                      processing: '#3b82f6',
                      shipped: '#8b5cf6',
                      delivered: '#10b981'
                    };
                    const percent = reportStats.totalOrders ? ((count / reportStats.totalOrders) * 100).toFixed(1) : 0;
                    return (
                      <div key={status} className="legend-item">
                        <span className="legend-color" style={{ background: colors[status] || '#ccc' }}></span>
                        <span className="legend-label">{status}</span>
                        <span className="legend-value">{count} ({percent}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Bar Chart Alternative */}
              <div className="status-bars">
                {Object.entries(reportStats.ordersByStatus).map(([status, count]) => (
                  <div key={status} className="status-bar-item">
                    <div className="status-bar-label">
                      <span>{status}</span>
                      <span>{count}</span>
                    </div>
                    <div className="status-bar">
                      <div 
                        className={`status-bar-fill status-${status}`}
                        style={{ width: `${(count / reportStats.totalOrders) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Overview - Visual Chart */}
            <div className="report-section">
              <h3>💳 Payment Overview</h3>
              
              {/* Payment Donut Chart */}
              <div className="chart-container">
                <div className="pie-chart-wrapper">
                  <svg viewBox="0 0 100 100" className="pie-chart">
                    {(() => {
                      const total = reportStats.totalOrders;
                      if (total === 0) return null;
                      const paidPercent = (reportStats.ordersByPayment.paid / total) * 100;
                      const unpaidPercent = (reportStats.ordersByPayment.unpaid / total) * 100;
                      const paidAngle = paidPercent * 3.6;
                      
                      const x1 = 50 + 40 * Math.cos(-90 * Math.PI / 180);
                      const y1 = 50 + 40 * Math.sin(-90 * Math.PI / 180);
                      const x2 = 50 + 40 * Math.cos((paidAngle - 90) * Math.PI / 180);
                      const y2 = 50 + 40 * Math.sin((paidAngle - 90) * Math.PI / 180);
                      
                      return (
                        <>
                          <path
                            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${paidPercent > 50 ? 1 : 0} 1 ${x2} ${y2} Z`}
                            fill="#10b981"
                          />
                          <path
                            d={`M 50 50 L ${x2} ${y2} A 40 40 0 ${unpaidPercent > 50 ? 1 : 0} 1 ${x1} ${y1} Z`}
                            fill="#f59e0b"
                          />
                          <circle cx="50" cy="50" r="25" fill="white" />
                        </>
                      );
                    })()}
                  </svg>
                </div>
                
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-color" style={{ background: '#10b981' }}></span>
                    <span className="legend-label">Paid</span>
                    <span className="legend-value">{reportStats.ordersByPayment.paid}</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ background: '#f59e0b' }}></span>
                    <span className="legend-label">Unpaid</span>
                    <span className="legend-value">{reportStats.ordersByPayment.unpaid}</span>
                  </div>
                </div>
              </div>
              
              {/* Payment Cards */}
              <div className="payment-cards">
                <div className="payment-card paid">
                  <span className="payment-label">Paid</span>
                  <span className="payment-value">{reportStats.ordersByPayment.paid}</span>
                </div>
                <div className="payment-card unpaid">
                  <span className="payment-label">Unpaid</span>
                  <span className="payment-value">{reportStats.ordersByPayment.unpaid}</span>
                </div>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="report-section">
              <h3>💰 Revenue Overview</h3>
              <div className="chart-container revenue-chart">
                {/* Revenue Stats */}
                <div className="revenue-stats">
                  <div className="revenue-stat">
                    <span className="revenue-label">Total Revenue</span>
                    <span className="revenue-value">KSh {reportStats.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="revenue-stat">
                    <span className="revenue-label">Average per Order</span>
                    <span className="revenue-value">KSh {reportStats.totalOrders ? Math.round(reportStats.totalRevenue / reportStats.totalOrders).toLocaleString() : 0}</span>
                  </div>
                </div>
                
                {/* Simple Bar for Revenue */}
                <div className="revenue-bar-container">
                  <div className="revenue-bar-wrapper">
                    <div 
                      className="revenue-bar"
                      style={{ width: '100%' }}
                    >
                      <span className="revenue-bar-label">100% Revenue</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtered Orders Table */}
            <div className="report-section">
              <h3>Filtered Orders ({filteredReportOrders.length})</h3>
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
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReportOrders.slice(0, 50).map((order) => (
                      <tr key={order._id}>
                        <td>#{order._id.slice(-6)}</td>
                        <td>{order.user?.name || 'Guest'}</td>
                        <td>{order.orderItems?.length} items</td>
                        <td>KSh {(order.farmerTotal || 0).toLocaleString()}</td>
                        <td>
                          <span className={`badge ${order.isPaid ? 'badge-success' : 'badge-warning'}`}>
                            {order.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${order.status}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

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
                <span className="label">Customer:</span>
                <span className="value">{selectedOrder.user?.name || 'Guest'}</span>
              </div>
              <div className="order-detail-row">
                <span className="label">Phone:</span>
                <span className="value">{selectedOrder.user?.phone || selectedOrder.shippingAddress?.phone || selectedOrder.phoneNumber || 'N/A'}</span>
              </div>
              
              {/* Shipping Address - Show for all buyers including guests */}
              {selectedOrder.shippingAddress && (
                <>
                  <div className="order-detail-row">
                    <span className="label">Shipping Address:</span>
                  </div>
                  <div className="shipping-address-card">
                    <p><strong>Street:</strong> {selectedOrder.shippingAddress.street || 'N/A'}</p>
                    <p><strong>City:</strong> {selectedOrder.shippingAddress.city || 'N/A'}</p>
                    <p><strong>State:</strong> {selectedOrder.shippingAddress.state || 'N/A'}</p>
                    <p><strong>Zip Code:</strong> {selectedOrder.shippingAddress.zipCode || 'N/A'}</p>
                  </div>
                </>
              )}
              
              <div className="order-detail-row">
                <span className="label">Payment Method:</span>
                <span className="value">{selectedOrder.paymentMethod?.toUpperCase() || 'N/A'}</span>
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
              
              <h3>Items</h3>
              <div className="order-items">
                {selectedOrder.orderItems?.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-qty">x{item.qty}</span>
                    </div>
                    <span className="item-price">KSh {(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              
              <div className="order-total">
                <span>Total:</span>
                <span>KSh {selectedOrder.farmerTotal?.toLocaleString()}</span>
              </div>

              {/* Action Buttons */}
              <div className="order-actions">
                {!selectedOrder.isDelivered && selectedOrder.status !== 'delivered' && (
                  <button className="btn btn-primary" onClick={handleMarkDelivered}>
                    Mark as Delivered
                  </button>
                )}
                
                {!selectedOrder.isPaid && (
                  <>
                    {selectedOrder.paymentMethod === 'mpesa' ? (
                      <button className="btn btn-success" onClick={() => setShowMpesaModal(true)}>
                        Record M-Pesa Payment
                      </button>
                    ) : (
                      <button className="btn btn-success" onClick={handleMarkPaid}>
                        Mark as Paid
                      </button>
                    )}
                  </>
                )}
                
                {selectedOrder.isPaid && (
                  <button className="btn btn-secondary" disabled>
                    Payment Recorded
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* M-Pesa Payment Modal */}
      {showMpesaModal && (
        <div className="modal-overlay" onClick={() => setShowMpesaModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record M-Pesa Payment</h2>
              <button className="close-btn" onClick={() => setShowMpesaModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Customer Phone Number</label>
                <input 
                  type="tel" 
                  className="form-input" 
                  value={mpesaForm.phoneNumber}
                  onChange={(e) => setMpesaForm({...mpesaForm, phoneNumber: e.target.value})}
                  placeholder="254712345678"
                />
              </div>
              <div className="form-group">
                <label>Amount (KSh)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={mpesaForm.amount}
                  onChange={(e) => setMpesaForm({...mpesaForm, amount: e.target.value})}
                  placeholder="1000"
                />
              </div>
              <div className="form-group">
                <label>Transaction ID (M-Pesa Receipt Number)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={mpesaForm.transactionId}
                  onChange={(e) => setMpesaForm({...mpesaForm, transactionId: e.target.value})}
                  placeholder="Mpesa Receipt Number"
                  required
                />
              </div>
              <button className="btn btn-primary" onClick={handleMpesaPayment}>
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .tabs-container {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 1px solid #ddd;
        }
        .tab-btn {
          padding: 12px 24px;
          border: none;
          background: none;
          cursor: pointer;
          font-weight: 600;
          color: #666;
          border-bottom: 3px solid transparent;
          transition: 0.3s;
        }
        .tab-btn.active {
          color: var(--primary-color, #27ae60);
          border-bottom-color: var(--primary-color, #27ae60);
        }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: var(--surface); padding: 20px; border-radius: 8px; box-shadow: var(--shadow); }
        .stat-card.highlight { background: #f0fff4; border: 1px solid #c6f6d5; }
        .stat-value { font-size: 1.5rem; font-weight: bold; display: block; }
        .stat-label { color: #777; font-size: 0.9rem; }
        .table-container { background: var(--surface); border-radius: 8px; overflow: hidden; box-shadow: var(--shadow); }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 15px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f9f9f9; font-size: 0.85rem; text-transform: uppercase; color: #888; }
        .btn-small { padding: 5px 10px; font-size: 0.8rem; }
        
        .table-filters {
          display: flex;
          gap: 12px;
          padding: 16px;
          border-bottom: 1px solid #eee;
        }
        
        .filter-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
        }

        .toggle-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.85rem;
          transition: 0.2s;
        }

        .toggle-btn.paid { background: #d1fae5; color: #065f46; }
        .toggle-btn.unpaid { background: #fef3c7; color: #92400e; }
        .toggle-btn.status-pending { background: #fef3c7; color: #92400e; }
        .toggle-btn.status-processing { background: #dbeafe; color: #1e40af; }
        .toggle-btn.status-shipped { background: #e0e7ff; color: #3730a3; }
        .toggle-btn.status-delivered { background: #d1fae5; color: #065f46; }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-top: 1px solid #eee;
        }

        .pagination-btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          transition: 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          color: #666;
          font-size: 0.9rem;
        }
        
        /* Reports Styles */
        .reports-container {
          background: var(--surface);
          border-radius: 8px;
          padding: 24px;
          box-shadow: var(--shadow);
        }

        .report-filters {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
          padding: 16px;
          background: var(--background);
          border-radius: 8px;
        }

        .filter-group {
          flex: 1;
          min-width: 150px;
        }

        .filter-group label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 6px;
          color: var(--text-secondary);
        }

        .report-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .report-stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: var(--surface);
          border-radius: 8px;
          box-shadow: var(--shadow);
          transition: transform 0.2s;
        }

        .report-stat-card:hover {
          transform: translateY(-2px);
        }

        .report-stat-card.highlight {
          background: linear-gradient(135deg, #f0fff4 0%, #d1fae5 100%);
        }

        .report-stat-card.success {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
        }

        .report-stat-card.warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        }

        .report-stat-card.info {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        }

        .report-stat-icon {
          font-size: 2rem;
        }

        .report-stat-value {
          font-size: 1.25rem;
          font-weight: bold;
          display: block;
        }

        .report-stat-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .report-section {
          margin-bottom: 24px;
        }

        .report-section h3 {
          margin-bottom: 16px;
          font-size: 1.1rem;
        }

        .status-bars {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .status-bar-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .status-bar-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }

        .status-bar {
          height: 8px;
          background: var(--border);
          border-radius: 4px;
          overflow: hidden;
        }

        .status-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .status-bar-fill.status-pending { background: #f59e0b; }
        .status-bar-fill.status-processing { background: #3b82f6; }
        .status-bar-fill.status-shipped { background: #8b5cf6; }
        .status-bar-fill.status-delivered { background: #10b981; }

        .payment-cards {
          display: flex;
          gap: 16px;
        }

        .payment-card {
          flex: 1;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }

        .payment-card.paid {
          background: #d1fae5;
        }

        .payment-card.unpaid {
          background: #fef3c7;
        }

        .payment-label {
          display: block;
          font-size: 0.9rem;
          margin-bottom: 8px;
        }

        .payment-value {
          font-size: 2rem;
          font-weight: bold;
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
          background: var(--surface);
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
        .modal-header h2 { margin: 0; font-size: 1.25rem; }
        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }
        .modal-body { padding: 20px; }
        
        .order-detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .order-detail-row .label { color: #666; }
        .order-detail-row .value { font-weight: 500; }

        .shipping-address-card {
          background: #f9f9f9;
          padding: 12px;
          border-radius: 8px;
          margin: 8px 0 16px;
        }

        .shipping-address-card p {
          margin: 4px 0;
          color: #555;
        }
        
        .order-items {
          margin: 15px 0;
          padding: 10px;
          background: #f9f9f9;
          border-radius: 8px;
        }
        .order-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .order-item:last-child { border-bottom: none; }
        .item-info { display: flex; gap: 10px; }
        .item-name { font-weight: 500; }
        .item-qty { color: #666; }
        
        .order-total {
          display: flex;
          justify-content: space-between;
          padding: 15px;
          background: #f0fff4;
          border-radius: 8px;
          font-weight: bold;
          font-size: 1.1rem;
          margin-top: 10px;
        }
        
        .order-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        .order-actions .btn {
          flex: 1;
          min-width: 150px;
        }
        
        .product-thumb {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .product-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .product-thumb .placeholder-icon {
          font-size: 1.5rem;
        }

        .btn-success {
          background: #22c55e;
          color: white;
        }

@media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .table-filters {
            flex-direction: column;
          }
          
          .table-container {
            overflow-x: auto;
          }

          .report-filters {
            flex-direction: column;
          }

          .filter-group {
            width: 100%;
          }

          .payment-cards {
            flex-direction: column;
          }

          .chart-container {
            flex-direction: column;
          }
        }

        /* Chart Styles */
        .chart-container {
          display: flex;
          align-items: center;
          gap: 32px;
          margin-bottom: 24px;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 12px;
        }

        .pie-chart-wrapper {
          width: 180px;
          height: 180px;
          flex-shrink: 0;
        }

        .pie-chart {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .pie-segment {
          transition: transform 0.2s;
          cursor: pointer;
        }

        .pie-segment:hover {
          opacity: 0.8;
        }

        .chart-legend {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .legend-label {
          font-weight: 500;
          text-transform: capitalize;
          flex: 1;
        }

        .legend-value {
          font-weight: 600;
          color: var(--primary);
        }

        .revenue-chart {
          flex-direction: column;
          align-items: stretch;
        }

        .revenue-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .revenue-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .revenue-label {
          font-size: 0.85rem;
          color: #666;
        }

        .revenue-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--primary);
        }

        .revenue-bar-container {
          margin-top: 16px;
        }

        .revenue-bar-wrapper {
          height: 32px;
          background: #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
        }

        .revenue-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 12px;
          color: white;
          font-weight: 600;
          font-size: 0.85rem;
          transition: width 0.5s ease;
        }
      `}</style>
    </div>
  );
}
