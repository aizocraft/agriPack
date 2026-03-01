'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/icon.png" alt="AgriPack" className="footer-logo-img" />
              <span className="footer-logo-text">AgriPack</span>
            </div>
            <p className="footer-description">
              Connecting farmers directly to consumers. 
              Fresh produce, fair prices, sustainable agriculture.
            </p>
            <div className="footer-social">
              <a href="#" className="social-link" aria-label="Facebook">📘</a>
              <a href="#" className="social-link" aria-label="Twitter">🐦</a>
              <a href="#" className="social-link" aria-label="Instagram">📷</a>
              <a href="#" className="social-link" aria-label="WhatsApp">💬</a>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/products">Products</Link></li>
              <li><Link href="/login">Login</Link></li>
              <li><Link href="/register">Register</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">For Farmers</h4>
            <ul className="footer-links">
              <li><Link href="/register?role=farmer">Become a Seller</Link></li>
              <li><Link href="/farmer">Farmer Dashboard</Link></li>
              <li><Link href="/admin">Admin Panel</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Contact Us</h4>
            <ul className="footer-contact">
              <li>
                <span className="contact-icon">📧</span>
                <span>support@agripack.com</span>
              </li>
              <li>
                <span className="contact-icon">📱</span>
                <span>+254 700 000 000</span>
              </li>
              <li>
                <span className="contact-icon">📍</span>
                <span>Nairobi, Kenya</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} AgriPack. All rights reserved.</p>
          <div className="footer-legal">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: var(--text-primary);
          color: white;
          padding: 64px 0 24px;
          margin-top: 64px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          gap: 48px;
          margin-bottom: 48px;
        }

        .footer-brand {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .footer-logo-img {
          width: 48px;
          height: 48px;
          object-fit: contain;
          border-radius: 10px;
        }

        .footer-logo-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary-light, #81c784);
        }

        .footer-description {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.8;
          font-size: 0.95rem;
        }

        .footer-social {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .social-link {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          font-size: 1.2rem;
          transition: all 0.3s ease;
        }

        .social-link:hover {
          background: var(--primary, #2e7d32);
          transform: translateY(-3px);
        }

        .footer-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .footer-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: white;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-links li {
          margin-bottom: 10px;
        }

        .footer-links a {
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.3s ease;
          font-size: 0.95rem;
        }

        .footer-links a:hover {
          color: var(--primary-light, #81c784);
          padding-left: 6px;
        }

        .footer-contact {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-contact li {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
        }

        .contact-icon {
          font-size: 1.1rem;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9rem;
        }

        .footer-legal {
          display: flex;
          gap: 24px;
        }

        .footer-legal a {
          color: rgba(255, 255, 255, 0.5);
          transition: color 0.3s ease;
        }

        .footer-legal a:hover {
          color: white;
        }

        @media (max-width: 992px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 32px;
          }
        }

        @media (max-width: 576px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .footer-bottom {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .footer-logo {
            justify-content: center;
          }

          .footer-social {
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
}
