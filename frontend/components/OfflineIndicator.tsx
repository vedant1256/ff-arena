'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial status
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    // Listeners for network changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // If online, don't show anything
  if (isOnline) return null;

  // If offline, lock the screen with this message
  return (
    <div className="fixed inset-0 z-[10000] bg-[#050505]/95 backdrop-blur-md flex flex-col items-center justify-center text-white text-center px-4">
      <div className="bg-red-500/20 p-6 rounded-full mb-6">
        <WifiOff size={56} className="text-red-500 animate-pulse" />
      </div>
      <h2 className="text-3xl font-black font-gaming tracking-wider mb-3 text-red-500">
        CONNECTION LOST
      </h2>
      <p className="text-gray-400 max-w-sm">
        Please check your internet connection. You need an active connection to join tournaments and view room coordinates.
      </p>
    </div>
  );
}
