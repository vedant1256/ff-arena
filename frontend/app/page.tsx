// frontend/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    // If they have a real token, send them to dashboard. Otherwise, send to login.
    if (token && token !== 'demo-bypass-token') {
      router.replace('/dashboard');
    } else {
      // Remove any accidental demo token left over
      localStorage.removeItem('token');
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-brand-indigo">
      <Loader2 size={36} className="animate-spin mb-3 text-brand-indigo" />
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 font-gaming">
        Entering Arena...
      </p>
    </div>
  );
}