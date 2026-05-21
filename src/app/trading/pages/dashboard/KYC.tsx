import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, ShieldCheck, FileText, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { crmService } from '../../services/crmService';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

export const KYC = () => {
  const { t } = useTranslation('common');
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'VERIFIED'>('IDLE');
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    passport: null,
    id_card: null,
    selfie: null
  });

  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleFile = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFiles(prev => ({ ...prev, [key]: e.target.files![0] }));
    }
  };

  const handleSubmit = async () => {
    if (!files.passport && !files.id_card && !files.selfie) {
      toast.error('Upload at least one KYC document');
      return;
    }
    setSubmitting(true);

    if (user) {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session?.access_token) throw new Error('Session expired. Please login again.');
        const toPayload = async (type: string, file: File | null) => {
          if (!file) return null;
          const data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          return { type, fileName: file.name, contentType: file.type || 'application/octet-stream', data };
        };
        const documents = (await Promise.all([
          toPayload('passport', files.passport),
          toPayload('id_card', files.id_card),
          toPayload('selfie', files.selfie),
        ])).filter(Boolean);

        const response = await fetch('/api/kyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ action: 'submit', documents }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'KYC upload failed');
        await refreshProfile();

        await crmService.kycUpdate({
          external_trader_id: user.id,
          status: 'pending',
          level: 'tier_2',
          documents,
          reviewed_at: new Date().toISOString()
        }, session.access_token).catch(() => null);
        setStatus('PENDING');
        toast.success('KYC submitted for admin review');
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : 'KYC submission failed');
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (status === 'PENDING') {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-12 text-center max-w-lg">
          <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500 animate-pulse">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">{t('kycUnderReview')}</h2>
          <p className="text-slate-400 mb-8">{t('kycUnderReviewDesc')}</p>
          <button 
            onClick={() => setStatus('IDLE')}
            className="text-accent-primary hover:underline font-bold"
          >
            {t('goBack')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
           <div className="p-3 bg-accent-primary/10 rounded-2xl text-accent-primary shadow-neon-gold/20">
              <ShieldCheck size={32} />
           </div>
           <div>
              <h1 className="text-3xl font-bold text-white">{t('kyc')}</h1>
              <p className="text-slate-400">{t('kycDesc')}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="glass-card p-6 border-white/5">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <FileText className="text-accent-primary" />
                   <h3 className="font-bold text-white">1. {t('idDocument')}</h3>
                </div>
                {files.passport || files.id_card ? <CheckCircle2 className="text-accent-secondary" /> : null}
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/10 rounded-2xl p-6 cursor-pointer hover:border-accent-primary/50 transition-all bg-white/5">
                   <Upload size={24} className="text-slate-500" />
                   <span className="text-xs font-bold text-slate-400">{t('passport')}</span>
                   <input type="file" className="hidden" onChange={(e) => handleFile('passport', e)} />
                   {files.passport && <span className="text-[10px] text-accent-secondary">{files.passport.name}</span>}
                </label>
                <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/10 rounded-2xl p-6 cursor-pointer hover:border-accent-primary/50 transition-all bg-white/5">
                   <Upload size={24} className="text-slate-500" />
                   <span className="text-xs font-bold text-slate-400">{t('idCard')}</span>
                   <input type="file" className="hidden" onChange={(e) => handleFile('id_card', e)} />
                   {files.id_card && <span className="text-[10px] text-accent-secondary">{files.id_card.name}</span>}
                </label>
             </div>
          </div>

          <div className="glass-card p-6 border-white/5">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <Camera className="text-accent-primary" />
                   <h3 className="font-bold text-white">2. {t('selfieVerification')}</h3>
                </div>
                {files.selfie ? <CheckCircle2 className="text-accent-secondary" /> : null}
             </div>
             
             <label className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-white/10 rounded-2xl p-8 cursor-pointer hover:border-accent-primary/50 transition-all bg-white/5">
                <div className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                   <Camera size={32} />
                </div>
                <div className="text-center">
                   <p className="text-sm font-bold text-white mb-1">{t('takeSelfie')}</p>
                   <p className="text-[10px] text-slate-500">{t('selfieDesc')}</p>
                </div>
                <input type="file" className="hidden" onChange={(e) => handleFile('selfie', e)} />
                {files.selfie && <span className="text-[10px] text-accent-secondary">{files.selfie.name}</span>}
             </label>
          </div>
        </div>

        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 flex gap-4 mb-8">
           <AlertCircle className="text-yellow-500 flex-shrink-0" />
           <div className="text-sm text-yellow-500/80">
              <p className="font-bold text-yellow-500 mb-1">{t('importantNote')}</p>
              <p>{t('kycNote')}</p>
           </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 bg-accent-primary hover:bg-accent-primary/90 text-black font-bold rounded-2xl shadow-neon-gold transition-all hover:scale-[1.01] active:scale-95"
        >
          {submitting ? 'Uploading...' : t('submitVerification')}
        </button>
      </div>
    </div>
  );
};
