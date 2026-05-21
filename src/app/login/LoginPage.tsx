import React from 'react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0b] to-[#121214] flex flex-col items-center justify-center p-4">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#d4af37] blur-[150px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[#0a84ff] blur-[150px] opacity-10 pointer-events-none" />

      {/* Logo */}
      <div className="z-10 flex flex-col items-center mb-12">
        <img 
          src="/logo.png" 
          alt="Bullenhaus" 
          className="w-32 h-32 object-contain mb-6 drop-shadow-2xl"
          onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
        />
        <h1 className="text-4xl font-serif text-white tracking-widest uppercase">Bullenhaus</h1>
        <p className="text-sm text-gray-400 tracking-[0.2em] mt-2">GLOBAL FINANCIAL PLATFORM</p>
      </div>

      {/* Portals */}
      <div className="z-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        
        {/* Trading Portal */}
        <div className="bg-[#1a1a1e] border border-white/5 p-8 rounded-2xl shadow-2xl hover:border-[#d4af37]/50 transition-all group flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4af37]/20 to-transparent flex items-center justify-center mb-6 border border-[#d4af37]/30 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">Trading Terminal</h2>
          <p className="text-gray-400 mb-8 text-sm">Exclusive access for registered clients and elite traders.</p>
          
          <div className="flex flex-col w-full gap-3 mt-auto">
            <a 
              href="/trade/auth/login" 
              className="w-full py-3 bg-[#d4af37] text-black font-bold tracking-widest uppercase text-sm rounded hover:bg-[#c19b2e] transition-colors"
            >
              Sign In
            </a>
            <a 
              href="/trade/auth/register" 
              className="w-full py-3 bg-transparent border border-white/10 text-white font-bold tracking-widest uppercase text-sm rounded hover:bg-white/5 transition-colors"
            >
              Register as Client
            </a>
          </div>
        </div>

        {/* CRM Portal */}
        <div className="bg-[#1a1a1e] border border-white/5 p-8 rounded-2xl shadow-2xl hover:border-[#0a84ff]/50 transition-all group flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0a84ff]/20 to-transparent flex items-center justify-center mb-6 border border-[#0a84ff]/30 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-[#0a84ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">Corporate CRM</h2>
          <p className="text-gray-400 mb-8 text-sm">Internal portal for managers, agents, and administrators.</p>
          
          <div className="flex flex-col w-full gap-3 mt-auto">
            <a 
              href="/crm" 
              className="w-full py-3 bg-[#0a84ff] text-white font-bold tracking-widest uppercase text-sm rounded hover:bg-[#0070e0] transition-colors"
            >
              Employee Login
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
