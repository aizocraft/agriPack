'use client';

import { useState, useEffect } from 'react';

export default function FarmerDashboard() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'orders'
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
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

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      // Create preview
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
      
      // Upload image if a new one is selected
      let imageUrl = productForm.image;
      if (selectedImage) {
        const uploadedUrl = await handleImageUpload();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      const method = editingProduct ? 'PUT' : 'POST';
      const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products';
      
      // Include farmer ID when creating new product
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
        
        // Reset form
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

  // Order handling functions
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
        alert('Order marked as delivered');
      } else {
        alert('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('An error occurred');
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
        alert('Order marked as paid');
      } else {
        alert('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('An error occurred');
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
                {products.map((product) => (
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
          </div>
        )}

        {/* Tab: Orders */}
        {activeTab === 'orders' && (
          <div className="table-container">
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
                {orders.map((order) => (
                  order.orderItems?.map((item, idx) => (
                    <tr key={`${order._id}-${idx}`}>
                      <td>#{order._id.slice(-6)}</td>
                      <td>{order.user?.name || 'Guest'}<br/><small>{order.user?.phone}</small></td>
                      <td>{item.name} (x{item.qty})</td>
                      <td>KSh {(item.price * item.qty).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${order.isPaid ? 'badge-success' : 'badge-warning'}`}>
                          {order.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                      <td>
                        <button className="btn btn-small btn-outline" onClick={() => handleOrderClick(order)}>View</button>
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
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
                <span className="value">{selectedOrder.user?.phone || 'N/A'}</span>
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
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-card.highlight { background: #f0fff4; border: 1px solid #c6f6d5; }
        .stat-value { font-size: 1.5rem; font-weight: bold; display: block; }
        .stat-label { color: #777; font-size: 0.9rem; }
        .table-container { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 15px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f9f9f9; font-size: 0.85rem; text-transform: uppercase; color: #888; }
        .btn-small { padding: 5px 10px; font-size: 0.8rem; }
        .badge-pending { background: #fef3c7; color: #92400e; }
        .badge-delivered { background: #d1fae5; color: #065f46; }
        .badge-success { background: #d1fae5; color: #065f46; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        
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
        
        /* Product Thumbnail Styles */
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
      `}</style>
    </div>
  );
}
