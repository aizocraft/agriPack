'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AddToCartButton from '@/components/AddToCartButton';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=8');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
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
      <section className="section" style={{ background: '#f5f5f5' }}>
        <div className="container">
          <h2 className="section-title">Featured Products</h2>
          
          {products.length > 0 ? (
            <div className="product-grid">
              {products.map((product) => (
                <Link href={`/products/${product._id}`} key={product._id} className="card">
                  <div className="card-image">
                    {product.image ? (
                      <img src={product.image} alt={product.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0e0e0', fontSize: '3rem' }}>
                        🥬
                      </div>
                    )}
                  </div>
                  <div className="card-body">
                    <h3 className="card-title">{product.name}</h3>
                    <p className="card-text">{product.category}</p>
                    <div className="card-footer">
                      <span className="card-price">KSh {product.price}</span>
                      <span className="card-unit">/ {product.unit}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      {product.stock > 0 ? (
                        <span className="badge badge-primary">In Stock</span>
                      ) : (
                        <span className="badge badge-secondary">Out of Stock</span>
                      )}
                    </div>
                    {product.stock > 0 && (
                      <div style={{ marginTop: '12px' }} onClick={(e) => e.preventDefault()}>
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
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <Link href="/products" className="btn btn-outline">
                View All Products
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

        .card-footer {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 12px;
        }

        .card-unit {
          color: var(--text-secondary);
          font-size: 0.875rem;
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
        }
      `}</style>
    </>
  );
}
