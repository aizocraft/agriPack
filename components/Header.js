'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const { cartItems } = useCart();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="header-content">
          <Link href="/" className="logo">
            <span className="logo-icon">🌾</span>
            AgriPack
          </Link>

          {/* Search Bar - Desktop */}
          <form className="search-bar-desktop" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-desktop"
            />
            <button type="submit" className="search-btn-desktop">
              🔍
            </button>
          </form>

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

          {/* Mobile Search Button */}
          <button 
            className="mobile-search-btn"
            onClick={toggleSearch}
            aria-label="Toggle search"
          >
            {isSearchOpen ? '✕' : '🔍'}
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

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="search-bar-mobile">
            <form onSubmit={handleSearch} className="search-form-mobile">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-mobile"
                autoFocus
              />
              <button type="submit" className="search-btn-mobile">
                Search
              </button>
            </form>
          </div>
        )}
      </div>

      <style jsx>{`
        .header.scrolled {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        /* Desktop Search Bar */
        .search-bar-desktop {
          display: flex;
          flex: 1;
          max-width: 400px;
          margin: 0 20px;
        }

        .search-input-desktop {
          flex: 1;
          padding: 10px 16px;
          border: 2px solid var(--border);
          border-right: none;
          border-radius: var(--radius) 0 0 var(--radius);
          font-size: 0.95rem;
          transition: var(--transition);
        }

        .search-input-desktop:focus {
          outline: none;
          border-color: var(--primary);
        }

        .search-btn-desktop {
          padding: 10px 16px;
          background: var(--primary);
          border: 2px solid var(--primary);
          border-radius: 0 var(--radius) var(--radius) 0;
          font-size: 1rem;
          transition: var(--transition);
        }

        .search-btn-desktop:hover {
          background: var(--primary-dark);
        }

        /* Mobile Search Button */
        .mobile-search-btn {
          display: none;
          padding: 8px 12px;
          background: transparent;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
        }

        /* Mobile Search Bar */
        .search-bar-mobile {
          padding: 12px 0;
          border-top: 1px solid var(--border);
          margin-top: 12px;
        }

        .search-form-mobile {
          display: flex;
          gap: 8px;
        }

        .search-input-mobile {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid var(--border);
          border-radius: var(--radius);
          font-size: 1rem;
          transition: var(--transition);
        }

        .search-input-mobile:focus {
          outline: none;
          border-color: var(--primary);
        }

        .search-btn-mobile {
          padding: 12px 20px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: var(--radius);
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }

        .search-btn-mobile:hover {
          background: var(--primary-dark);
        }

        /* Mobile Menu Button */
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

          .mobile-search-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .search-bar-desktop {
            display: none;
          }

          .search-bar-mobile {
            display: block;
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

          .header-content {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </header>
  );
}
