'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AddToCartButton from '@/components/AddToCartButton';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/products?limit=8', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      } else {
        setError('Failed to load products. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Unable to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">Fresh From Farm to Table</h1>
          <p className="hero-subtitle">
            Connect directly with local farmers and get fresh, quality produce at fair prices
          </p>
          <div className="hero-buttons">
            <Link href="/products" className="btn btn-secondary btn-large">
              Shop Now
            </Link>
            <Link href="/register?role=farmer" className="btn btn-outline btn-large" style={{ borderColor: 'white', color: 'white' }}>
              Become a Seller
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🌱</div>
              <h3>Fresh Produce</h3>
              <p>Directly from farms to your table</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Fair Prices</h3>
              <p>No middlemen, better rates</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚚</div>
              <h3>Fast Delivery</h3>
              <p>Fresh delivery to your door</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>Quality Assured</h3>
              <p>Verified farmers and products</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="section featured-products-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Products</h2>
            <p className="section-subtitle">Fresh from the farm to your table</p>
          </div>
          
          {loading ? (
            <div className="featured-products-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="featured-product-card skeleton">
                  <div className="product-image-wrapper">
                    <div className="product-image-placeholder skeleton-image"></div>
                  </div>
                  <div className="product-card-body">
                    <div className="skeleton-text skeleton-title"></div>
                    <div className="skeleton-text skeleton-price"></div>
                    <div className="skeleton-text skeleton-stock"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h3 className="error-title">Oops! Something went wrong</h3>
              <p className="error-text">{error}</p>
              <button className="btn btn-primary" onClick={fetchProducts}>
                Try Again
              </button>
            </div>
          ) : products.length > 0 ? (
            <div className="featured-products-grid">
              {products.map((product, index) => (
                <Link href={`/products/${product._id}`} key={product._id} className="featured-product-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="product-image-wrapper">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="product-image" />
                    ) : (
                      <div className="product-image-placeholder">
                        🥬
                      </div>
                    )}
                    <div className="product-overlay">
                      <span className="view-details-btn">View Details</span>
                    </div>
                    {product.category && (
                      <span className="product-category-badge">{product.category}</span>
                    )}
                    {/* Stock Badge */}
                    <span className={`product-stock-badge ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                      {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  <div className="product-card-body">
                    <h3 className="product-title">{product.name}</h3>
                    <div className="product-price-row">
                      <span className="product-price">KSh {product.price}</span>
                      <span className="product-unit">/ {product.unit}</span>
                    </div>
                    <div className="product-stock-info">
                      {product.stock > 0 ? (
                        <>
                          <span className="stock-indicator in-stock">
                            <span className="stock-dot"></span>
                            Available
                          </span>
                          <span className="stock-count">{product.stock} {product.unit}s</span>
                        </>
                      ) : (
                        <span className="stock-indicator out-of-stock">
                          <span className="stock-dot"></span>
                          Unavailable
                        </span>
                      )}
                    </div>
                    {product.stock > 0 && (
                      <div className="product-action" onClick={(e) => e.preventDefault()}>
                        <AddToCartButton product={product} />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3 className="empty-state-title">No Products Available</h3>
              <p className="empty-state-text">Check back soon for fresh produce from our farmers</p>
              <Link href="/products" className="btn btn-primary">
                View All Products
              </Link>
            </div>
          )}

          {products.length > 0 && (
            <div className="view-all-container">
              <Link href="/products" className="btn btn-outline btn-large">
                View All Products
                <span className="btn-arrow">→</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container">
          <div className="cta-section">
            <h2>Are You a Farmer?</h2>
            <p>Join our platform and sell your produce directly to customers</p>
            <Link href="/register?role=farmer" className="btn btn-primary btn-large">
              Start Selling Today
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          text-align: center;
        }

        .feature-card {
          padding: 24px;
          background: white;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          transition: var(--transition);
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-hover);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .feature-card h3 {
          margin-bottom: 8px;
          font-size: 1.125rem;
        }

        .feature-card p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        /* Featured Products Section */
        .featured-products-section {
          background: linear-gradient(180deg, #f5f5f5 0%, #ffffff 100%);
        }

        .section-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .section-header .section-title {
          font-size: 2.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .section-subtitle {
          font-size: 1.1rem;
          color: var(--text-secondary);
        }

        .featured-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 28px;
          padding: 20px 0;
        }

        .featured-product-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          animation: fadeInUp 0.5s ease both;
        }

        .featured-product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
        }

        .featured-product-card:hover .product-overlay {
          opacity: 1;
        }

        .product-image-wrapper {
          position: relative;
          overflow: hidden;
        }

        .product-image {
          width: 100%;
          height: 220px;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .featured-product-card:hover .product-image {
          transform: scale(1.05);
        }

        .product-image-placeholder {
          width: 100%;
          height: 220px;
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
        }

        .product-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .view-details-btn {
          padding: 12px 24px;
          background: white;
          color: var(--primary);
          border-radius: 25px;
          font-weight: 600;
          font-size: 0.9rem;
          transform: translateY(10px);
          transition: transform 0.3s ease;
        }

        .featured-product-card:hover .view-details-btn {
          transform: translateY(0);
        }

        .product-category-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.95);
          color: var(--primary);
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .product-stock-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .product-stock-badge.in-stock {
          background: #22c55e;
          color: white;
        }

        .product-stock-badge.out-of-stock {
          background: #ef4444;
          color: white;
        }

        .product-card-body {
          padding: 20px;
        }

        .product-title {
          font-size: 1.15rem;
          font-weight: 600;
          margin-bottom: 10px;
          color: var(--text-primary);
          line-height: 1.4;
        }

        .product-price-row {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 12px;
        }

        .product-price {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--primary);
        }

        .product-unit {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .product-stock-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }

        .stock-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .stock-indicator.in-stock {
          color: #22c55e;
        }

        .stock-indicator.out-of-stock {
          color: #ef4444;
        }

        .stock-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .stock-count {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .product-action {
          margin-top: auto;
        }

        .view-all-container {
          text-align: center;
          margin-top: 40px;
        }

        .btn-arrow {
          margin-left: 8px;
          transition: transform 0.3s ease;
          display: inline-block;
        }

        .btn-outline:hover .btn-arrow {
          transform: translateX(4px);
        }

        .cta-section {
          text-align: center;
          padding: 64px 32px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          border-radius: var(--radius);
          color: white;
        }

        .cta-section h2 {
          font-size: 2rem;
          margin-bottom: 16px;
        }

        .cta-section p {
          font-size: 1.125rem;
          opacity: 0.9;
          margin-bottom: 32px;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .cta-section {
            padding: 32px 16px;
          }

          .cta-section h2 {
            font-size: 1.5rem;
          }

          .featured-products-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .section-header .section-title {
            font-size: 1.75rem;
          }

          .product-image,
          .product-image-placeholder {
            height: 160px;
          }

          .product-card-body {
            padding: 14px;
          }

          .product-title {
            font-size: 1rem;
          }

          .product-price {
            font-size: 1.2rem;
          }
        }

        @media (max-width: 480px) {
          .featured-products-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
