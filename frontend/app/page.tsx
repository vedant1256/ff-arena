// frontend/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center text-[#00F0FF]">
      <Loader2 size={40} className="animate-spin mb-4" />
      <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Verifying Access...</p>
    </div>
  );
}