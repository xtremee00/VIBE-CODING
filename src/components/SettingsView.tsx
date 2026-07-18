import React, { useState } from 'react';
import { BusinessSettings, StaffMember } from '../types';
import { Settings, Save, Download, Upload, Shield, Lock, Moon, Sun, CheckCircle, HelpCircle, Users, Mail } from 'lucide-react';

interface SettingsViewProps {
  settings: BusinessSettings;
  staff: StaffMember[];
  onSaveSettings: (settings: BusinessSettings) => void;
  onImportState: (jsonData: string) => void;
  onExportState: () => void;
  currentStaff: StaffMember;
  onEnterAdminHub?: () => void;
}

export default function SettingsView({
  settings,
  staff,
  onSaveSettings,
  onImportState,
  onExportState,
  currentStaff,
  onEnterAdminHub
}: SettingsViewProps) {
  const [businessName, setBusinessName] = useState<string>(settings.businessName);
  const [currency, setCurrency] = useState<string>(settings.currency);
  const [taxEnabled, setTaxEnabled] = useState<boolean>(settings.taxEnabled);
  const [taxRate, setTaxRate] = useState<string>(settings.taxRate.toString());
  const [receiptFooter, setReceiptFooter] = useState<string>(settings.receiptFooter);
  const [pinLockEnabled, setPinLockEnabled] = useState<boolean>(settings.pinLockEnabled);
  const [pinCode, setPinCode] = useState<string>(settings.pinCode || "");
  const [language, setLanguage] = useState<string>(settings.language);

  const [successMsg, setSuccessMsg] = useState<string>("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinLockEnabled && pinCode.length !== 4) {
      alert("PIN code must be exactly 4 digits long.");
      return;
    }

    onSaveSettings({
      businessName,
      currency,
      taxEnabled,
      taxRate: parseFloat(taxRate) || 0,
      receiptFooter,
      darkMode: settings.darkMode,
      language,
      backupSettings: settings.backupSettings,
      pinLockEnabled,
      pinCode: pinLockEnabled ? pinCode : undefined
    });

    setSuccessMsg("Settings updated successfully!");
    setTimeout(() => {
      setSuccessMsg("");
    }, 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        // Basic validation
        const parsed = JSON.parse(json);
        if (parsed.products && parsed.sales && parsed.settings) {
          onImportState(json);
          alert("Backup restored successfully! App will reload current logs.");
        } else {
          alert("Invalid backup file. Missing critical ledger structures.");
        }
      } catch (err) {
        alert("Failed to parse file. Ensure it is a valid ShopLedger JSON backup.");
      }
    };
    reader.readAsText(file);
  };

  const isOwner = currentStaff.role === 'owner';
  const ownerStaff = staff.find(s => s.role === 'owner');
  const ownerName = ownerStaff ? ownerStaff.name : "Shop Owner";

  if (currentStaff.role === 'salesperson') {
    return (
      <div className="animate-fade-in max-w-md mx-auto p-8 bg-white rounded-[32px] border border-gray-100 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-gray-900">Access Restricted</h3>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Your personnel profile is set to <strong>Salesperson</strong>. Only Managers or the Shop Owner can view or modify business settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto pb-24">
      <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-gray-50 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              Settings & Customization
            </h2>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">Configure business details, receipts, tax, and local security pins.</p>
          </div>
          <div className="bg-gray-100 text-gray-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
            {isOwner ? "Owner Mode" : "Manager Mode"}
          </div>
        </div>

        {successMsg && (
          <div className="p-4 bg-teal-50 text-teal-850 rounded-[16px] flex items-center gap-2 border border-teal-100/50 text-xs font-semibold">
            <CheckCircle className="w-4 h-4 text-teal-600" />
            {successMsg}
          </div>
        )}

        {!isOwner && (
          <div className="p-3.5 bg-amber-50 border border-amber-100 text-amber-900 rounded-[18px] flex items-start gap-2.5 text-[11px] font-semibold leading-relaxed">
            <Lock className="w-4 h-4 text-amber-650 mt-0.5 shrink-0" />
            <div>
              <span className="font-extrabold text-amber-950">Limited Manager Privileges:</span> Some identity, tax, and security fields are locked. Only the Shop Owner (<strong className="text-amber-950 font-bold">{ownerName}</strong>) is authorized to modify them.
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Business Profile Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Business Profile</h3>
            
            {/* Shop Name */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-bold text-gray-500">Business / Shop Name</label>
                {isOwner ? (
                  <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                    Editable (Shop Owner)
                  </span>
                ) : (
                  <span className="text-[9px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Locked ({ownerName} Only)
                  </span>
                )}
              </div>
              <input
                id="settings-shop-name"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                disabled={!isOwner}
                className={`w-full h-10 px-4 rounded-full outline-none text-xs font-semibold transition-all ${
                  !isOwner
                    ? "bg-gray-100 border border-gray-250 text-gray-400 cursor-not-allowed"
                    : "bg-gray-50 border border-gray-100 focus:border-teal-500 text-gray-700 shadow-sm"
                }`}
                placeholder="Enter shop name..."
              />
            </div>

            {/* Shop Code block for onboarding */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-[20px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-semibold">
              <div className="space-y-0.5">
                <span className="font-extrabold text-emerald-950 uppercase text-[11px] tracking-tight block">Shop Registration Code</span>
                <p className="text-[10px] text-emerald-800 font-medium leading-relaxed">
                  Give this code to your staff so they can register & join this shop in their app.
                </p>
              </div>
              <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 justify-between sm:justify-start">
                <span className="font-black text-xs tracking-wider text-emerald-950 bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-200">
                  {settings.shopCode || "SL-8921"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(settings.shopCode || "SL-8921");
                    alert("Shop Code copied to clipboard!");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] uppercase tracking-wider px-3 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Copy Code
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Currency Selector */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Currency Symbol</label>
                <select
                  id="settings-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={!isOwner}
                  className={`w-full h-10 px-4 rounded-full outline-none text-xs font-semibold transition-all cursor-pointer ${
                    !isOwner
                      ? "bg-gray-100 border border-gray-250 text-gray-400 cursor-not-allowed"
                      : "bg-gray-50 border border-gray-100 focus:border-teal-500 text-gray-700"
                  }`}
                >
                  <option value="₦">₦ (NGN)</option>
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="GH₵">GH₵ (GHS)</option>
                  <option value="KSh">KSh (KES)</option>
                  <option value="₹">₹ (INR)</option>
                  <option value="CFA">CFA (XOF)</option>
                </select>
              </div>

              {/* Language Selector */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Language</label>
                <select
                  id="settings-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-full outline-none focus:border-teal-500 text-xs font-semibold text-gray-700 cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Yoruba">Yoruba</option>
                  <option value="Hausa">Hausa</option>
                  <option value="Igbo">Igbo</option>
                  <option value="Pidgin">Nigerian Pidgin</option>
                  <option value="French">French</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tax Configurations */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Tax Configuration (VAT)</span>
              <button
                id="toggle-tax-btn"
                type="button"
                onClick={() => isOwner && setTaxEnabled(!taxEnabled)}
                disabled={!isOwner}
                className={`w-10 h-5 rounded-full p-0.5 transition-all duration-200 ${
                  !isOwner ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                } ${
                  taxEnabled ? "bg-teal-600 flex justify-end" : "bg-gray-200 flex justify-start"
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </button>
            </h3>

            {taxEnabled && (
              <div className="animate-fade-in">
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">VAT Rate (%)</label>
                <input
                  id="settings-tax-rate"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 7.5"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  disabled={!isOwner}
                  className={`w-24 h-10 px-4 rounded-full outline-none text-xs font-semibold transition-all ${
                    !isOwner
                      ? "bg-gray-100 border border-gray-250 text-gray-400 cursor-not-allowed"
                      : "bg-gray-50 border border-gray-100 focus:border-teal-500 text-gray-700"
                  }`}
                />
              </div>
            )}
          </div>

          {/* Receipt Customizations */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Receipt Footer</h3>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Custom Receipt Bottom Note</label>
              <textarea
                id="settings-receipt-footer"
                rows={2}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="e.g. No cash refund on goods after 24 hours. Thanks!"
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-[16px] outline-none focus:border-teal-500 text-xs font-semibold text-gray-700"
              />
            </div>
          </div>

          {/* Local PIN Lock Screen Demonstration */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1"><Lock className="w-4 h-4" /> PIN Security Lock</span>
              <button
                id="toggle-pin-btn"
                type="button"
                onClick={() => isOwner && setPinLockEnabled(!pinLockEnabled)}
                disabled={!isOwner}
                className={`w-10 h-5 rounded-full p-0.5 transition-all duration-200 ${
                  !isOwner ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                } ${
                  pinLockEnabled ? "bg-teal-600 flex justify-end" : "bg-gray-200 flex justify-start"
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </button>
            </h3>

            {pinLockEnabled && (
              <div className="animate-fade-in">
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Enter 4-Digit Security PIN</label>
                <input
                  id="settings-pin-code"
                  type="password"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  placeholder="e.g. 1234"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                  disabled={!isOwner}
                  className={`w-24 h-10 tracking-widest rounded-full outline-none text-sm font-black text-center transition-all ${
                    !isOwner
                      ? "bg-gray-100 border border-gray-250 text-gray-400 cursor-not-allowed"
                      : "bg-gray-50 border border-gray-100 focus:border-teal-500 text-gray-700"
                  }`}
                />
              </div>
            )}
          </div>

          <button
            id="save-settings-btn"
            type="submit"
            className="w-full h-11 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-full font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-teal-600/10 border-0"
          >
            <Save className="w-4 h-4" />
            Save Ledger Settings
          </button>
        </form>

        {/* Registered Personnel Directory Section */}
        {isOwner ? (
          <div className="pt-6 border-t border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-600" />
                Registered Personnel ({staff.length})
              </h3>
              <span className="text-[9px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-teal-100">
                Active Shop List
              </span>
            </div>

            <p className="text-[11px] text-gray-400 font-semibold leading-relaxed">
              Review your team profiles and security pins. Give new employees your <strong>Shop Registration Code ({settings.shopCode || "SL-8921"})</strong> to sign up themselves.
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {staff.map((s) => {
                const fallbackPin = s.role === 'owner' ? '1111' : s.role === 'manager' ? '2222' : '3333';
                const currentPin = s.pin || fallbackPin;
                return (
                  <div key={s.id} className="p-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-900 text-teal-100 flex items-center justify-center font-black text-xs uppercase shrink-0">
                        {s.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-gray-900">{s.name}</span>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-wider border ${
                            s.role === 'owner' 
                              ? 'bg-purple-50 text-purple-700 border-purple-100' 
                              : s.role === 'manager'
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : 'bg-teal-50 text-teal-700 border-teal-100'
                          }`}>
                            {s.role}
                          </span>
                        </div>
                        {(s.email || s.phone) ? (
                          <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                            {s.email} {s.email && s.phone && '•'} {s.phone}
                          </p>
                        ) : (
                          <p className="text-[10px] text-gray-450 font-medium mt-0.5">No contact details listed</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-between sm:justify-end bg-white border border-gray-150 p-1.5 px-3 rounded-xl">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Passcode PIN:</span>
                      <span className="font-black text-xs text-gray-700 font-mono tracking-widest">{currentPin}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="pt-6 border-t border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-300" />
                Registered Personnel
              </h3>
              <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-100 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Restricted
              </span>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-xs font-semibold text-amber-900 leading-relaxed flex items-start gap-2.5 animate-fade-in">
              <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-extrabold text-amber-950 block mb-0.5">Access Restricted</span>
                Personnel directory profiles, security PINs, and team registration codes can only be viewed or managed by the Shop Owner (<strong className="text-amber-950 font-bold">{ownerName}</strong>).
              </div>
            </div>
          </div>
        )}

        {/* 1-Click Backups & Syncs Section */}
        <div className="pt-6 border-t border-gray-100 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-4 h-4 text-teal-600" />
            Local Data Backups & Sync (Offline Mode)
          </h3>
          <p className="text-[11px] text-gray-400 font-semibold leading-relaxed">
            ShopLedger operates entirely client-side for ultra-fast performance. Download a physical backup file to guarantee no historical record is ever lost, or upload a backup JSON from another device.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              id="backup-export-btn"
              onClick={onExportState}
              className="h-10 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-100/50 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Download className="w-4 h-4" />
              Download Backup
            </button>
            
            <label className={`h-10 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
              !isOwner
                ? "bg-gray-100 text-gray-450 border-gray-200 cursor-not-allowed opacity-65"
                : "bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-100/50 cursor-pointer"
            }`}>
              <Upload className="w-4 h-4" />
              Restore Backup
              {isOwner && (
                <input
                  id="backup-upload-input"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              )}
            </label>
          </div>
        </div>

        {/* App Owner Hub Promo Section */}
        {onEnterAdminHub && isOwner && (
          <div className="pt-6 border-t border-gray-150 space-y-4">
            <h3 className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-teal-700" />
              App Owner / Developer Portal
            </h3>
            <div className="bg-teal-50/50 rounded-2xl p-4.5 border border-teal-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-xs font-extrabold text-teal-950 block">Platform Client Communications</span>
                <p className="text-[11px] text-teal-850 font-semibold leading-normal max-w-md">
                  View all registered platform users, send newsletter broadcasts, system updates, and scheduled billing invoices directly.
                </p>
              </div>
              <button
                type="button"
                id="enter-admin-hub-settings-btn"
                onClick={onEnterAdminHub}
                className="px-4.5 py-2.5 bg-teal-950 hover:bg-teal-900 active:scale-95 text-white rounded-full font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shrink-0 shadow-md"
              >
                <Mail className="w-3.5 h-3.5" />
                Open App Owner Hub
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
