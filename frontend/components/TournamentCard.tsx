"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tournament } from "@/types";
import { Users, MapPin, Clock, Info } from "lucide-react";

interface TournamentCardProps {
  tournament: Tournament;
  onOpenRules?: () => void;
}

export default function TournamentCard({ tournament: t, onOpenRules }: TournamentCardProps) {
  const router = useRouter();
  const currentCount = t.currentParticipants || t.participants?.length || 0;
  const percentage = Math.min((currentCount / (t.maxParticipants || 1)) * 100, 100);
  const isLive = t.status === 'LIVE' || t.status === 'ROOM_CREATED';
  const isClosed = t.status === 'COMPLETED' || t.status === 'CANCELLED';

  const timeValue = t.startTime || t.scheduledAt;
  const matchTime = timeValue 
    ? new Date(timeValue).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Upcoming';

  return (
    <article className="rounded-2xl bg-white border border-brand-borderLight hover:border-brand-indigo/40 p-3.5 transition-all shadow-card-subtle flex flex-col justify-between group">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-brand-indigo font-bold text-[9px] uppercase tracking-wider border border-indigo-100">
            {t.gameName || 'FREE FIRE'}
          </span>
          {isLive ? (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              Room Created • Live
            </span>
          ) : isClosed ? (
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-bold uppercase tracking-wider">
              {t.status.replace(/_/g, ' ')}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Registration Open
            </span>
          )}
        </div>

        {/* Title & Match Info */}
        <div className="mt-2.5">
          <Link href={`/tournaments/${t.id}`}>
            <h4 className="text-sm font-bold text-slate-900 font-gaming flex items-center gap-1 hover:text-brand-indigo transition-colors">
              <span>🔥</span> {t.title}
            </h4>
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 font-medium flex-wrap">
            <span className="flex items-center gap-0.5">
              <span>🗺️</span> {t.map || 'Bermuda'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-0.5">
              <span>👥</span> {t.teamMode || 'Solo'}
            </span>
            <span>•</span>
            <span suppressHydrationWarning className="flex items-center gap-0.5 text-slate-600">
              <Clock size={11} className="text-slate-400" /> {matchTime}
            </span>
          </div>
        </div>

        {/* Entry Fee and Prize Pool Cards */}
        <div className="grid grid-cols-2 gap-2 mt-2.5">
          <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">ENTRY FEE</span>
            <span className="text-base font-black text-amber-600 font-gaming block leading-tight">₹{t.entryFee}</span>
          </div>
          <div className="bg-emerald-50/60 p-2 rounded-xl text-center border border-emerald-100">
            <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wide">PRIZE POOL</span>
            <span className="text-base font-black text-emerald-600 font-gaming block leading-tight">₹{t.prizePool}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Actions */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 mb-1">
          <span>Slots Filled</span>
          <span className="text-brand-indigo font-bold">{currentCount} / {t.maxParticipants}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-brand-indigo h-full rounded-full transition-all duration-500" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        
        <div className="flex items-center gap-2 mt-2.5">
          <Link href={`/tournaments/${t.id}`} className="flex-1">
            <button 
              className="w-full py-2 rounded-xl bg-brand-indigo hover:bg-brand-violet text-white font-gaming text-xs font-bold uppercase tracking-wider shadow-sm active:scale-[0.98] transition-all" 
              type="button"
            >
              {isLive ? 'Spectate / Details' : 'Join Tournament'}
            </button>
          </Link>
          
          <button 
            aria-label="View Tournament Rules" 
            onClick={onOpenRules}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors" 
            type="button"
          >
            <Info size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
