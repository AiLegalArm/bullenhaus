import React from 'react';
import { motion } from 'motion/react';
import { Users2, Rocket, Settings2, Headset } from 'lucide-react';

const banners = [
  { icon: Users2, title: 'Refer & Earn', subtitle: 'Invite elites and earn up to 40% Commission', color: 'from-accent-primary' },
  { icon: Rocket, title: 'Elite Level Up', subtitle: 'Increase your rank and unlock exclusive vaults', color: 'from-accent-tertiary' },
  { icon: Settings2, title: 'Institutional Tools', subtitle: 'Access premium charts, signals and algorithms', color: 'from-slate-500' },
  { icon: Headset, title: 'Concierge', subtitle: 'Priority 24/7 support for our elite members', color: 'from-[#444]' },
];

export const UniverseBanners = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
      {banners.map((banner, i) => (
        <motion.div
           key={banner.title}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: i * 0.1 + 0.5 }}
           className={`glass-card p-6 glass-card-hover cursor-pointer group relative overflow-hidden`}
        >
          <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${banner.color} to-transparent opacity-50`} />
          <div className="flex items-center gap-4 relative z-10">
             <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10 group-hover:bg-white/10 transition-all">
                <banner.icon size={24} className="text-white" />
             </div>
             <div>
                <h4 className="text-sm font-bold text-white mb-1">{banner.title}</h4>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{banner.subtitle}</p>
             </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
        </motion.div>
      ))}
    </div>
  );
};
