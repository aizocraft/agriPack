import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h3 className="footer-title">AgriPack</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
              Connecting farmers directly to consumers. 
              Fresh produce, fair prices, sustainable agriculture.
            </p>
          </div>

          <div>
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/products">Products</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">For Farmers</h4>
            <ul className="footer-links">
              <li><Link href="/register?role=farmer">Become a Seller</Link></li>
              <li><Link href="/farmer">Farmer Dashboard</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">Contact Us</h4>
            <ul className="footer-links">
              <li>Email: support@agripack.com</li>
              <li>Phone: +254 700 000 000</li>
              <li>Nairobi, Kenya</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} AgriPack. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
