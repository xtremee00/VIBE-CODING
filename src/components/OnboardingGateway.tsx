import React, { useState } from 'react';
import { StaffMember, ShopState, UserRole } from '../types';
import { Shield, Lock, Store, Users, UserPlus, Key, Eye, EyeOff, CheckCircle2, User, HelpCircle } from 'lucide-react';

interface OnboardingGatewayProps {
  state: ShopState;
  onLoginSuccess: (staffId: string) => void;
  onRegisterStaff: (newStaff: StaffMember) => void;
  onRegisterNewShop: (businessName: string, ownerName: string, pin: string, keepSamples: boolean) => void;
}

export default function OnboardingGateway({
  state,
  onLoginSuccess,
  onRegisterStaff,
  onRegisterNewShop
}: OnboardingGatewayProps) {
  const { staff, settings } = state;
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  
  // Sign In States
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staff[0]?.id || "");
  const [loginPin, setLoginPin] = useState<string>("");
  const [showLoginPin, setShowLoginPin] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>("");

  // Sign Up Mode: 'join_staff' | 'new_shop'
  const [signupMode, setSignupMode] = useState<'join_staff' | 'new_shop'>('join_staff');

  // Sign Up Staff States
  const [staffName, setStaffName] = useState<string>("");
  const [staffRole, setStaffRole] = useState<UserRole>("salesperson");
  const [staffPin, setStaffPin] = useState<string>("");
  const [staffEmail, setStaffEmail] = useState<string>("");
  const [staffPhone, setStaffPhone] = useState<string>("");
  const [enteredShopCode, setEnteredShopCode] = useState<string>("");
  const [staffSuccess, setStaffSuccess] = useState<string>("");
  const [staffError, setStaffError] = useState<string>("");

  // Sign Up New Shop States
  const [newShopName, setNewShopName] = useState<string>("");
  const [newOwnerName, setNewOwnerName] = useState<string>("");
  const [newOwnerPin, setNewOwnerPin] = useState<string>("");
  const [keepSamples, setKeepSamples] = useState<boolean>(true);
  const [shopSuccess, setShopSuccess] = useState<string>("");
  const [shopError, setShopError] = useState<string>("");

  // Handle personnel tap
  const handleSelectStaff = (id: string) => {
    setSelectedStaffId(id);
    setLoginPin("");
    setLoginError("");
  };

  const handleKeyPress = (num: string) => {
    if (loginPin.length < 4) {
      const newPin = loginPin + num;
      setLoginPin(newPin);
      setLoginError("");

      // Auto-validate once 4 digits entered
      if (newPin.length === 4) {
        const selectedMember = staff.find(s => s.id === selectedStaffId);
        // Fallback checks for pins
        const correctPin = selectedMember?.pin || (selectedMember?.role === 'owner' ? "1111" : selectedMember?.role === 'manager' ? "2222" : "3333");
        
        if (newPin === correctPin) {
          setTimeout(() => {
            onLoginSuccess(selectedStaffId);
          }, 150);
        } else {
          setTimeout(() => {
            setLoginError("Incorrect PIN for " + (selectedMember?.name || "staff"));
            setLoginPin("");
          }, 200);
        }
      }
    }
  };

  const handleDeletePin = () => {
    if (loginPin.length > 0) {
      setLoginPin(loginPin.slice(0, -1));
    }
  };

  // Submit join staff
  const handleJoinStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError("");
    setStaffSuccess("");

    if (!staffName.trim()) {
      setStaffError("Please enter your name.");
      return;
    }
    if (staffPin.length !== 4 || !/^\d+$/.test(staffPin)) {
      setStaffError("Your login PIN must be exactly 4 digits.");
      return;
    }

    const correctShopCode = settings.shopCode || "SL-8921";
    if (enteredShopCode.trim().toUpperCase() !== correctShopCode.toUpperCase()) {
      setStaffError(`Invalid Shop Code! Please ask your Shop Owner or Manager for the correct code.`);
      return;
    }

    // Verify if name already exists
    if (staff.some(s => s.name.toLowerCase() === staffName.trim().toLowerCase())) {
      setStaffError("A staff member with this name is already registered.");
      return;
    }

    const newStaffId = `s-${Date.now()}`;
    const newStaff: StaffMember = {
      id: newStaffId,
      name: staffName.trim(),
      role: staffRole,
      email: staffEmail.trim() || undefined,
      phone: staffPhone.trim() || undefined,
      isActive: true,
      pin: staffPin
    };

    onRegisterStaff(newStaff);
    setStaffSuccess(`Successfully registered as ${staffRole.toUpperCase()}! You can now log in.`);
    
    // Clear inputs and switch back to Sign In
    setTimeout(() => {
      setSelectedStaffId(newStaffId);
      setActiveTab('signin');
      setLoginPin("");
      // Reset form
      setStaffName("");
      setStaffPin("");
      setStaffEmail("");
      setStaffPhone("");
      setEnteredShopCode("");
      setStaffSuccess("");
    }, 2000);
  };

  // Submit register new shop
  const handleRegisterShopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShopError("");
    setShopSuccess("");

    if (!newShopName.trim()) {
      setShopError("Please enter your Shop or Business name.");
      return;
    }
    if (!newOwnerName.trim()) {
      setShopError("Please enter your name as the Owner.");
      return;
    }
    if (newOwnerPin.length !== 4 || !/^\d+$/.test(newOwnerPin)) {
      setShopError("Your owner security PIN must be exactly 4 digits.");
      return;
    }

    onRegisterNewShop(newShopName.trim(), newOwnerName.trim(), newOwnerPin, keepSamples);
    setShopSuccess(`Shop "${newShopName}" created successfully! Booting up your ledger...`);

    setTimeout(() => {
      // Login as owner
      setActiveTab('signin');
      setLoginPin("");
      setNewShopName("");
      setNewOwnerName("");
      setNewOwnerPin("");
      setShopSuccess("");
    }, 2500);
  };

  const activeMember = staff.find(s => s.id === selectedStaffId) || staff[0];

  return (
    <div className="fixed inset-0 bg-teal-950/95 text-white flex flex-col justify-center items-center p-4 sm:p-6 z-50 overflow-y-auto font-sans">
      <div className="w-full max-w-2xl bg-[#092d24] border border-teal-900 rounded-[32px] shadow-2xl p-6 sm:p-8 space-y-6 my-auto">
        
        {/* Header Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl items-center justify-center border border-emerald-500/20 shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-teal-200 to-emerald-400 bg-clip-text text-transparent">
            ShopLedger
          </h1>
          <p className="text-xs text-teal-300 font-semibold tracking-wider uppercase">
            {activeTab === 'signin' 
              ? `Personnel Portal • ${settings.businessName}` 
              : "Onboarding & Registration Desk"}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 bg-teal-950/60 p-1.5 rounded-2xl border border-teal-900/60">
          <button
            id="tab-signin-trigger"
            type="button"
            onClick={() => setActiveTab('signin')}
            className={`py-3 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${
              activeTab === 'signin'
                ? "bg-teal-900 text-teal-100 shadow-[0_4px_12px_rgba(13,148,136,0.15)] border border-teal-800"
                : "text-teal-400 hover:text-teal-200"
            }`}
          >
            Sign In (Select Staff)
          </button>
          <button
            id="tab-signup-trigger"
            type="button"
            onClick={() => setActiveTab('signup')}
            className={`py-3 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${
              activeTab === 'signup'
                ? "bg-teal-900 text-teal-100 shadow-[0_4px_12px_rgba(13,148,136,0.15)] border border-teal-800"
                : "text-teal-400 hover:text-teal-200"
            }`}
          >
            Sign Up / Register
          </button>
        </div>

        {/* --- SIGN IN MODE --- */}
        {activeTab === 'signin' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
            
            {/* Staff Selector (left side) */}
            <div className="md:col-span-5 space-y-3">
              <label className="block text-[10px] font-black uppercase text-teal-400 tracking-widest">Select Your Profile</label>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {staff.map((s) => {
                  const isSelected = s.id === selectedStaffId;
                  return (
                    <button
                      id={`profile-card-${s.id}`}
                      key={s.id}
                      onClick={() => handleSelectStaff(s.id)}
                      className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-teal-900/60 border-emerald-500/50 shadow-md text-white"
                          : "bg-teal-950/40 border-teal-900 hover:bg-teal-950/70 text-teal-200/80 hover:text-teal-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm uppercase ${
                          isSelected ? "bg-emerald-500 text-teal-950" : "bg-teal-900/80 text-teal-200"
                        }`}>
                          {s.name.slice(0, 1)}
                        </div>
                        <div>
                          <p className="font-extrabold text-xs">{s.name}</p>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-teal-400 mt-0.5">
                            {s.role === 'owner' ? 'Shop Owner' : s.role === 'manager' ? 'Manager' : 'Salesperson'}
                          </p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PIN keypad (right side) */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4 bg-teal-950/40 p-4.5 rounded-3xl border border-teal-900">
              <div className="text-center space-y-2">
                <span className="text-[10px] font-black uppercase text-teal-400 tracking-widest block">Security Passcode</span>
                <p className="text-xs text-teal-200 font-semibold">
                  Hello, {activeMember?.name || "Staff"}! Enter your 4-digit PIN.
                </p>
                
                {/* Dots indicator */}
                <div className="flex gap-3.5 justify-center py-2.5">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                        idx < loginPin.length
                          ? "bg-emerald-400 border-emerald-400 scale-110 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                          : loginError
                          ? "border-rose-500 bg-rose-500/20"
                          : "border-teal-800"
                      }`}
                    />
                  ))}
                </div>

                {loginError ? (
                  <p className="text-rose-400 text-[11px] font-black animate-pulse">{loginError}</p>
                ) : (
                  <p className="text-teal-400/60 text-[10px] font-bold">
                    Hint: Default accounts use 1111 (Owner), 2222 (Manager), 3333 (Sales)
                  </p>
                )}
              </div>

              {/* Pin pad keypad */}
              <div className="max-w-[240px] mx-auto w-full">
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                    <button
                      id={`gateway-pin-${num}`}
                      key={num}
                      type="button"
                      onClick={() => handleKeyPress(num)}
                      className="h-11 w-full rounded-xl bg-teal-900/40 hover:bg-teal-900/80 active:bg-teal-800 font-black text-sm flex items-center justify-center transition-colors border border-teal-900/60 cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                  
                  <button
                    id="gateway-pin-clear"
                    type="button"
                    onClick={() => setLoginPin("")}
                    className="h-11 w-full rounded-xl hover:bg-rose-500/10 text-rose-400 font-bold text-[10px] flex items-center justify-center transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    Clear
                  </button>

                  <button
                    id="gateway-pin-0"
                    type="button"
                    onClick={() => handleKeyPress("0")}
                    className="h-11 w-full rounded-xl bg-teal-900/40 hover:bg-teal-900/80 active:bg-teal-800 font-black text-sm flex items-center justify-center transition-colors border border-teal-900/60 cursor-pointer"
                  >
                    0
                  </button>

                  <button
                    id="gateway-pin-back"
                    type="button"
                    onClick={handleDeletePin}
                    className="h-11 w-full rounded-xl hover:bg-teal-900/80 text-teal-300 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                  >
                    Del
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- SIGN UP / REGISTRATION MODE --- */}
        {activeTab === 'signup' && (
          <div className="space-y-5">
            {/* Signup Type Toggle */}
            <div className="flex gap-3 justify-center">
              <button
                id="signup-mode-join-btn"
                type="button"
                onClick={() => setSignupMode('join_staff')}
                className={`flex-1 p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
                  signupMode === 'join_staff'
                    ? "bg-teal-900/60 border-emerald-500/50 text-white shadow-lg"
                    : "bg-teal-950/40 border-teal-900 text-teal-300 hover:bg-teal-950/60"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${signupMode === 'join_staff' ? 'bg-emerald-500 text-teal-950' : 'bg-teal-900 text-teal-100'}`}>
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black">Join Existing Shop</h3>
                  <p className="text-[10px] text-teal-400 font-semibold mt-0.5">Register as Staff with Shop Code</p>
                </div>
              </button>

              <button
                id="signup-mode-newshop-btn"
                type="button"
                onClick={() => setSignupMode('new_shop')}
                className={`flex-1 p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
                  signupMode === 'new_shop'
                    ? "bg-teal-900/60 border-emerald-500/50 text-white shadow-lg"
                    : "bg-teal-950/40 border-teal-900 text-teal-300 hover:bg-teal-950/60"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${signupMode === 'new_shop' ? 'bg-emerald-500 text-teal-950' : 'bg-teal-900 text-teal-100'}`}>
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black">Register New Shop</h3>
                  <p className="text-[10px] text-teal-400 font-semibold mt-0.5">Start fresh as Shop Owner</p>
                </div>
              </button>
            </div>

            {/* A: JOIN EXISTING STAFF FORM */}
            {signupMode === 'join_staff' && (
              <form onSubmit={handleJoinStaffSubmit} className="space-y-4 bg-teal-950/40 p-5 rounded-3xl border border-teal-900">
                <div className="flex items-center justify-between border-b border-teal-900 pb-3">
                  <h3 className="text-xs font-black uppercase text-teal-400 tracking-wider">Staff Registration Form</h3>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full uppercase">
                    Requires Shop Code
                  </span>
                </div>

                {staffError && (
                  <p className="p-3 bg-rose-950/50 border border-rose-900 text-rose-200 rounded-xl text-xs font-bold leading-relaxed">
                    ⚠️ {staffError}
                  </p>
                )}
                {staffSuccess && (
                  <p className="p-3 bg-emerald-950/50 border border-emerald-900 text-emerald-200 rounded-xl text-xs font-bold leading-relaxed">
                    🎉 {staffSuccess}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-teal-300">Your Full Name</label>
                    <input
                      id="signup-staff-name"
                      type="text"
                      placeholder="e.g. Aminat Johnson"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className="w-full h-11 px-4 bg-teal-950 border border-teal-900 rounded-xl text-xs outline-none focus:border-teal-500 text-white"
                      required
                    />
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-teal-300">Assigned Role</label>
                    <select
                      id="signup-staff-role"
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value as UserRole)}
                      className="w-full h-11 px-4 bg-teal-950 border border-teal-900 rounded-xl text-xs outline-none focus:border-teal-500 text-white cursor-pointer"
                    >
                      <option value="salesperson">Salesperson (Sales Manager)</option>
                      <option value="manager">Manager / Supervisor</option>
                    </select>
                  </div>

                  {/* personal pin */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-teal-300">Set 4-Digit Security PIN</label>
                    <input
                      id="signup-staff-pin"
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 5566"
                      value={staffPin}
                      onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-11 px-4 bg-teal-950 border border-teal-900 rounded-xl text-xs outline-none focus:border-teal-500 text-white text-center font-bold tracking-widest"
                      required
                    />
                  </div>

                  {/* Shop Code */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="block text-[11px] font-bold text-teal-300">Business/Shop Code</label>
                      <span className="text-[9px] text-teal-400 font-semibold">(Ask shop owner)</span>
                    </div>
                    <input
                      id="signup-staff-code"
                      type="text"
                      placeholder="e.g. SL-8921"
                      value={enteredShopCode}
                      onChange={(e) => setEnteredShopCode(e.target.value)}
                      className="w-full h-11 px-4 bg-teal-950 border border-teal-900 rounded-xl text-xs outline-none focus:border-emerald-500 text-emerald-300 text-center font-bold tracking-widest placeholder-teal-800"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-teal-400/80">Email Address (Optional)</label>
                    <input
                      id="signup-staff-email"
                      type="email"
                      placeholder="e.g. you@shopledger.com"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      className="w-full h-11 px-4 bg-teal-950 border border-teal-900 rounded-xl text-xs outline-none focus:border-teal-500 text-teal-200"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-teal-400/80">Phone Number (Optional)</label>
                    <input
                      id="signup-staff-phone"
                      type="tel"
                      placeholder="e.g. +234..."
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      className="w-full h-11 px-4 bg-teal-950 border border-teal-900 rounded-xl text-xs outline-none focus:border-teal-500 text-teal-200"
                    />
                  </div>
                </div>

                <button
                  id="signup-staff-submit"
                  type="submit"
                  className="w-full py-3.5 mt-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-teal-950 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Register and Connect Account
                </button>
              </form>
            )}

            {/* B: REGISTER NEW SHOP FORM */}
            {signupMode === 'new_shop' && (
              <form onSubmit={handleRegisterShopSubmit} className="space-y-4 bg-teal-950/40 p-5 rounded-3xl border border-teal-900">
                <div className="flex items-center justify-between border-b border-teal-900 pb-3">
                  <h3 className="text-xs font-black uppercase text-teal-400 tracking-wider">New Shop Registration Form</h3>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full uppercase">
                    Create New Instance
                  </span>
                </div>

                {shopError && (
                  <p className="p-3 bg-rose-950/50 border border-rose-900 text-rose-200 rounded-xl text-xs font-bold leading-relaxed">
                    ⚠️ {shopError}
                  </p>
                )}
                {shopSuccess && (
                  <p className="p-3 bg-emerald-950/50 border border-emerald-900 text-emerald-200 rounded-xl text-xs font-bold leading-relaxed">
                    🎉 {shopSuccess}
                  </p>
                )}

                <div className="space-y-3">
                  {/* Shop Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-teal-300">Shop / Business Name</label>
                    <input
                      id="signup-shop-name"
                      type="text"
                      placeholder="e.g. Alhaji Ibrahim & Sons Mini Mart"
                      value={newShopName}
                      onChange={(e) => setNewShopName(e.target.value)}
                      className="w-full h-11 px-4 bg-teal-950 border border-teal-900 rounded-xl text-xs outline-none focus:border-teal-500 text-white font-extrabold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Owner Name */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-teal-300">Owner's Full Name</label>
                      <input
                        id="signup-shop-owner"
                        type="text"
                        placeholder="e.g. Alhaji Ibrahim"
                        value={newOwnerName}
                        onChange={(e) => setNewOwnerName(e.target.value)}
                        className="w-full h-11 px-4 bg-teal-950 border border-teal-900 rounded-xl text-xs outline-none focus:border-teal-500 text-white font-semibold"
                        required
                      />
                    </div>

                    {/* Owner PIN */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-teal-300">Set Owner Security PIN</label>
                      <input
                        id="signup-shop-pin"
                        type="text"
                        maxLength={4}
                        placeholder="e.g. 1122"
                        value={newOwnerPin}
                        onChange={(e) => setNewOwnerPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-11 px-4 bg-teal-950 border border-teal-900 rounded-xl text-xs outline-none focus:border-teal-500 text-white text-center font-bold tracking-widest"
                        required
                      />
                    </div>
                  </div>

                  {/* Seed / Keep samples */}
                  <div className="pt-2 flex items-center gap-3">
                    <input
                      id="signup-shop-keep-samples"
                      type="checkbox"
                      checked={keepSamples}
                      onChange={(e) => setKeepSamples(e.target.checked)}
                      className="w-4.5 h-4.5 rounded text-emerald-500 bg-teal-950 border-teal-900 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="signup-shop-keep-samples" className="text-xs font-semibold text-teal-300 select-none cursor-pointer">
                      Keep pre-populated sample products & logs <span className="text-[10px] text-teal-400 font-medium">(highly recommended for testing)</span>
                    </label>
                  </div>
                </div>

                <button
                  id="signup-shop-submit"
                  type="submit"
                  className="w-full py-3.5 mt-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-teal-950 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Create New Shop Ledger
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
