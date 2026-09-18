// frontend/app/layout.tsx
import type { Metadata } from 'next';
import Script from 'next/script';
import { GoogleOAuthProvider } from '@react-oauth/google';

// 🚀 Imports
import Navbar from '../components/layout/Navbar'; 
import Footer from '../components/Footer'; 
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'VPS-ESPORTSHUB | Premium Esports Tournaments',
  description: 'Join custom rooms, compete in tournaments, and build your gaming profile.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VPS EsportsHub',
  },
};

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased selection:bg-[#00F0FF] selection:text-black bg-[#07070F]">
        {/* Wrap the app in the Google Auth Provider */}
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy_client_id'}>
          
          {/* 🚀 Navbar stays fixed at the top */}
          <Navbar />

          {/* 🚀 FIX: Changed pt-6 to pt-28 (112px) to push content below the fixed 64px Navbar */}
          <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
            {children}
          </main>

          {/* 🚀 Footer stays at the bottom */}
          <Footer />

        </GoogleOAuthProvider>
        
        {/* Global Toast Notifications */}
        <Toaster 
          position="bottom-center"
          toastOptions={{
            style: { background: '#11141D', color: '#fff', border: '1px solid #374151', borderRadius: '12px' },
            success: { iconTheme: { primary: '#00F0FF', secondary: '#000' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#000' } }
          }} 
        />
        
        {/* Load Razorpay Checkout library asynchronously */}
        <Script 
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}