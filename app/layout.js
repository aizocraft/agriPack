import './globals.css';
import { CartProvider } from '@/context/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'AgriPack - Fresh Farm Products',
  description: 'Buy fresh farm products directly from farmers. Quality assured produce with fair prices.',
  keywords: 'farm, fresh produce, agriculture, organic, vegetables, fruits',
  openGraph: {
    title: 'AgriPack - Fresh Farm Products',
    description: 'Buy fresh farm products directly from farmers',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <div className="app">
            <Header />
            <main>{children}</main>
            <Footer />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
