"use client";

import Link from "next/link";
import { Tournament } from "@/types";
import { Users, Map, Lock, IndianRupee } from "lucide-react";

export default function TournamentCard({ tournament: t }: { tournament: Tournament }) {
  const percentage = Math.min(((t.currentParticipants || t.participants?.length || 0) / t.maxParticipants) * 100, 100);
  
  return (
    <Link href={`/tournaments/${t.id}`} style={{ textDecoration: "none" }}>
      <div className="bg-[#11141D] border border-gray-800 rounded-2xl overflow-hidden hover:border-[#00F0FF]/50 hover:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all h-full flex flex-col group">
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <span className="bg-[#00F0FF]/10 text-[#00F0FF] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-[#00F0FF]/30">
              {t.gameName.toUpperCase()}
            </span>
            <span className={`text-[10px] font-bold flex items-center gap-1 uppercase ${t.status === 'REGISTRATION_OPEN' ? 'text-green-400' : 'text-gray-500'}`}>
              {t.status === 'REGISTRATION_OPEN' ? <Lock size={12} className="opacity-0" /> : <Lock size={12} />} 
              {t.status.replace(/_/g, ' ')}
            </span>
          </div>
          
          <h3 className="text-xl font-black text-white mb-2 group-hover:text-[#00F0FF] transition-colors">{t.title}</h3>
          <div className="flex items-center gap-4 text-xs text-gray-400 font-semibold mb-6">
            <span className="flex items-center gap-1"><Map size={14} className="text-gray-500"/> {t.map}</span>
            <span className="flex items-center gap-1"><Users size={14} className="text-gray-500"/> {t.teamMode}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6 mt-auto">
            <div className="bg-[#0A0C10] border border-gray-800 p-3 rounded-xl text-center group-hover:border-gray-700 transition-colors">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Entry Fee</p>
              <p className="text-yellow-500 font-black text-lg flex items-center justify-center"><IndianRupee size={16}/> {t.entryFee}</p>
            </div>
            <div className="bg-[#0A0C10] border border-gray-800 p-3 rounded-xl text-center group-hover:border-gray-700 transition-colors">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Prize Pool</p>
              <p className="text-green-400 font-black text-lg flex items-center justify-center"><IndianRupee size={16}/> {t.prizePool}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
              <span>Slots Filled</span>
              <span>{t.currentParticipants || t.participants?.length || 0}/{t.maxParticipants}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-[#00F0FF] transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
