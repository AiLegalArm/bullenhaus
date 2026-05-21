import React, { useEffect, useState } from "react";
import { Database, Download, Upload, RefreshCw, AlertCircle, CheckCircle2, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { apiFetch } from "../lib/auth";
import { useI18n } from "../lib/i18n";

type ModuleName = "clients" | "leads" | "users";
type FileFormat = "csv" | "xlsx";
type DuplicateRule = "skip" | "update";

type ImportResult = {
  summary: { total: number; created: number; updated: number; skipped: number; failed: number };
  errors: Array<{ row: number; email?: string; reason: string }>;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-aura-platinum/40 mb-2">{children}</label>;
}

export function DataManagement() {
  const { t } = useI18n();
  const [moduleName, setModuleName] = useState<ModuleName>("clients");
  const [format, setFormat] = useState<FileFormat>("csv");
  const [duplicateRule, setDuplicateRule] = useState<DuplicateRule>("skip");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<"import" | "export" | "audit" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [audit, setAudit] = useState<any[]>([]);

  async function loadAudit() {
    setLoading("audit");
    try {
      const res = await apiFetch(`/api/v1/data-management/audit?module=${moduleName}&limit=20`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Failed to load audit log");
      setAudit(body.data || []);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to load audit log" });
    } finally {
      setLoading(null);
    }
  }

  useEffect(() => {
    loadAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleName]);

  async function exportData() {
    setLoading("export");
    setMessage(null);
    try {
      const res = await apiFetch(`/api/v1/data-management/export/${moduleName}?format=${format}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `aura-${moduleName}-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage({ type: "success", text: `${moduleName} ${format.toUpperCase()} export generated.` });
      await loadAudit();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Export failed" });
    } finally {
      setLoading(null);
    }
  }

  async function importData(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setMessage({ type: "error", text: "Choose a CSV or XLSX file first." });
      return;
    }

    setLoading("import");
    setMessage(null);
    setResult(null);
    try {
      const fileBase64 = await fileToBase64(file);
      const res = await apiFetch("/api/v1/data-management/import", {
        method: "POST",
        body: JSON.stringify({
          module: moduleName,
          format,
          duplicateRule,
          fileName: file.name,
          fileBase64,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Import failed");
      setResult(body);
      setMessage({ type: "success", text: `Import finished: ${body.summary.created} created, ${body.summary.updated} updated, ${body.summary.skipped} skipped, ${body.summary.failed} failed.` });
      await loadAudit();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Import failed" });
    } finally {
      setLoading(null);
    }
  }

  const modules: Array<{ value: ModuleName; label: string; description: string }> = [
    { value: "clients", label: t("clients"), description: t("vipSubtitle") },
    { value: "leads", label: t("leads"), description: "Lead pipeline records and assigned agents" },
    { value: "users", label: t("users"), description: "CRM users and roles. Admin only." },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-glass-border pb-5">
        <div>
          <h2 className="font-serif text-2xl font-light italic tracking-tight text-aura-platinum">{t('dataTitle')}</h2>
          <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-2 uppercase">{t('dataSubtitle')}</p>
        </div>
        <button
          onClick={loadAudit}
          disabled={loading === "audit"}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded border border-white/10 text-xs uppercase tracking-widest text-aura-platinum/60 hover:text-aura-platinum hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading === "audit" ? "animate-spin" : ""}`} /> {t('refreshAudit')}
        </button>
      </div>

      {message && (
        <div className={`flex items-center gap-3 rounded border px-4 py-3 text-sm ${
          message.type === "success"
            ? "bg-aura-emerald/10 border-aura-emerald/20 text-aura-emerald"
            : "bg-aura-ruby/10 border-aura-ruby/20 text-aura-ruby"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 glass-panel rounded-2xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modules.map(item => (
              <button
                key={item.value}
                onClick={() => setModuleName(item.value)}
                className={`text-left rounded border p-4 transition-colors ${
                  moduleName === item.value
                    ? "border-aura-gold/40 bg-aura-gold/10 text-aura-gold"
                    : "border-white/10 bg-black/20 text-aura-platinum/60 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                  <Database className="w-4 h-4" /> {item.label}
                </div>
                <p className="text-[10px] mt-2 leading-relaxed text-aura-platinum/40">{item.description}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-2 mb-5">
                <Download className="w-4 h-4 text-aura-gold" />
                <h3 className="text-xs font-bold uppercase tracking-widest">{t(`export${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}`)}</h3>
              </div>

              <FieldLabel>{t('format')}</FieldLabel>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {(["csv", "xlsx"] as FileFormat[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`py-2 rounded text-xs font-bold uppercase tracking-widest border ${format === f ? "bg-aura-gold text-black border-aura-gold" : "border-white/10 text-aura-platinum/50 hover:bg-white/5"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <button
                onClick={exportData}
                disabled={loading === "export"}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded bg-aura-gold/10 border border-aura-gold/30 text-aura-gold text-xs font-bold uppercase tracking-widest hover:bg-aura-gold/20 disabled:opacity-50"
              >
                {loading === "export" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {t('exportFile')}
              </button>
            </div>

            <form onSubmit={importData} className="rounded border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-2 mb-5">
                <Upload className="w-4 h-4 text-aura-emerald" />
                <h3 className="text-xs font-bold uppercase tracking-widest">{t(`import${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}`)}</h3>
              </div>

              <FieldLabel>{t('duplicateRule')}</FieldLabel>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button type="button" onClick={() => setDuplicateRule("skip")} className={`py-2 rounded text-xs font-bold uppercase tracking-widest border ${duplicateRule === "skip" ? "bg-aura-emerald text-black border-aura-emerald" : "border-white/10 text-aura-platinum/50 hover:bg-white/5"}`}>
                  {t('skip')}
                </button>
                <button type="button" onClick={() => setDuplicateRule("update")} className={`py-2 rounded text-xs font-bold uppercase tracking-widest border ${duplicateRule === "update" ? "bg-aura-gold text-black border-aura-gold" : "border-white/10 text-aura-platinum/50 hover:bg-white/5"}`}>
                  {t('update')}
                </button>
              </div>

              <FieldLabel>{t('file')}</FieldLabel>
              <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed border-white/10 bg-black/30 px-4 py-5 text-center hover:border-aura-gold/30">
                <FileSpreadsheet className="w-6 h-6 text-aura-platinum/30" />
                <span className="text-xs text-aura-platinum/60">{file ? file.name : `${t('chooseFile')} (.${format})`}</span>
                <input
                  type="file"
                  accept={format === "xlsx" ? ".xlsx" : ".csv,text/csv"}
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>

              <button
                type="submit"
                disabled={loading === "import"}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3 rounded bg-aura-emerald/10 border border-aura-emerald/30 text-aura-emerald text-xs font-bold uppercase tracking-widest hover:bg-aura-emerald/20 disabled:opacity-50"
              >
                {loading === "import" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {t('importFile')}
              </button>
            </form>
          </div>

          <div className="rounded border border-aura-gold/20 bg-aura-gold/5 p-4 text-xs text-aura-platinum/60 leading-relaxed">
            <div className="flex items-center gap-2 text-aura-gold font-bold uppercase tracking-widest mb-2">
              <ShieldCheck className="w-4 h-4" /> {t('requiredColumns')}
            </div>
            <p><strong>Clients/Leads:</strong> firstName, lastName, email, phone. Optional: assignedAgentEmail, status/stage, country, tier, riskScore, kycStatus.</p>
            <p className="mt-1"><strong>Users:</strong> firstName, lastName, email, roles. For new users, password is required. Passwords are never exported.</p>
          </div>
        </section>

        <aside className="space-y-6">
          {result && (
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4">{t('lastImportSummary')}</h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                {Object.entries(result.summary).map(([key, val]) => (
                  <div key={key} className="rounded border border-white/10 bg-black/20 p-3">
                    <div className="text-xl font-bold">{val}</div>
                    <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40">{key}</div>
                  </div>
                ))}
              </div>
              {result.errors.length > 0 && (
                <div className="mt-4 max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                  {result.errors.map((err, idx) => (
                    <div key={idx} className="rounded border border-aura-ruby/20 bg-aura-ruby/5 p-2 text-[11px] text-aura-ruby">
                      Row {err.row}: {err.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4">{t('auditTrail')}</h3>
            {audit.length === 0 ? (
              <div className="text-xs text-aura-platinum/30 py-6 text-center">{t('noAuditRecords')}</div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar">
                {audit.map(log => (
                  <div key={log.id} className="rounded border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-aura-gold">{log.action}</span>
                      <span className="text-[10px] text-aura-platinum/30">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-xs mt-1">{log.entityType}</div>
                    <div className="text-[10px] text-aura-platinum/40 mt-1">{log.user?.email || "system"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
