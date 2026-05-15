import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './components/AuthContext';
import { Navbar } from './components/UI/Navbar';
import { LoginForm, SignUpForm } from './components/Auth/AuthForms';
import { RiddleGame } from './components/Game/RiddleGame';
import { PuzzleGame } from './components/Game/PuzzleGame';
import { LeaderboardList } from './components/Leaderboard/LeaderboardList';
import { TutorialOverlay } from './components/Tutorial/TutorialOverlay';
import { Brain, Puzzle as PuzzleIcon, Trophy, Sparkles, BookOpen, Loader2 } from 'lucide-react';
import { Howl } from 'howler';

import { getOrGenerateDailyPuzzle, DailyPuzzle } from './services/dailyChallenge';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const { user, loading } = useAuth();
  const [musicStarted, setMusicStarted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('tutorial_seen'));

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('tutorial_seen', 'true');
  };

  const [dailyPuzzle, setDailyPuzzle] = useState<DailyPuzzle | null>(null);

  useEffect(() => {
    const fetchDaily = async () => {
      try {
        const puzzle = await getOrGenerateDailyPuzzle();
        setDailyPuzzle(puzzle);
      } catch (error) {
        console.error("Failed to fetch daily puzzle:", error);
      }
    };
    fetchDaily();

    // Check every minute for the 11:59 PM transition
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 23 && now.getMinutes() === 59) {
        fetchDaily();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const [puzzleMode, setPuzzleMode] = useState<'standard' | 'daily'>('standard');

  const startDaily = () => {
    setPuzzleMode('daily');
    setCurrentPage('puzzles');
  };

  const startStandardRiddle = () => {
    setCurrentPage('riddles');
  };

  const startStandardPuzzle = () => {
    setPuzzleMode('standard');
    setCurrentPage('puzzles');
  };

  useEffect(() => {
    // Simple ambient loop - using a public asset URL
    const sound = new Howl({
      src: ['https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3'],
      loop: true,
      volume: 0.1,
    });

    if (musicStarted) {
      sound.play();
    }

    return () => {
      sound.stop();
    };
  }, [musicStarted]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="max-w-4xl mx-auto mt-20 text-center px-4 animate-in fade-in slide-in-from-bottom-12 duration-700">
            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight -skew-x-6 transform inline-block px-12 py-4 overflow-visible">
              Confuse Yourself <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">(On Purpose)</span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed font-bold -skew-x-12 transform px-12 py-4 inline-block overflow-visible">
               Simple ≠ Easy
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={startStandardRiddle}
                className="group card-pastel p-10 hover:bg-pink-50 transition-all border-b-4 border-pink-200 text-left relative overflow-hidden"
              >
                <div className="absolute top-[-20%] right-[-10%] opacity-10 group-hover:opacity-20 transition-opacity">
                  <Brain className="w-48 h-48 text-pink-500 rotate-12" />
                </div>
                <Brain className="w-12 h-12 text-pink-500 mb-4" />
                <h3 className="text-2xl font-bold mb-2">The Riddle Vault</h3>
                <p className="text-slate-500">From silly dad jokes to mind-bending logic. Adjustable for all ages.</p>
              </button>

              <button 
                onClick={startStandardPuzzle}
                className="group card-pastel p-10 hover:bg-blue-50 transition-all border-b-4 border-blue-200 text-left relative overflow-hidden"
              >
                <div className="absolute top-[-20%] right-[-10%] opacity-10 group-hover:opacity-20 transition-opacity">
                  <PuzzleIcon className="w-48 h-48 text-blue-500 -rotate-12" />
                </div>
                <PuzzleIcon className="w-12 h-12 text-blue-500 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Puzzle Playground</h3>
                <p className="text-slate-500">Upload your own memories and piece them back together. 3x3 to 10x10.</p>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
              <div className="md:col-span-2 card-pastel p-10 border-none bg-gradient-to-br from-blue-100 via-indigo-50 to-pink-100 flex flex-col md:flex-row items-center gap-12 group/daily-puzzle">
                <div className="w-48 h-48 rounded-3xl overflow-hidden shadow-2xl transform group-hover/daily-puzzle:-rotate-3 transition-transform duration-500 border-4 border-white">
                  {dailyPuzzle?.imageUrl ? (
                    <img src={dailyPuzzle.imageUrl} alt="Daily" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-200 animate-pulse" />
                  )}
                </div>
                <div className="text-center md:text-left flex-1">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] bg-white px-4 py-1.5 rounded-full shadow-sm">Daily Holiday Puzzle</span>
                    {dailyPuzzle?.holidayName && (
                      <span className="text-[10px] font-black text-pink-600 uppercase tracking-[0.3em] bg-white px-4 py-1.5 rounded-full shadow-sm flex items-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        {dailyPuzzle.holidayName}
                      </span>
                    )}
                  </div>
                  <h4 className="text-4xl font-black text-purple-dark uppercase italic tracking-tighter leading-none">
                    Today's Masterpiece
                  </h4>
                  <p className="text-sm text-slate-600 mt-4 font-bold leading-relaxed max-w-lg">
                    A special puzzle featuring a holiday near today. Complete it before the 11:59 PM reset to claim your spot in the legends of {dailyPuzzle?.holidayName || 'the season'}.
                  </p>
                  <button 
                    onClick={startDaily}
                    className="mt-8 btn-primary bg-blue-accent px-12 py-4 text-xs shadow-xl shadow-blue-200 transform group-hover/daily-puzzle:scale-105 transition-all"
                  >
                    Piece Together the Magic
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-12 flex justify-center gap-8 text-slate-400 font-medium">
              <div className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI Powered</div>
              <div className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Educational</div>
              <div className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Global Rank</div>
            </div>

            {!musicStarted && (
              <button 
                onClick={() => setMusicStarted(true)}
                className="mt-12 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Enable background music 🎵
              </button>
            )}
          </div>
        );
      case 'riddles': return <RiddleGame />;
      case 'puzzles': return <PuzzleGame initialImage={puzzleMode === 'daily' ? dailyPuzzle?.imageUrl : undefined} />;
      case 'leaderboard': return <LeaderboardList />;
      case 'login': return <LoginForm onToggle={() => setCurrentPage('signup')} onSuccess={() => setCurrentPage('home')} />;
      case 'signup': return <SignUpForm onToggle={() => setCurrentPage('login')} onSuccess={() => setCurrentPage('home')} />;
      case 'profile': return (
        <div className="max-w-md mx-auto mt-20 card-pastel text-center p-12">
          <div className="w-20 h-20 bg-blue-pastel rounded-full mx-auto mb-6 flex items-center justify-center">
             <Trophy className="w-10 h-10 text-blue-800" />
          </div>
          <h2 className="text-2xl font-bold mb-8">Achievements</h2>
          <p className="text-slate-500 italic mb-8">More stats coming soon! Keep playing to increase your rank.</p>
          <button onClick={() => setCurrentPage('home')} className="btn-secondary w-full">Back to Games</button>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-lavender pb-20">
      <Navbar onNavigate={(page) => {
        if (page === 'puzzles') setPuzzleMode('standard');
        setCurrentPage(page);
      }} currentPage={currentPage} />
      {showTutorial && <TutorialOverlay onClose={handleCloseTutorial} />}
      <main className="pt-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
             <Loader2 className="w-12 h-12 text-pink-400 animate-spin" />
             <p className="text-slate-400 font-medium">Loading your adventure...</p>
          </div>
        ) : renderPage()}
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
