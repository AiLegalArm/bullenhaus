import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Mail, Phone, Book, HelpCircle, Send, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Support = () => {
  const { t } = useTranslation('common');
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    { q: t('faqDepositQ', { defaultValue: 'How do I deposit funds?' }), a: t('faqDepositA', { defaultValue: 'You can deposit funds by navigating to Portfolio and clicking the Deposit button.' }) },
    { q: t('faqHoursQ', { defaultValue: 'What are the trading hours?' }), a: t('faqHoursA', { defaultValue: 'Crypto markets are open 24/7. Forex and Metals follow global market hours (Mon-Fri).' }) },
    { q: t('faqLiqQ', { defaultValue: 'How is the liquidation price calculated?' }), a: t('faqLiqA', { defaultValue: 'Liquidation is based on your margin ratio and the mark price of the asset.' }) },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="p-4 lg:p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">{t('help')}</h1>
        <p className="text-slate-400 mb-8">{t('helpDesc', { defaultValue: 'Need help? Our tech support is available 24/7.' })}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* FAQ Section */}
           <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6">
                 <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <HelpCircle size={20} className="text-accent-primary" />
                    {t('faq')}
                 </h2>
                 <div className="space-y-4">
                    {faqs.map((faq, i) => (
                       <details key={i} className="group bg-white/5 rounded-xl border border-white/5 open:border-accent-primary/20 transition-all">
                          <summary className="p-4 font-bold text-white cursor-pointer list-none flex items-center justify-between">
                             {faq.q}
                             <span className="group-open:rotate-180 transition-transform">▼</span>
                          </summary>
                          <div className="px-4 pb-4 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                             {faq.a}
                          </div>
                       </details>
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="glass-card p-6 flex items-center gap-4 hover:bg-white/[0.02] cursor-pointer transition-all">
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                       <Book size={24} />
                    </div>
                    <div>
                       <p className="font-bold text-white">{t('documentation')}</p>
                       <p className="text-xs text-slate-500">{t('readGuides', { defaultValue: 'Read our detailed guides' })}</p>
                    </div>
                 </div>
                 <div className="glass-card p-6 flex items-center gap-4 hover:bg-white/[0.02] cursor-pointer transition-all">
                    <div className="p-3 bg-accent-secondary/10 text-accent-secondary rounded-xl">
                       <MessageSquare size={24} />
                    </div>
                    <div>
                       <p className="font-bold text-white">{t('liveChat')}</p>
                       <p className="text-xs text-slate-500">{t('speakAgent', { defaultValue: 'Speak with an agent' })}</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Contact Form */}
           <div className="glass-card p-8 h-fit sticky top-8">
              <h2 className="text-xl font-bold text-white mb-6">{t('contactSupport')}</h2>
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-accent-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-accent-secondary">
                       <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{t('messageSent')}</h3>
                    <p className="text-sm text-slate-400 mb-6">{t('messageSentDesc', { defaultValue: 'Thank you for reaching out. We will get back to you shortly.' })}</p>
                    <button 
                      onClick={() => setSubmitted(false)}
                      className="text-accent-primary font-bold text-sm hover:underline"
                    >
                      {t('sendAnother', { defaultValue: 'Send another message' })}
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{t('category')}</label>
                       <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none appearance-none">
                          <option>{t('accountIssue', { defaultValue: 'Account Issue' })}</option>
                          <option>{t('tradingProblem', { defaultValue: 'Trading Problem' })}</option>
                          <option>{t('paymentWithdrawal', { defaultValue: 'Payment / Withdrawal' })}</option>
                          <option>{t('feedback', { defaultValue: 'Feedback' })}</option>
                          <option>{t('other', { defaultValue: 'Other' })}</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{t('message')}</label>
                       <textarea 
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none min-h-[150px] resize-none"
                        placeholder={t('describeIssue', { defaultValue: 'Describe your issue...' })}
                       />
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-4 bg-accent-primary hover:bg-accent-primary/90 text-black font-bold rounded-xl shadow-neon-gold transition-all flex items-center justify-center gap-2"
                    >
                      <Send size={18} />
                      {t('sendRequest')}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
           </div>
        </div>
      </div>
    </div>
  );
};
