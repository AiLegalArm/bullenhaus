import React, { createContext, useContext, useMemo, useState } from "react";

export type Locale = "en" | "de";

type Dictionary = Record<string, string>;

const dictionaries: Record<Locale, Dictionary> = {
  en: {
    language: "EN",
    switchLanguage: "Switch language",
    commandCenter: "Command Center",
    secureSessionActive: "Secure Session: Active",
    systemStatusOnline: "System Status: Online",
    tradingEngineConnected: "Trading Engine: Connected",
    aiCoreActive: "AI Core Active",
    auraAccount: "Aura Account",
    logout: "Logout",

    navDirectorDashboard: "Director Dashboard",
    navAdminPanel: "Admin Panel",
    navManagerDashboard: "Manager Dashboard",
    navAgentWorkspace: "Agent Workspace",
    navVipClients: "VIP Clients",
    navTrading: "Trading Intelligence",
    navCallCenter: "Call Center",
    navAdvertisers: "Advertisers",
    navSpec: "Product Spec",
    navReports: "Reports",
    navData: "Data Import/Export",
    navTeamPipeline: "Team Pipeline",
    navActiveDialer: "Active Dialer",
    navMyLeads: "My Leads",

    loginTitle: "Aura Command Center",
    loginSubtitle: "Secured Access Only",
    loginEmail: "Email",
    loginPassword: "Password",
    loginButton: "Sign In",
    loginLoading: "Authenticating...",
    loginProtected: "Protected by Aura Security Protocol v2 · Session encrypted end-to-end",

    dataTitle: "Database Import / Export",
    dataSubtitle: "CSV / XLSX · Duplicate rules · Audit trail",
    refreshAudit: "Refresh Audit",
    clients: "Clients",
    leads: "Leads",
    users: "Users",
    exportFile: "Export File",
    importFile: "Import File",
    exportClients: "Export Clients",
    importClients: "Import Clients",
    exportLeads: "Export Leads",
    importLeads: "Import Leads",
    exportUsers: "Export Users",
    importUsers: "Import Users",
    format: "Format",
    duplicateRule: "Duplicate Rule",
    skip: "Skip",
    update: "Update",
    file: "File",
    chooseFile: "Choose file",
    requiredColumns: "Required Columns",
    lastImportSummary: "Last Import Summary",
    auditTrail: "Audit Trail",
    noAuditRecords: "No audit records yet",

    adminTitle: "Platform Administration",
    adminSubtitle: "System Configuration & Security",
    activeUsers: "Active Users",
    securityBreaches: "Security Breaches",
    systemUptime: "System Uptime",
    userAccounts: "User Accounts",
    searchUsers: "Search users...",
    name: "Name",
    role: "Role",
    status: "Status",
    lastLogin: "Last Login",
    actions: "Actions",
    securityAuditLog: "Security Audit Log",

    vipTitle: "VIP Portfolio",
    vipSubtitle: "Manage high-net-worth individuals",
    searchVips: "Search VIPs...",
    all: "All",
    noVipTitle: "No VIP Clients Found",
    noVipDescription: "Adjust your search or filter criteria to see results.",
    clearFilters: "Clear Filters",
    totalBalance: "Total Balance",
    aiRiskAssessment: "AI Risk Assessment",
    call: "Call",
    email: "Email",
    profile: "Profile",

    tradingTitle: "Trading Intelligence",
    tradingSubtitle: "Real-time market exposure and platform health",
    refreshFeed: "Refresh Feed",
    totalTradingAum: "Total Trading AUM",
    syncedTraders: "Synced Traders",
    pendingKycReviews: "Pending KYC Reviews",
    criticalChurnRisks: "Critical Churn Risks",
    platformExposure: "Platform Exposure",
    recentTradingRegistrations: "Recent Trading Platform Registrations",

    callCenterTitle: "Call Center",
    readyDialer: "Ready (Dialer)",
    queueLeads: "Queue: 24 Leads",
    dialerSettings: "Dialer Settings",
    activeCall: "Active Call",
    aiRecommendedApproach: "AI Recommended Approach",
    callQueue: "Call Queue",
    wrapUpCall: "Wrap Up Call",
    callOutcome: "Call Outcome",
    aiSummaryNotes: "AI Summary & Notes",
    saveNextLead: "Save & Next Lead",
    cancel: "Cancel",

    reportsTitle: "Platform Analytics",
    reportsSubtitle: "Custom Reports & Metrics",
    exportPdf: "Export PDF",
    selectReport: "Select a report module above to view detailed analytics.",

    managerTitle: "Team Manager Dashboard",
    managerSubtitle: "Sales Team Performance & Pipeline",
    agentTitle: "Agent Workspace",
    agentSubtitle: "Daily Operations & Leads",
  },
  de: {
    language: "DE",
    switchLanguage: "Sprache wechseln",
    commandCenter: "Kommandozentrale",
    secureSessionActive: "Sichere Sitzung: Aktiv",
    systemStatusOnline: "Systemstatus: Online",
    tradingEngineConnected: "Trading Engine: Verbunden",
    aiCoreActive: "KI-Kern aktiv",
    auraAccount: "Aura Konto",
    logout: "Abmelden",

    navDirectorDashboard: "Direktor-Dashboard",
    navAdminPanel: "Admin-Bereich",
    navManagerDashboard: "Manager-Dashboard",
    navAgentWorkspace: "Agent-Arbeitsplatz",
    navVipClients: "VIP-Kunden",
    navTrading: "Trading-Intelligence",
    navCallCenter: "Callcenter",
    navAdvertisers: "Werbepartner",
    navSpec: "Produktspezifikation",
    navReports: "Berichte",
    navData: "Daten Import/Export",
    navTeamPipeline: "Team-Pipeline",
    navActiveDialer: "Aktiver Dialer",
    navMyLeads: "Meine Leads",

    loginTitle: "Aura Kommandozentrale",
    loginSubtitle: "Gesicherter Zugriff",
    loginEmail: "E-Mail",
    loginPassword: "Passwort",
    loginButton: "Anmelden",
    loginLoading: "Authentifizierung...",
    loginProtected: "Geschützt durch Aura Security Protocol v2 · Sitzung Ende-zu-Ende verschlüsselt",

    dataTitle: "Datenbank Import / Export",
    dataSubtitle: "CSV / XLSX · Dublettenregeln · Audit-Protokoll",
    refreshAudit: "Audit aktualisieren",
    clients: "Kunden",
    leads: "Leads",
    users: "Benutzer",
    exportFile: "Datei exportieren",
    importFile: "Datei importieren",
    exportClients: "Kunden exportieren",
    importClients: "Kunden importieren",
    exportLeads: "Leads exportieren",
    importLeads: "Leads importieren",
    exportUsers: "Benutzer exportieren",
    importUsers: "Benutzer importieren",
    format: "Format",
    duplicateRule: "Dublettenregel",
    skip: "Überspringen",
    update: "Aktualisieren",
    file: "Datei",
    chooseFile: "Datei auswählen",
    requiredColumns: "Pflichtspalten",
    lastImportSummary: "Letzte Import-Zusammenfassung",
    auditTrail: "Audit-Protokoll",
    noAuditRecords: "Noch keine Audit-Einträge",

    adminTitle: "Plattform-Administration",
    adminSubtitle: "Systemkonfiguration & Sicherheit",
    activeUsers: "Aktive Benutzer",
    securityBreaches: "Sicherheitsvorfälle",
    systemUptime: "Systemverfügbarkeit",
    userAccounts: "Benutzerkonten",
    searchUsers: "Benutzer suchen...",
    name: "Name",
    role: "Rolle",
    status: "Status",
    lastLogin: "Letzte Anmeldung",
    actions: "Aktionen",
    securityAuditLog: "Sicherheits-Audit",

    vipTitle: "VIP-Portfolio",
    vipSubtitle: "Betreuung vermögender Kunden",
    searchVips: "VIPs suchen...",
    all: "Alle",
    noVipTitle: "Keine VIP-Kunden gefunden",
    noVipDescription: "Passe Suche oder Filter an, um Ergebnisse zu sehen.",
    clearFilters: "Filter löschen",
    totalBalance: "Gesamtsaldo",
    aiRiskAssessment: "KI-Risikobewertung",
    call: "Anrufen",
    email: "E-Mail",
    profile: "Profil",

    tradingTitle: "Trading-Intelligence",
    tradingSubtitle: "Marktexposure und Plattformstatus in Echtzeit",
    refreshFeed: "Feed aktualisieren",
    totalTradingAum: "Gesamtes Trading-AUM",
    syncedTraders: "Synchronisierte Trader",
    pendingKycReviews: "Ausstehende KYC-Prüfungen",
    criticalChurnRisks: "Kritische Abwanderungsrisiken",
    platformExposure: "Plattform-Exposure",
    recentTradingRegistrations: "Aktuelle Registrierungen von der Trading-Plattform",

    callCenterTitle: "Callcenter",
    readyDialer: "Bereit (Dialer)",
    queueLeads: "Warteschlange: 24 Leads",
    dialerSettings: "Dialer-Einstellungen",
    activeCall: "Aktiver Anruf",
    aiRecommendedApproach: "Von KI empfohlener Ansatz",
    callQueue: "Anruf-Warteschlange",
    wrapUpCall: "Anruf abschließen",
    callOutcome: "Anrufergebnis",
    aiSummaryNotes: "KI-Zusammenfassung & Notizen",
    saveNextLead: "Speichern & nächster Lead",
    cancel: "Abbrechen",

    reportsTitle: "Plattform-Analysen",
    reportsSubtitle: "Individuelle Berichte & Kennzahlen",
    exportPdf: "PDF exportieren",
    selectReport: "Wähle oben ein Berichtsmodul, um detaillierte Analysen zu sehen.",

    managerTitle: "Team-Manager-Dashboard",
    managerSubtitle: "Vertriebsleistung & Pipeline",
    agentTitle: "Agent-Arbeitsplatz",
    agentSubtitle: "Tägliche Aufgaben & Leads",
  },
};

const LanguageContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string) => string;
} | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem("aura_locale");
    return saved === "de" ? "de" : "en";
  });

  const value = useMemo(() => {
    const setLocale = (next: Locale) => {
      localStorage.setItem("aura_locale", next);
      setLocaleState(next);
    };
    return {
      locale,
      setLocale,
      toggleLocale: () => setLocale(locale === "en" ? "de" : "en"),
      t: (key: string) => dictionaries[locale][key] || dictionaries.en[key] || key,
    };
  }, [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useI18n must be used inside LanguageProvider");
  return context;
}
