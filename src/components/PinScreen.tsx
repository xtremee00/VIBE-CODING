import React, { useState } from 'react';
import { Lock, Delete, Shield, Fingerprint } from 'lucide-react';

interface PinScreenProps {
  correctPin: string;
  onUnlock: () => void;
  businessName: string;
}

export default function PinScreen({ correctPin, onUnlock, businessName }: PinScreenProps) {
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<boolean>(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      
      if (newPin === correctPin) {
        setTimeout(() => {
          onUnlock();
        }, 150);
      } else if (newPin.length === 4) {
        setTimeout(() => {
          setError(true);
          setPin("");
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  return (
    <div className="fixed inset-0 bg-teal-950 text-white flex flex-col justify-between p-6 z-50 animate-fade-in font-sans">
      {/* Top Section */}
      <div className="flex flex-col items-center mt-12 text-center">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">{businessName}</h1>
        <p className="text-teal-300/80 text-sm mt-1">ShopLedger Security</p>
      </div>

      {/* Code Dots */}
      <div className="flex flex-col items-center">
        <p className="text-sm font-medium mb-4 text-teal-100">
          {error ? "Incorrect PIN, try again" : "Enter your 4-digit PIN"}
        </p>
        <div className="flex gap-4 justify-center">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                index < pin.length
                  ? "bg-emerald-400 border-emerald-400 scale-110 shadow-[0_0_12px_rgba(52,211,153,0.4)]"
                  : error
                  ? "border-rose-500 bg-rose-500/20"
                  : "border-teal-800"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Pin Pad */}
      <div className="max-w-xs mx-auto w-full mb-8">
        <div className="grid grid-cols-3 gap-y-4 gap-x-6 text-center">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              id={`pin-btn-${num}`}
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-16 w-16 mx-auto rounded-full bg-teal-900/40 hover:bg-teal-900/60 active:bg-teal-900/80 font-semibold text-lg flex items-center justify-center transition-colors border border-teal-800/40"
            >
              {num}
            </button>
          ))}
          
          <button
            id="biometric-btn"
            onClick={onUnlock}
            className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-sm flex flex-col items-center justify-center border border-emerald-500/20"
          >
            <Fingerprint className="w-6 h-6" />
            <span className="text-[9px] mt-0.5">Bypass</span>
          </button>

          <button
            id="pin-btn-0"
            onClick={() => handleKeyPress("0")}
            className="h-16 w-16 mx-auto rounded-full bg-teal-900/40 hover:bg-teal-900/60 active:bg-teal-900/80 font-semibold text-lg flex items-center justify-center transition-colors border border-teal-800/40"
          >
            0
          </button>

          <button
            id="pin-btn-delete"
            onClick={handleDelete}
            className="h-16 w-16 mx-auto rounded-full bg-teal-900/40 hover:bg-teal-900/60 text-teal-300 font-semibold text-lg flex items-center justify-center transition-colors border border-transparent"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
