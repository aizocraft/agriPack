import './globals.css';
import { CartProvider } from '@/context/CartContext';

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
            {children}
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
