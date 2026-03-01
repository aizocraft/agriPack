'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AddToCartButton from '@/components/AddToCartButton';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [maxPriceLimit, setMaxPriceLimit] = useState(10000);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      
      if (res.ok) {
        setProducts(data.products || []);
        // Extract unique categories
        const uniqueCategories = [...new Set(data.products?.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories);
        
        // Set max price limit based on products
        if (data.products && data.products.length > 0) {
          const maxProductPrice = Math.max(...data.products.map(p => p.price || 0));
          setMaxPriceLimit(Math.ceil(maxProductPrice * 1.1)); // 10% buffer
          setPriceRange({ min: 0, max: Math.ceil(maxProductPrice * 1.1) });
        }
      } else {
        setError(data.message || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Could not connect to the server');
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on current filters
  const filteredProducts = products.filter(product => {
    // Search filter
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !product.category?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (selectedCategory !== 'all' && product.category !== selectedCategory) {
      return false;
    }
    
    // In stock filter
    if (inStockOnly && product.stock <= 0) {
      return false;
    }
    
    // Price filter
    if (product.price < priceRange.min || product.price > priceRange.max) {
      return false;
    }
    
    return true;
  });

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleInStockToggle = () => {
    setInStockOnly(!inStockOnly);
  };

  const handlePriceChange = (type, value) => {
    setPriceRange(prev => ({
      ...prev,
      [type]: parseInt(value) || 0
    }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setInStockOnly(false);
    setPriceRange({ min: 0, max: maxPriceLimit });
  };

  if (loading) return <div className="container"><div className="spinner"></div></div>;

  return (
    <div className="container">
      <header className="page-header">
        <h1>Fresh Produce</h1>
        <p>Direct from farmers to your kitchen.</p>
      </header>

      {/* Search and Filters Section */}
      <div className="filters-section">
        {/* Search Bar */}
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearch}
              className="search-input"
            />
            {searchQuery && (
              <button 
                className="search-clear" 
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="filter-controls">
          {/* Category Filter */}
          <div className="filter-group">
            <label className="filter-label">Category</label>
            <select 
              value={selectedCategory} 
              onChange={handleCategoryChange}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Price Range Slider */}
          <div className="filter-group price-range-group">
            <label className="filter-label">Price Range: KSh {priceRange.min} - KSh {priceRange.max}</label>
            <div className="price-slider-container">
              <input
                type="range"
                min="0"
                max={maxPriceLimit}
                value={priceRange.min}
                onChange={(e) => handlePriceChange('min', e.target.value)}
                className="price-slider price-slider-min"
              />
              <input
                type="range"
                min="0"
                max={maxPriceLimit}
                value={priceRange.max}
                onChange={(e) => handlePriceChange('max', e.target.value)}
                className="price-slider price-slider-max"
              />
            </div>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min || ''}
                onChange={(e) => handlePriceChange('min', e.target.value)}
                className="price-input"
              />
              <span className="price-separator">-</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max || ''}
                onChange={(e) => handlePriceChange('max', e.target.value)}
                className="price-input"
              />
            </div>
          </div>

          {/* In Stock Toggle */}
          <div className="filter-group">
            <label className="filter-label">Stock Status</label>
            <button 
              className={`in-stock-btn ${inStockOnly ? 'active' : ''}`}
              onClick={handleInStockToggle}
            >
              <span className="stock-icon">{inStockOnly ? '✓' : '○'}</span>
              In Stock Only
            </button>
          </div>

          {/* Clear Filters */}
          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        {/* Results Count */}
        <div className="results-info">
          <span>Showing {filteredProducts.length} of {products.length} products</span>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <div key={product._id} className="inline-card">
              <Link href={`/products/${product._id}`} className="card-link">
                <div className="card-image">
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <div className="placeholder">🥬</div>
                  )}
                  {/* Stock Badge */}
                  <div className="stock-badge-container">
                    {product.stock > 0 ? (
                      <span className="stock-badge in-stock">In Stock</span>
                    ) : (
                      <span className="stock-badge out-of-stock">Out of Stock</span>
                    )}
                  </div>
                </div>
              </Link>
              
              <div className="card-content">
                <div className="card-info-top">
                   <span className="category-tag">{product.category}</span>
                   <h3 className="product-name">{product.name}</h3>
                </div>
                
                <p className="price">
                  KSh {product.price} <span className="unit">/ {product.unit}</span>
                </p>

                {/* Stock Info */}
                {product.stock > 0 && (
                  <p className="stock-info">{product.stock} {product.unit}s available</p>
                )}
                
                <div className="card-actions">
                  <AddToCartButton product={product} />
                  
                  <Link href={`/products/${product._id}`} className="details-link">
                    Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>No products found</h3>
          <p>Try adjusting your filters or search terms</p>
          <button className="btn btn-primary" onClick={clearFilters}>
            Clear All Filters
          </button>
        </div>
      )}

      <style jsx>{`
        .filters-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin: 24px 0;
          box-shadow: var(--shadow);
        }

        .search-container {
          margin-bottom: 20px;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          font-size: 1.2rem;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 14px 40px 14px 48px;
          font-size: 1rem;
          border: 2px solid var(--border);
          border-radius: var(--radius);
          transition: var(--transition);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
        }

        .search-clear {
          position: absolute;
          right: 12px;
          background: var(--border);
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          transition: var(--transition);
        }

        .search-clear:hover {
          background: var(--error);
          color: white;
        }

        .filter-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: flex-end;
        }

        .filter-group {
          flex: 1;
          min-width: 150px;
        }

        .filter-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .filter-select {
          width: 100%;
          padding: 10px 12px;
          font-size: 0.95rem;
          border: 2px solid var(--border);
          border-radius: var(--radius);
          background: white;
          cursor: pointer;
          transition: var(--transition);
        }

        .filter-select:focus {
          outline: none;
          border-color: var(--primary);
        }

        .price-range-group {
          min-width: 250px;
        }

        .price-slider-container {
          position: relative;
          height: 20px;
          margin-bottom: 8px;
        }

        .price-slider {
          position: absolute;
          width: 100%;
          height: 4px;
          background: transparent;
          pointer-events: none;
          appearance: none;
          -webkit-appearance: none;
        }

        .price-slider::-webkit-slider-runnable-track {
          height: 4px;
          background: var(--border);
          border-radius: 2px;
        }

        .price-slider::-webkit-slider-thumb {
          pointer-events: auto;
          appearance: none;
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          background: var(--primary);
          border-radius: 50%;
          cursor: pointer;
          margin-top: -7px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .price-slider::-moz-range-thumb {
          pointer-events: auto;
          width: 18px;
          height: 18px;
          background: var(--primary);
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .price-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .price-input {
          width: 100%;
          padding: 10px 12px;
          font-size: 0.95rem;
          border: 2px solid var(--border);
          border-radius: var(--radius);
          transition: var(--transition);
        }

        .price-input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .price-separator {
          color: var(--text-secondary);
        }

        .in-stock-btn {
          width: 100%;
          padding: 10px 16px;
          font-size: 0.95rem;
          font-weight: 600;
          border: 2px solid var(--border);
          border-radius: var(--radius);
          background: white;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .in-stock-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .in-stock-btn.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .stock-icon {
          font-size: 1.1rem;
        }

        .clear-filters-btn {
          padding: 12px 20px;
          background: transparent;
          border: 2px solid var(--error);
          color: var(--error);
          border-radius: var(--radius);
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          white-space: nowrap;
        }

        .clear-filters-btn:hover {
          background: var(--error);
          color: white;
        }

        .results-info {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
          padding: 40px 0;
        }

        .inline-card {
          border: 1px solid #eee;
          border-radius: 12px;
          overflow: hidden;
          background: white;
          display: flex;
          flex-direction: column;
          transition: var(--transition);
        }

        .inline-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-hover);
        }

        .card-image {
          position: relative;
        }

        .card-image img {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }

        .placeholder {
          height: 200px;
          background: #f0fdf4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
        }

        .stock-badge-container {
          position: absolute;
          top: 12px;
          right: 12px;
        }

        .stock-badge {
          padding: 4px 10px;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: 20px;
          text-transform: uppercase;
        }

        .stock-badge.in-stock {
          background: #22c55e;
          color: white;
        }

        .stock-badge.out-of-stock {
          background: #ef4444;
          color: white;
        }

        .card-content { 
          padding: 16px; 
          flex-grow: 1; 
          display: flex; 
          flex-direction: column; 
        }

        .card-info-top {
          margin-bottom: 8px;
        }

        .category-tag { 
          font-size: 0.7rem; 
          color: #059669; 
          font-weight: 700; 
          text-transform: uppercase;
        }

        .product-name { 
          margin: 8px 0; 
          font-size: 1.1rem; 
        }

        .price { 
          font-size: 1.2rem; 
          font-weight: 800; 
          color: #111827; 
          margin-bottom: 8px; 
        }

        .unit { 
          font-size: 0.8rem; 
          color: #6b7280; 
          font-weight: 400; 
        }

        .stock-info {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }

        .card-actions { 
          margin-top: auto; 
          display: flex; 
          flex-direction: column; 
          gap: 10px; 
        }

        .details-link {
          text-align: center;
          font-size: 0.9rem;
          color: #6b7280;
          text-decoration: underline;
        }

        .page-header { 
          text-align: center; 
          margin-top: 40px; 
        }

        .no-results {
          text-align: center;
          padding: 64px 16px;
        }

        .no-results-icon {
          font-size: 4rem;
          margin-bottom: 16px;
        }

        .no-results h3 {
          font-size: 1.5rem;
          margin-bottom: 8px;
        }

        .no-results p {
          color: var(--text-secondary);
          margin-bottom: 24px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .filter-controls {
            flex-direction: column;
          }

          .filter-group {
            width: 100%;
          }

          .clear-filters-btn {
            width: 100%;
          }

          .product-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 16px;
          }

          .card-image img,
          .placeholder {
            height: 150px;
          }
        }
      `}</style>
    </div>
  );
}
