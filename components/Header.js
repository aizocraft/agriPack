'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const { cartItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }

    // Handle scroll
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Listen for storage changes (for login/logout from other tabs/windows)
    const handleStorageChange = (e) => {
      if (e.key === 'userInfo' || e.key === 'token') {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          setUser(JSON.parse(userInfo));
        } else {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom auth change event (for same-tab login/logout)
    const handleAuthChange = () => {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        setUser(JSON.parse(userInfo));
      } else {
        setUser(null);
      }
    };
    window.addEventListener('authChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const cartItemCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="header-content">
          <Link href="/" className="logo">
            <span className="logo-icon">🌾</span>
            AgriPack
          </Link>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
            <Link href="/" className="nav-link">
              Home
            </Link>
            <Link href="/products" className="nav-link">
              Products
            </Link>
            
            {user ? (
              <>
                {user.isFarmer && (
                  <Link href="/farmer" className="nav-link">
                    Farmer Dashboard
                  </Link>
                )}
                {user.isAdmin && (
                  <Link href="/admin" className="nav-link">
                    Admin Dashboard
                  </Link>
                )}
                <Link href="/profile" className="nav-link">
                  Profile
                </Link>
                <button onClick={logoutHandler} className="nav-link">
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="nav-link">
                Login
              </Link>
            )}

            <Link href="/cart" className="cart-icon">
              <span>🛒</span>
              Cart
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </Link>
          </nav>
        </div>
      </div>

      <style jsx>{`
        .header.scrolled {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .mobile-menu-btn {
          display: none;
          flex-direction: column;
          gap: 4px;
          background: none;
          padding: 8px;
        }
        
        .mobile-menu-btn span {
          display: block;
          width: 24px;
          height: 2px;
          background: var(--text-primary);
          transition: var(--transition);
        }
        
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex;
          }
          
          .nav {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--surface);
            flex-direction: column;
            padding: 16px;
            box-shadow: var(--shadow);
          }
          
          .nav.open {
            display: flex;
          }
        }
      `}</style>
    </header>
  );
}
