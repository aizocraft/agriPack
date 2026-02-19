'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FarmerDashboard() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    unit: 'kg'
  });

  useEffect(() => {
    // Check if user is logged in and is a farmer
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
      
      // Fetch farmer's products
      const productsRes = await fetch(`/api/products?farmer=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const productsData = await productsRes.json();
      setProducts(productsData.products || []);

      // Fetch farmer's orders (would need to implement this endpoint)
      setOrders([]);
    } catch (error) {
      console.error('Error fetching farmer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productForm)
      });

      if (res.ok) {
        const newProduct = await res.json();
        setProducts([...products, newProduct]);
        setShowProductForm(false);
        setProductForm({
          name: '',
          description: '',
          price: '',
          category: '',
          stock: '',
          unit: 'kg'
        });
      } else {
        alert('Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h1>Farmer Dashboard</h1>
          <p>Welcome back, {user?.name}!</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowProductForm(!showProductForm)}
        >
          {showProductForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <span className="stat-value">{products.length}</span>
            <span className="stat-label">Products</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-value">{orders.length}</span>
            <span className="stat-label">Orders</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-value">KSh 0</span>
            <span className="stat-label">Total Sales</span>
          </div>
        </div>
      </div>

      {/* Add Product Form */}
      {showProductForm && (
        <div className="form-card">
          <h2>Add New Product</h2>
          <form onSubmit={handleProductSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={productForm.category}
                  onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Grains">Grains</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows="3"
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                required
              ></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price (KSh)</label>
                <input
                  type="number"
                  className="form-input"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                  required
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Stock Quantity</label>
                <input
                  type="number"
                  className="form-input"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                  required
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select
                  className="form-input"
                  value={productForm.unit}
                  onChange={(e) => setProductForm({...productForm, unit: e.target.value})}
                >
                  <option value="kg">kg</option>
                  <option value="piece">piece</option>
                  <option value="liter">liter</option>
                  <option value="bunch">bunch</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Product'}
            </button>
          </form>
        </div>
      )}

      {/* Products List */}
      <div className="dashboard-section">
        <h2>My Products</h2>
        {products.length > 0 ? (
          <div className="products-table">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
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
                    <td>
                      {product.isActive ? (
                        <span className="badge badge-primary">Active</span>
                      ) : (
                        <span className="badge badge-secondary">Inactive</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-small btn-outline">Edit</button>
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
            <p>Start adding products to sell</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowProductForm(true)}
            >
              Add Your First Product
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
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
          font-size: 1.75rem;
          font-weight: 700;
        }

        .stat-label {
          color: var(--text-secondary);
        }

        .form-card {
          background: white;
          padding: 32px;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          margin-bottom: 32px;
        }

        .form-card h2 {
          margin-bottom: 24px;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .dashboard-section {
          background: white;
          padding: 32px;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
        }

        .dashboard-section h2 {
          margin-bottom: 24px;
        }

        .products-table {
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
        }

        .product-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .product-image {
          width: 48px;
          height: 48px;
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
          .dashboard-header {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .products-table {
            font-size: 0.875rem;
          }

          th, td {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
}
