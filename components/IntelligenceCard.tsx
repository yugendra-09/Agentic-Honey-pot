
import React from 'react';
import { Intelligence } from '../types';
import { CreditCard, Link as LinkIcon, Smartphone, Wallet } from 'lucide-react';

interface Props {
  data: Intelligence;
}

export const IntelligenceCard: React.FC<Props> = ({ data }) => {
  const sections = [
    { label: 'Bank Accounts', icon: CreditCard, items: data.bank_accounts, color: 'text-blue-400' },
    { label: 'UPI IDs', icon: Wallet, iconColor: 'text-green-400', items: data.upi_ids, color: 'text-green-400' },
    { label: 'Phishing Links', icon: LinkIcon, items: data.phishing_urls, color: 'text-red-400' },
    { label: 'Phone Numbers', icon: Smartphone, items: data.phone_numbers, color: 'text-yellow-400' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sections.map((sec) => (
        <div key={sec.label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 transition-all hover:bg-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <sec.icon className={`w-5 h-5 ${sec.color}`} />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-400">{sec.label}</h3>
          </div>
          <div className="space-y-2">
            {sec.items.length > 0 ? (
              sec.items.map((item, idx) => (
                <div key={idx} className="mono text-sm bg-slate-900 px-3 py-2 rounded border border-slate-800 text-slate-300 break-all">
                  {item}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic">No data extracted yet...</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
