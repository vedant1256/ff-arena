// frontend/app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  // Instantly redirect users hitting the root URL to the login page
  redirect('/login');
}