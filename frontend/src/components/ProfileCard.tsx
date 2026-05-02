import React from 'react';
import { UserCircle2, Wallet, CalendarRange, MapPin, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileProps {
  name: string;
  age: string;
  income: string;
  location?: string;
  description: string;
  whyThisSegment?: string; // Nouvelle propriété pour la raison
}

export function ProfileCard({ name, age, income, location, description, whyThisSegment }: ProfileProps) {
  // Extract percentage from name if present
  const percentMatch = name.match(/(\d+\.?\d*)%/);
  const percentage = percentMatch ? percentMatch[1] : null;
  const cleanName = name.replace(/\s*\(.*?\)\s*$/, '').trim();
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 p-6 relative overflow-hidden my-4 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#C4342D]/5 to-transparent rounded-bl-full" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C4342D] to-[#8B2820] flex items-center justify-center shrink-0 shadow-sm">
              <UserCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-serif text-xl font-bold text-[#1C1C1C] mb-1 leading-tight">{cleanName}</h4>
              {percentage && (
                <div className="flex items-center gap-2 text-[#C4342D]">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-sm font-bold">{percentage}% de la population</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="flex items-center gap-2 bg-white/80 rounded px-3 py-2 border border-gray-100">
            <CalendarRange className="w-4 h-4 text-[#C4342D]" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Âge</span>
              <span className="text-sm font-semibold text-[#1C1C1C]">{age}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white/80 rounded px-3 py-2 border border-gray-100">
            <Wallet className="w-4 h-4 text-[#C4342D]" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Revenu</span>
              <span className="text-sm font-semibold text-[#1C1C1C]">{income}</span>
            </div>
          </div>
          
          {location && (
            <div className="flex items-center gap-2 bg-white/80 rounded px-3 py-2 border border-gray-100">
              <MapPin className="w-4 h-4 text-[#C4342D]" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500">Localisation</span>
                <span className="text-sm font-semibold text-[#1C1C1C]">{location}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-white border-l-2 border-[#C4342D] pl-4 pr-3 py-3 rounded-r-sm">
          <p className="text-sm text-gray-700 leading-relaxed m-0">{description}</p>
        </div>

        {whyThisSegment && (
          <div className="mt-3 bg-gradient-to-r from-amber-50 to-white border-l-2 border-amber-500 pl-4 pr-3 py-3 rounded-r-sm">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[9px] uppercase tracking-wider font-bold text-amber-700 block mb-1">Pourquoi ce segment ?</span>
                <p className="text-sm text-gray-700 leading-relaxed m-0">{whyThisSegment}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
