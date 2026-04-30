import React, { useEffect, useState, useMemo } from 'react';
import { getLeaderboard } from '../../services/firebase';
import { Trophy, Medal, Brain, Puzzle, Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

// Mock data to ensure the leaderboard is never empty and looks "legendary"
const MOCK_RIDDLE_LEGENDS = [
  { username: "IDMKYSGKLRSOTENVEBF", score: 470243, timestamp: { seconds: 1772582400 } }, // 03/04/2026
  { username: "67674141SMARTYPANTS", score: 167670, timestamp: { seconds: 1749254400 } }, // 06/07/2025
  { username: "PuzzleMaster99", score: 12500, timestamp: { seconds: Date.now() / 1000 - 86400 } },
  { username: "LogicWizard", score: 11200, timestamp: { seconds: Date.now() / 1000 - 172800 } },
  { username: "RiddleSphinx", score: 10800, timestamp: { seconds: Date.now() / 1000 - 259200 } },
  { username: "EnigmaQueen", score: 9500, timestamp: { seconds: Date.now() / 1000 - 345600 } },
  { username: "BrainyBee", score: 8900, timestamp: { seconds: Date.now() / 1000 - 432000 } },
  { username: "MindBender", score: 7600, timestamp: { seconds: Date.now() / 1000 - 518400 } },
  { username: "TheGreatUnknown", score: 5400, timestamp: { seconds: Date.now() / 1000 - 604800 } },
];

const MOCK_PUZZLE_LEGENDS = [
  { username: "SpeedCuber", score: 15.4, timestamp: { seconds: Date.now() / 1000 - 50000 }, time: 15.4 },
  { username: "FrameFixer", score: 22.8, timestamp: { seconds: Date.now() / 1000 - 120000 }, time: 22.8 },
  { username: "JigsawGenius", score: 34.2, timestamp: { seconds: Date.now() / 1000 - 200000 }, time: 34.2 },
  { username: "PixelPerfect", score: 45.1, timestamp: { seconds: Date.now() / 1000 - 300000 }, time: 45.1 },
  { username: "PieceMaker", score: 56.7, timestamp: { seconds: Date.now() / 1000 - 400000 }, time: 56.7 },
];

export function LeaderboardList() {
  const [type, setType] = useState<'riddle' | 'puzzle'>('riddle');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getLeaderboard(type);
        // Combine real data with mock data if needed, or just show mock if empty
        const baseMock = type === 'riddle' ? MOCK_RIDDLE_LEGENDS : MOCK_PUZZLE_LEGENDS;
        
        // Remove duplicates if the same user exists in mock and real
        const realUsernames = new Set(data.map(d => d.username));
        const combined = [...data, ...baseMock.filter(m => !realUsernames.has(m.username))];
        
        // Sort: Descending for riddles (points), Ascending for puzzles (time)
        const sorted = combined.sort((a, b) => type === 'riddle' ? b.score - a.score : a.score - b.score);
        
        setEntries(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [type]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    return entries.filter(entry => 
      entry.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [entries, searchQuery]);

  return (
    <div className="max-w-2xl mx-auto mt-12 px-4 animate-in fade-in slide-in-from-bottom-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-3 bg-slate-100/80 p-1.5 rounded-full border border-slate-200">
          <button 
            onClick={() => { setType('riddle'); setSearchQuery(""); }}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all",
              type === 'riddle' ? "bg-white text-pink-accent shadow-sm" : "hover:bg-white/50 text-slate-500"
            )}
          >
            <Brain className="w-4 h-4" />
            Riddles
          </button>
          <button 
            onClick={() => { setType('puzzle'); setSearchQuery(""); }}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all",
              type === 'puzzle' ? "bg-white text-blue-accent shadow-sm" : "hover:bg-white/50 text-slate-500"
            )}
          >
            <Puzzle className="w-4 h-4" />
            Puzzles
          </button>
        </div>

        <div className="relative w-full md:w-64 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-pink-accent transition-colors" />
          <input 
            type="text"
            placeholder="Search legends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-pink-accent focus:outline-none font-black text-sm text-purple-dark placeholder:text-slate-300 transition-all shadow-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      <div className="main-canvas p-0 overflow-hidden border-2 border-purple-dark/5 shadow-xl">
        <div className="bg-purple-dark/5 px-8 py-5 border-b border-purple-dark/10 flex justify-between text-[10px] font-black text-purple-dark/40 uppercase tracking-[0.2em]">
          <span>Hall of Fame</span>
          <span>{type === 'riddle' ? 'Points' : 'Record Time'}</span>
        </div>
        
        {loading ? (
          <div className="p-16 text-center text-purple-dark/30 font-black uppercase tracking-widest animate-pulse">Warping data...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <span className="text-slate-400 font-black uppercase tracking-widest text-sm">
              No results for "{searchQuery}"
            </span>
          </div>
        ) : (
          <div className="divide-y divide-purple-dark/5">
            {filteredEntries.map((entry, index) => (
              <div key={`${entry.username}-${index}`} className="px-8 py-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transform group-hover:scale-110 transition-transform duration-300",
                    index === 0 ? "bg-yellow-400 text-white shadow-lg shadow-yellow-100" :
                    index === 1 ? "bg-slate-300 text-white shadow-lg shadow-slate-100" :
                    index === 2 ? "bg-amber-600 text-white shadow-lg shadow-amber-100" :
                    "bg-white border-2 border-slate-100 text-slate-400"
                  )}>
                    {index === 0 ? "1" :
                     index === 1 ? "2" :
                     index === 2 ? "3" :
                     index + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-purple-dark uppercase tracking-tight group-hover:text-pink-accent transition-colors">
                      {entry.username}
                    </span>
                    <span className="text-[10px] font-bold text-purple-dark/40 uppercase tracking-widest">
                      {entry.timestamp?.seconds ? new Date(entry.timestamp.seconds * 1000).toLocaleDateString() : 'Legendary Entry'}
                    </span>
                  </div>
                </div>
                <div className={cn(
                  "text-3xl font-black tabular-nums tracking-tighter italic",
                  type === 'riddle' ? "text-pink-accent" : "text-blue-accent"
                )}>
                  {type === 'riddle' 
                    ? entry.score.toLocaleString() 
                    : `${entry.score.toFixed(1)}s`
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <p className="mt-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-50">
        Top scores are updated in real-time
      </p>
    </div>
  );
}
