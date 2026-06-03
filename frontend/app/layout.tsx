// frontend/app/layout.tsx
import type { Metadata } from 'next';
import Script from 'next/script';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './globals.css';

export const metadata: Metadata = {
  title: 'FF-ARENA | Premium Esports Tournaments',
  description: 'Join custom rooms, compete in tournaments, and build your gaming profile.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased selection:bg-[#00F0FF] selection:text-black">
        {/* Wrap the app in the Google Auth Provider */}
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy_client_id'}>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
            {children}
          </main>
        </GoogleOAuthProvider>
        
        {/* Load Razorpay Checkout library asynchronously */}
        <Script 
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}