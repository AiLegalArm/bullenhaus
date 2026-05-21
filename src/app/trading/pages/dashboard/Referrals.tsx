import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Users, GraduationCap, Award, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export const Referrals = () => {
  const { t } = useTranslation('common');
  const [copied, setCopied] = useState(false);
  const refLink = "https://bullenhaus.com/register?ref=PRO42";

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    toast.success(t('linkCopied', { defaultValue: 'Referral link copied to clipboard' }));
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { label: t('totalReferrals', { defaultValue: 'Total Referrals' }), value: '12', icon: Users, color: 'text-blue-400' },
    { label: t('activeStudents', { defaultValue: 'Active Students' }), value: '8', icon: GraduationCap, color: 'text-accent-primary' },
    { label: t('totalRewards', { defaultValue: 'Total Rewards' }), value: '$ 450.00', icon: Award, color: 'text-accent-secondary' },
  ];

  return (
    <div className="p-4 lg:p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">{t('referrals')}</h1>
        <p className="text-slate-400 mb-8">{t('referralsDesc', { defaultValue: 'Invite your friends and earn rewards for every active trade they make.' })}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-8 bg-gradient-to-br from-accent-primary/10 to-transparent">
             <h3 className="text-xl font-bold text-white mb-6">{t('referralLink')}</h3>
             <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                   <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-slate-300 font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                      {refLink}
                   </div>
                   <button 
                    onClick={handleCopy}
                    className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${copied ? 'bg-accent-secondary text-black' : 'bg-accent-primary text-black hover:scale-105'}`}
                   >
                     {copied ? <Check size={18} /> : <Copy size={18} />}
                     {copied ? t('copied') : t('copy')}
                   </button>
                </div>
                <p className="text-xs text-slate-500 italic">{t('shareWithFriends', { defaultValue: 'Share this link with your friends to start earning.' })}</p>
             </div>
          </div>

          <div className="glass-card p-8">
             <h3 className="text-xl font-bold text-white mb-6">{t('howItWorks')}</h3>
             <div className="space-y-6">
                <div className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center font-bold text-black flex-shrink-0">1</div>
                   <div>
                      <p className="font-bold text-white mb-1">{t('shareLink', { defaultValue: 'Share your link' })}</p>
                      <p className="text-sm text-slate-400">{t('shareLinkDesc', { defaultValue: 'Send your unique referral link to friends and colleagues.' })}</p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center font-bold text-black flex-shrink-0">2</div>
                   <div>
                      <p className="font-bold text-white mb-1">{t('theySignUp', { defaultValue: 'They sign up' })}</p>
                      <p className="text-sm text-slate-400">{t('theySignUpDesc', { defaultValue: 'When they register and verify their account, they become your referral.' })}</p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center font-bold text-black flex-shrink-0">3</div>
                   <div>
                      <p className="font-bold text-white mb-1">{t('earnRewards', { defaultValue: 'Earn rewards' })}</p>
                      <p className="text-sm text-slate-400">{t('earnRewardsDesc', { defaultValue: 'Receive 10% commission on every trading fee they generate, forever.' })}</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
