/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BarChart3, Target, Sparkles, MessageSquare, Loader2, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { chatWithAgent } from './services/ai';
import { DataChart } from './components/DataChart';
import { ProfileCard } from './components/ProfileCard';
import { BehavioralCurve } from './components/BehavioralCurve';

export interface ProfileData {
  name: string;
  age: string;
  income: string;
  location?: string;
  description: string;
  whyThisSegment?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  charts?: any[];
  profiles?: ProfileData[];
  chart?: any; // To support old examples
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      text: "Marhba bik! 👋 Je suis **AAM BEJI**  votre expert à marché Tunsi.\n\nPosez-moi vos questions en **français**, **darija** ou **anglais** et je génère pour vous :\n- 📊 **Visualisations** multi-dimensions\n- 🎯 **Segmentation** des consommateurs\n- 🔮 **Prédictions** de canaux marketing\n- 📖 **Storytelling** data-driven\n\n*Yalla, chnowa t7eb ta3ref?*"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurve, setShowCurve] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const modelMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: modelMessageId, role: 'model', text: '' }]);

    const historyForAi = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    await chatWithAgent(userMessage.text, historyForAi, (text, toolCall) => {
      setMessages((prev) => 
        prev.map((msg) => {
          if (msg.id === modelMessageId) {
            return {
              ...msg,
              text,
              charts: toolCall?.charts || msg.charts,
              profiles: toolCall?.profiles || msg.profiles,
            };
          }
          return msg;
        })
      );
    });

    setIsLoading(false);
  };

  const suggestions = [
    { icon: <BarChart3 className="w-4 h-4" />, text: "شكون يشري Boga Cidre و كيفاش نوصلوهم ؟" },
    { icon: <TrendingUp className="w-4 h-4" />, text: "Kifech yetbadel comportement d'achat mta3 Tounsens fi Sif vs Romdhan?" },
    { icon: <Sparkles className="w-4 h-4" />, text: "Quels sont les points de friction majeurs pour les acheteurs en ligne ?" },
    { icon: <Target className="w-4 h-4" />, text: "Analyse la fidélité et la satisfaction selon les régions" }
  ];

  return (
    <div className="flex flex-col h-screen text-[#1C1C1C] font-sans overflow-hidden bg-[#FAF9F6]">
      <nav className="px-6 md:px-10 py-4 flex shrink-0 justify-between items-center border-b border-[#1C1C1C]/10 bg-white">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="AAM BEJI Logo" className="w-8 h-8 object-contain" />
          <div className="text-xl font-serif font-black tracking-tighter">
            AAM<span className="text-[#C4342D]">.</span>BEJI
          </div>
        </div>
        <div className="hidden md:flex gap-8 text-[10px] uppercase tracking-widest font-bold">
          <span className="opacity-100 border-b-2 border-[#C4342D] pb-1 text-[#C4342D]">Tableau de Bord</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#1C1C1C] flex items-center justify-center text-[10px] font-bold shrink-0 text-white">
          MA
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-[#1C1C1C]/10 p-6 hidden lg:flex flex-col gap-4 shrink-0 bg-white">
          <div className="rounded-xl bg-gradient-to-br from-[#C4342D]/10 to-[#E85D04]/5 p-4 border border-[#C4342D]/10">
            <div className="text-[9px] uppercase tracking-widest font-black text-[#C4342D] mb-2">🇹🇳 Intelligence Tunisienne</div>
            <p className="font-serif italic text-sm leading-snug text-[#1C1C1C]/80">
              Analyse avancée du marché B2B tunisien avec segmentation IA et storytelling culturel.
            </p>
          </div>

          <div className="mt-2">
            <h2 className="text-[9px] font-bold uppercase tracking-widest mb-3 opacity-40">Essayez ces questions</h2>
            <ul className="space-y-2">
              {suggestions.map((s, i) => (
                <li 
                  key={i} 
                  onClick={() => { setInput(s.text); }}
                  className="flex items-start gap-2.5 cursor-pointer group p-2 rounded-lg hover:bg-[#FAF9F6] transition-colors"
                >
                  <span className="mt-0.5 opacity-30 group-hover:opacity-100 group-hover:text-[#C4342D] transition-all">{s.icon}</span>
                  <span className="text-[11px] leading-relaxed group-hover:text-[#C4342D] transition-colors">{s.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto pt-4 border-t border-[#1C1C1C]/5">
            <div className="flex items-center gap-2 text-[9px] uppercase tracking-wider opacity-30">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Backend connecté · ML actif
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <section className="flex-1 p-0 md:px-10 flex flex-col relative overflow-hidden bg-[#FAF9F6] lg:border-l lg:border-[#1C1C1C]/5">
           <div className="flex-1 overflow-y-auto px-6 py-10 md:px-0 scroll-smooth pb-12">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="flex items-end justify-between border-b-2 border-[#1C1C1C] pb-6 mb-6 hidden md:flex">
                <h1 className="text-5xl font-serif italic leading-none">L'Horizon Tunisien</h1>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowCurve(!showCurve)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      showCurve
                        ? 'bg-[#C4342D] text-white shadow-md'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Analyse Annuelle
                    {showCurve ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold">Rapport d'Audience v.4.0</p>
                    <p className="font-serif text-sm opacity-60">Génération d'insights en temps réel</p>
                  </div>
                </div>
              </div>

              {/* Behavioral Curve Section */}
              <AnimatePresence>
                {showCurve && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    className="mb-10 overflow-hidden"
                  >
                    <BehavioralCurve />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div 
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }} 
                  className={`flex gap-6 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'model' && (
                    <div className="w-10 h-10 rounded-full border border-[#1C1C1C]/20 flex items-center justify-center shrink-0 bg-white">
                      <Bot className="w-5 h-5 text-[#C4342D]" />
                    </div>
                  )}
                  
                  <div className={`flex flex-col gap-3 max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {message.text && (
                      <div 
                        className={message.role === 'user' 
                            ? 'text-2xl font-serif italic text-right' 
                            : 'text-sm'
                        }
                      >
                        {message.role === 'user' ? (
                          <p className="leading-snug">"{message.text}"</p>
                        ) : (
                          <div className="markdown-body text-base">
                            <Markdown>{message.text}</Markdown>
                          </div>
                        )}
                      </div>
                    )}

                    {message.chart && (
                      <div className="w-full mt-4">
                        <DataChart 
                          type={message.chart.type} 
                          title={message.chart.title} 
                          data={message.chart.data} 
                          xAxisLabel={message.chart.xAxisLabel}
                          yAxisLabel={message.chart.yAxisLabel}
                        />
                      </div>
                    )}

                    {message.profiles && message.profiles.length > 0 && (
                      <div className="w-full mt-4 flex flex-col gap-4">
                        {message.profiles.map((profile, idx) => (
                           <ProfileCard
                             key={`profile-${message.id}-${idx}`}
                             name={profile.name}
                             age={profile.age}
                             income={profile.income}
                             location={profile.location}
                             description={profile.description}
                             whyThisSegment={profile.whyThisSegment}
                           />
                        ))}
                      </div>
                    )}

                    {message.charts && message.charts.length > 0 && (
                      <div className="w-full mt-4 flex flex-col gap-4">
                        {message.charts.map((chart, idx) => (
                          <DataChart 
                            key={`charts-${message.id}-${idx}`}
                            type={chart.type} 
                            title={chart.title} 
                            data={chart.data} 
                            xAxisLabel={chart.xAxisLabel}
                            yAxisLabel={chart.yAxisLabel}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                   {message.role === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-[#1C1C1C] flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
              </AnimatePresence>
              
              <AnimatePresence>
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex gap-6 justify-start"
                >
                   <div className="w-10 h-10 rounded-full border border-[#1C1C1C]/20 flex items-center justify-center shrink-0 bg-white">
                      <Loader2 className="w-5 h-5 text-[#C4342D] animate-spin" />
                    </div>
                    <div className="flex items-center gap-2 pt-3">
                       <span className="w-2 h-2 rounded-full bg-[#1C1C1C]/60 animate-bounce"></span>
                       <span className="w-2 h-2 rounded-full bg-[#1C1C1C]/60 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                       <span className="w-2 h-2 rounded-full bg-[#C4342D]/80 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                </motion.div>
              )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </div>
        </section>
      </main>

      {/* Interaction Bar */}
      <footer className="px-6 md:px-10 py-4 bg-white border-t border-[#1C1C1C]/10 shrink-0 z-10 w-full">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question... (français, darija ou anglais)"
              className="w-full bg-[#FAF9F6] rounded-xl px-4 py-3 text-sm placeholder:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#C4342D]/30 border border-[#1C1C1C]/10 transition-all"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-[#C4342D] text-white flex items-center justify-center disabled:opacity-30 hover:bg-[#A82B25] transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
}
