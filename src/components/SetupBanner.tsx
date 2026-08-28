import React, { useState } from 'react';
import { SETUP_SQL_SCRIPT } from '../lib/dbService';
import { Database, Copy, Check, Terminal, Sparkles, X } from 'lucide-react';

export default function SetupBanner() {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(SETUP_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div id="supabase-setup-banner" className="bg-[#F8F5F1] border-b border-[#EAE3D9] text-[#7C6A53] text-sm relative z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 bg-[#EAE3D9] rounded-lg text-[#A68A64] shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-[#2C2621] flex items-center gap-1.5">
              <span>Supabase Live Connection Assistant</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAE3D9] text-[#7C6A53]">
                <Sparkles className="w-3.5 h-3.5" /> Client Fallback Enabled
              </span>
            </p>
            <p className="text-xs text-[#7C6A53]">
              The Supabase connection is active, but the schema tables have not been created yet. We've enabled a high-fidelity local database so the app is fully functional right now. Click on the right to copy the SQL script to initialize your Supabase schema!
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#7C6A53] text-white hover:bg-[#5A4D3F] transition-colors font-medium text-xs shadow-sm cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#A68A64]" />
                <span>Copied Schema!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SQL Setup Script</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-md hover:bg-[#EAE3D9] text-[#7C6A53] transition-colors cursor-pointer"
            title="Dismiss Setup Guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
