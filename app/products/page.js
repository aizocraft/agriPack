'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AddToCartButton from '@/components/AddToCartButton';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      } else {
        setError(data.message || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Could not connect to the server');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container"><div className="spinner"></div></div>;

  return (
    <div className="container">
      <header className="page-header">
        <h1>Fresh Produce</h1>
        <p>Direct from farmers to your kitchen.</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="product-grid">
        {products.map((product) => (
          <div key={product._id} className="inline-card">
            <Link href={`/products/${product._id}`} className="card-link">
              <div className="card-image">
                {product.image ? (
                  <img src={product.image} alt={product.name} />
                ) : (
                  <div className="placeholder">🥬</div>
                )}
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
              
              <div className="card-actions">
                {/* Adding your AddToCartButton here */}
                <AddToCartButton product={product} />
                
                <Link href={`/products/${product._id}`} className="details-link">
                  Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
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
        .card-content { padding: 16px; flex-grow: 1; display: flex; flex-direction: column; }
        .product-name { margin: 8px 0; font-size: 1.1rem; }
        .category-tag { font-size: 0.7rem; color: #059669; font-weight: 700; }
        .price { font-size: 1.2rem; font-weight: 800; color: #111827; margin-bottom: 16px; }
        .unit { font-size: 0.8rem; color: #6b7280; font-weight: 400; }
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
        .page-header { text-align: center; margin-top: 40px; }
      `}</style>
    </div>
  );
}