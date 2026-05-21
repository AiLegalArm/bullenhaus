import React from 'react';
import { motion } from 'motion/react';
import { DashboardStats } from './DashboardStats';
import { GamificationWidget } from './GamificationWidget';
import { TradingChart } from './TradingChart';
import { AdvancedOrderPanel } from './AdvancedOrderPanel';
import { Watchlist, MarketMovers, RecentActivity } from './SecondaryWidgets';
import { UniverseBanners } from './UniverseBanners';
import { useTranslation } from 'react-i18next';

import { TradingProvider } from '../../contexts/TradingContext';
import { PositionsAndOrdersPanel } from './PositionsAndOrdersPanel';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      duration: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
};

export const Dashboard = () => {
  return (
    <TradingProvider>
      <DashboardContent />
    </TradingProvider>
  );
};

const DashboardContent = () => {
  const { t } = useTranslation('common');

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[1700px] mx-auto space-y-6 overflow-x-hidden"
    >
      {/* Top Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-none mb-2"
          >
            BULLENHAUS Terminal
          </motion.h1>
          <p className="text-slate-400 font-medium tracking-wide">{t('dashboardDesc', { defaultValue: 'Elite trading intelligence for masters of the market.' })}</p>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-surface-bg bg-slate-800 overflow-hidden ring-1 ring-accent-primary/30">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} alt="user" />
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-surface-bg bg-gradient-to-br from-accent-primary to-yellow-600 flex items-center justify-center text-[10px] font-bold text-black shadow-neon-gold leading-none">
              +128
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">{t('liveAnalysts', { defaultValue: 'Live Analysts' })}</span>
        </div>
      </motion.div>

      {/* Row 1: Global Stats */}
      <motion.div variants={itemVariants}>
        <DashboardStats />
      </motion.div>

      {/* Row 2: Main Grid */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Section (Main Terminal) */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          {/* Detailed Market Chart Card */}
          <motion.div variants={itemVariants} className="glass-card p-6 holo-border">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-accent-secondary animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Market</span>
            </div>
            
            <div className="relative h-[520px] chart-grid rounded-2xl overflow-hidden border border-white/5">
               <TradingChart />
               
               {/* Chart Overlays */}
               <div className="hidden md:flex absolute top-4 left-4 gap-2">
                  <div className="px-3 py-1 bg-surface-bg/80 backdrop-blur border border-white/10 rounded-lg text-[10px] font-bold flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" /> Indicators
                  </div>
                  <div className="px-3 py-1 bg-surface-bg/80 backdrop-blur border border-white/10 rounded-lg text-[10px] font-bold">
                     Overlay: 1.2505
                  </div>
               </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <motion.div variants={itemVariants} className="md:col-span-12 xl:col-span-7 flex flex-col h-full">
              <PositionsAndOrdersPanel />
            </motion.div>

            {/* Advanced Order Section */}
            <motion.div variants={itemVariants} className="md:col-span-12 xl:col-span-5 flex flex-col h-full min-h-[600px]">
               <AdvancedOrderPanel />
            </motion.div>
          </div>
        </div>

        {/* Right Sidebar Section */}
        <div className="col-span-12 lg:col-span-3 space-y-6 lg:sticky lg:top-8 overflow-y-auto custom-scrollbar max-h-[calc(100vh-6rem)] pb-20">
          <motion.div variants={itemVariants}><GamificationWidget /></motion.div>
          <motion.div variants={itemVariants}><Watchlist /></motion.div>
          <motion.div variants={itemVariants}><MarketMovers /></motion.div>
          <motion.div variants={itemVariants}><RecentActivity /></motion.div>
        </div>
      </div>

      {/* Bottom Banners Section */}
      <motion.div variants={itemVariants}>
        <UniverseBanners />
      </motion.div>
    </motion.div>
  );
};

