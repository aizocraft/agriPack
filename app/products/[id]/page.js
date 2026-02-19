'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AddToCartButton from '@/components/AddToCartButton';

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id);
    }
  }, [params.id]);

  const fetchProduct = async (id) => {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-state-icon">😕</div>
          <h3 className="empty-state-title">Product Not Found</h3>
          <p className="empty-state-text">The product you're looking for doesn't exist or has been removed</p>
          <Link href="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
        <style jsx>{`
          .empty-state {
            padding: 64px 16px;
            text-align: center;
          }
        `}</style>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-state-icon">😕</div>
          <h3 className="empty-state-title">Product Not Found</h3>
          <p className="empty-state-text">The product you're looking for doesn't exist or has been removed</p>
          <Link href="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
        <style jsx>{`
          .empty-state {
            padding: 64px 16px;
            text-align: center;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-separator">›</span>
        <Link href="/products">Products</Link>
        <span className="breadcrumb-separator">›</span>
        <span>{product.name}</span>
      </nav>

      <div className="product-detail">
        {/* Product Image */}
        <div className="product-image">
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name}
              style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', borderRadius: 'var(--radius)' }}
            />
          ) : (
            <div style={{ 
              width: '100%', 
              height: '400px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: '#f5f5f5', 
              borderRadius: 'var(--radius)',
              fontSize: '6rem' 
            }}>
              🥬
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-info">
          <span className="badge badge-outline" style={{ marginBottom: '12px' }}>
            {product.category}
          </span>
          
          <h1 className="product-title">{product.name}</h1>
          
          {product.ratings > 0 && (
            <div className="product-rating">
              <div className="rating">
                {'★'.repeat(Math.round(product.ratings))}
                {'☆'.repeat(5 - Math.round(product.ratings))}
              </div>
              <span className="rating-count">({product.numReviews} reviews)</span>
            </div>
          )}

          <div className="product-price">
            <span className="price-amount">KSh {product.price}</span>
            <span className="price-unit">per {product.unit}</span>
          </div>

          <p className="product-description">{product.description}</p>

          <div className="product-stock">
            {product.stock > 0 ? (
              <>
                <span className="stock-status in-stock">✓ In Stock</span>
                <span className="stock-count">({product.stock} {product.unit} available)</span>
              </>
            ) : (
              <span className="stock-status out-of-stock">✗ Out of Stock</span>
            )}
          </div>

          {product.farmer && (
            <div className="product-farmer">
              <h4>Sold by:</h4>
              <p>{product.farmer.name}</p>
              {product.farmer.phone && (
                <p className="farmer-contact">{product.farmer.phone}</p>
              )}
            </div>
          )}

          {product.stock > 0 && (
            <AddToCartButton product={product} />
          )}

          <div className="product-meta">
            <p><strong>Category:</strong> {product.category}</p>
            <p><strong>Listed:</strong> {new Date(product.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .product-detail {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          padding: 32px 0;
        }

        .product-title {
          font-size: 2rem;
          margin-bottom: 12px;
        }

        .product-rating {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .rating-count {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .product-price {
          margin-bottom: 24px;
        }

        .price-amount {
          font-size: 2rem;
          font-weight: 700;
          color: var(--primary);
        }

        .price-unit {
          color: var(--text-secondary);
          margin-left: 8px;
        }

        .product-description {
          color: var(--text-secondary);
          line-height: 1.8;
          margin-bottom: 24px;
        }

        .product-stock {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .stock-status {
          font-weight: 600;
        }

        .stock-status.in-stock {
          color: var(--success);
        }

        .stock-status.out-of-stock {
          color: var(--error);
        }

        .stock-count {
          color: var(--text-secondary);
        }

        .product-farmer {
          background: #f5f5f5;
          padding: 16px;
          border-radius: var(--radius);
          margin-bottom: 24px;
        }

        .product-farmer h4 {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }

        .farmer-contact {
          color: var(--primary);
          font-weight: 500;
        }

        .product-meta {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }

        .product-meta p {
          margin-bottom: 8px;
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .product-detail {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .product-title {
            font-size: 1.5rem;
          }

          .price-amount {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
