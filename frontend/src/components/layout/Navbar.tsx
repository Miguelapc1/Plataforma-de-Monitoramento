'use client';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const path = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-[#1e1e2a]">
      <div className="max-w-screen-2xl mx-auto h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d084" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="font-bold text-white text-sm tracking-tight">Sentinel</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/dashboard" className={`px-3 py-1.5 rounded-md text-sm transition-colors ${path === '/dashboard' ? 'text-white bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}>
              Dashboard
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600 font-mono">{user?.username}</span>
          <div className="w-px h-4 bg-[#1e1e2a]" />
          <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
