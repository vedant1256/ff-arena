// frontend/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { GoogleOAuthProvider } from '@react-oauth/google';

// 🚀 Imports
import Navbar from '../components/layout/Navbar'; 
import Footer from '../components/Footer'; 
import OfflineIndicator from '../components/OfflineIndicator';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'VPS ESPORTSHUB | Premier Gaming Tournaments',
  description: 'Premier Free Fire Gaming Tournaments and Custom Rooms. Compete, dominate, and earn real rewards.',
};

export const viewport: Viewport = {
  themeColor: '#6366F1',
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
      <body className="bg-brand-bgLight text-brand-textPrimary font-sans antialiased selection:bg-brand-indigo selection:text-white min-h-screen flex flex-col pb-24 sm:pb-16">
        <OfflineIndicator />
        {/* Wrap the app in the Google Auth Provider */}
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy_client_id'}>
          
          {/* Top Header & Bottom Dock */}
          <Navbar />

          <main className="flex-grow w-full">
            {children}
          </main>

          {/* Footer */}
          <Footer />

        </GoogleOAuthProvider>
        
        {/* Global Toast Notifications */}
        <Toaster 
          position="bottom-center"
          toastOptions={{
            style: { 
              background: '#FFFFFF', 
              color: '#0F172A', 
              border: '1px solid #E2E8F0', 
              borderRadius: '16px',
              boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.12)'
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#FFFFFF' } },
            error: { iconTheme: { primary: '#FF4655', secondary: '#FFFFFF' } }
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