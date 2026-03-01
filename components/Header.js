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
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Check if user is logged in
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }

    // Check saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Handle scroll
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Listen for storage changes
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
    
    // Listen for custom auth change event
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

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

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
            <img src="/icon.png" alt="AgriPack" className="logo-img" />
            <span className="logo-text">AgriPack</span>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>

          {/* Header Actions */}
          <div className="header-actions">
            {/* Theme Toggle */}
            <button 
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              )}
            </button>

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
              {isSearchOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              )}
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
<button onClick={logoutHandler} className="nav-link logout-btn" title="Logout">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                  </button>
                </>
              ) : (
                <Link href="/login" className="nav-link">
                  Login
                </Link>
              )}

              <Link href="/cart" className="cart-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span className="cart-text">Cart</span>
                {cartItemCount > 0 && (
                  <span className="cart-badge">{cartItemCount}</span>
                )}
              </Link>
            </nav>
          </div>
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

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo-img {
          width: 44px;
          height: 44px;
          object-fit: contain;
          border-radius: 10px;
          transition: transform 0.3s ease;
        }

        .logo-img:hover {
          transform: scale(1.08);
        }

        .logo-text {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--primary);
          transition: color 0.3s ease;
        }

        .logo:hover .logo-text {
          color: var(--primary-dark);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: transparent;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .theme-toggle:hover {
          background: var(--border);
          color: var(--primary);
          transform: rotate(15deg);
        }

        /* Desktop Search Bar */
        .search-bar-desktop {
          display: flex;
          flex: 1;
          max-width: 450px;
          margin: 0 20px;
        }

        .search-input-desktop {
          flex: 1;
          padding: 10px 16px;
          border: 2px solid var(--border);
          border-right: none;
          border-radius: var(--radius) 0 0 var(--radius);
          font-size: 0.95rem;
          transition: all 0.3s ease;
          background: var(--surface);
          color: var(--text-primary);
        }

        .search-input-desktop:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
        }

        .search-btn-desktop {
          padding: 10px 16px;
          background: var(--primary);
          border: 2px solid var(--primary);
          border-radius: 0 var(--radius) var(--radius) 0;
          font-size: 1rem;
          transition: all 0.3s ease;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-btn-desktop:hover {
          background: var(--primary-dark);
          transform: translateX(2px);
        }

        /* Mobile Search Button */
        .mobile-search-btn {
          display: none;
          padding: 8px 12px;
          background: transparent;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: var(--text-primary);
          transition: all 0.3s ease;
        }

        .mobile-search-btn:hover {
          color: var(--primary);
        }

        /* Mobile Search Bar */
        .search-bar-mobile {
          padding: 12px 0;
          border-top: 1px solid var(--border);
          margin-top: 12px;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
          transition: all 0.3s ease;
          background: var(--surface);
          color: var(--text-primary);
        }

        .search-input-mobile:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
        }

        .search-btn-mobile {
          padding: 12px 20px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: var(--radius);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .search-btn-mobile:hover {
          background: var(--primary-dark);
          transform: scale(1.02);
        }

        /* Mobile Menu Button */
        .mobile-menu-btn {
          display: none;
          flex-direction: column;
          gap: 4px;
          background: none;
          padding: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .mobile-menu-btn:hover {
          transform: scale(1.1);
        }

        .mobile-menu-btn span {
          display: block;
          width: 24px;
          height: 2px;
          background: var(--text-primary);
          transition: all 0.3s ease;
        }
        
        .mobile-menu-btn.active span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .mobile-menu-btn.active span:nth-child(2) {
          opacity: 0;
        }

        .mobile-menu-btn.active span:nth-child(3) {
          transform: rotate(-45deg) translate(5px, -5px);
        }
        
        @media (max-width: 992px) {
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
            gap: 8px;
            animation: slideDown 0.3s ease;
          }
          
          .nav.open {
            display: flex;
          }

          .header-content {
            flex-wrap: wrap;
          }

          .cart-text {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .logo-img {
            width: 36px;
            height: 36px;
          }

          .logo-text {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </header>
  );
}
