import React, { useState, useEffect, useRef } from 'react';
import { generateRiddle, Riddle } from '../../services/gemini';
import { updateHighScore } from '../../services/firebase';
import { useAuth } from '../AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Timer, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw, 
  Lightbulb,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { cn, formatTime } from '../../lib/utils';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

const RIDDLE_TYPES = [
  "Dad Jokes",
  "Logic Puzzles",
  "Classic Riddles",
  "Wordplay",
  "Abstract Thinking"
];

const AGE_GROUPS = ["Kids", "Adults", "Seniors"];
const DIFFICULTIES = ["Easy", "Medium", "Hard", "Expert"];

export function RiddleGame() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    type: RIDDLE_TYPES[0],
    ageGroup: AGE_GROUPS[1],
    difficulty: DIFFICULTIES[0],
  });
  
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'result'>('setup');
  const [currentRiddle, setCurrentRiddle] = useState<Riddle | null>(null);
  const [nextRiddle, setNextRiddle] = useState<Riddle | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const prefetchRiddle = async () => {
    try {
      const riddle = await generateRiddle(settings.type, settings.ageGroup, settings.difficulty);
      setNextRiddle(riddle);
    } catch (e) {
      console.error("Prefetch failed", e);
    }
  };

  const startNewRiddle = async () => {
    setShowHint(false);
    setShowAnswer(false);
    setUserAnswer('');
    setAttempts(0);

    if (nextRiddle) {
      setCurrentRiddle(nextRiddle);
      setGameState('playing');
      setTimeLeft(60);
      setNextRiddle(null);
      prefetchRiddle(); // Start getting the one after this
    } else {
      setLoading(true);
      try {
        const riddle = await generateRiddle(settings.type, settings.ageGroup, settings.difficulty);
        setCurrentRiddle(riddle);
        setGameState('playing');
        setTimeLeft(60);
        prefetchRiddle(); // Background fetch next one
      } catch (error) {
        toast.error("Failed to generate riddle. Try again!");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft]);

  const handleTimeout = () => {
    toast.error("Time's up!");
    setGameState('result');
    if (user?.uid) updateHighScore(user.uid, 'riddle', score);
  };

  const checkAnswer = () => {
    if (!currentRiddle) return;
    
    const isCorrect = userAnswer.toLowerCase().trim().includes(currentRiddle.answer.toLowerCase().trim()) || 
                      currentRiddle.answer.toLowerCase().trim().includes(userAnswer.toLowerCase().trim());

    if (isCorrect) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E6E6FA', '#FFB6C1', '#ADD8E6']
      });
      toast.success("Correct!");
      const points = timeLeft * (DIFFICULTIES.indexOf(settings.difficulty) + 1);
      setScore(prev => prev + points);
      
      // Auto increase difficulty if on a roll
      if (score > 500 && settings.difficulty === "Easy") setSettings(s => ({...s, difficulty: "Medium"}));
      if (score > 1500 && settings.difficulty === "Medium") setSettings(s => ({...s, difficulty: "Hard"}));
      
      startNewRiddle();
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= 3) {
        setShowAnswer(true);
        toast.error("3 attempts failed! See the answer below.");
      } else {
        toast.error(`Wrong! Hint: ${currentRiddle.hint}`);
      }
    }
  };

  if (gameState === 'setup') {
    return (
      <div className="card-pastel max-w-2xl mx-auto mt-12 animate-in fade-in zoom-in-95 border-8 border-pink-50">
        <h2 className="text-5xl font-black mb-10 text-center text-purple-dark italic tracking-tighter uppercase">
          Game Configuration
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-pink-500">Riddle Type</label>
            <select 
              className="w-full bg-blue-50 border-none rounded-2xl px-4 py-4 text-sm font-black uppercase tracking-widest text-purple-dark appearance-none cursor-pointer hover:bg-blue-100 transition-colors"
              value={settings.type}
              onChange={(e) => setSettings({...settings, type: e.target.value})}
            >
              {RIDDLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-pink-500">Age Group</label>
            <select 
              className="w-full bg-blue-50 border-none rounded-2xl px-4 py-4 text-sm font-black uppercase tracking-widest text-purple-dark appearance-none cursor-pointer hover:bg-blue-100 transition-colors"
              value={settings.ageGroup}
              onChange={(e) => setSettings({...settings, ageGroup: e.target.value})}
            >
              {AGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1 text-pink-500">Difficulty</label>
            <select 
              className="w-full bg-blue-50 border-none rounded-2xl px-4 py-4 text-sm font-black uppercase tracking-widest text-purple-dark appearance-none cursor-pointer hover:bg-blue-100 transition-colors"
              value={settings.difficulty}
              onChange={(e) => setSettings({...settings, difficulty: e.target.value})}
            >
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <button 
          onClick={startNewRiddle}
          className="w-full btn-primary py-6 text-base font-black flex items-center justify-center gap-3 group bg-pink-accent hover:scale-[1.02] transition-all"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : (
            <>
              START JOURNEY
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </>
          )}
        </button>
      </div>
    );
  }

  if (gameState === 'result') {
    return (
      <div className="card-pastel max-w-md mx-auto mt-12 text-center animate-in scale-in-95">
        <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
        <div className="text-6xl font-bold text-pink-600 mb-6">{score}</div>
        <p className="text-slate-600 mb-8">Great job! Your brain is getting sharper.</p>
        <button 
          onClick={() => { setGameState('setup'); setScore(0); }}
          className="w-full btn-primary py-3 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 px-4 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-white/80 py-2 px-4 rounded-full border-2 border-blue-accent flex items-center gap-2 shadow-sm">
            <Timer className={cn("w-5 h-5", timeLeft < 10 ? "text-red-500 animate-pulse" : "text-blue-accent")} />
            <span className="font-display font-black text-lg tabular-nums tracking-tighter">{formatTime(timeLeft)}</span>
          </div>
          <div className="bg-pink-accent/10 py-2 px-6 rounded-full border-2 border-pink-accent shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-pink-600 mr-2">Score</span>
            <span className="font-display font-black text-xl text-pink-600">{score}</span>
          </div>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-purple-dark/40">
          Difficulty: <span className="text-pink-500">{settings.difficulty}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentRiddle?.question}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className="main-canvas w-full mb-8 min-h-[300px] flex flex-col justify-center items-center text-center p-12 overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400" />
          <span className="text-blue-accent font-black uppercase tracking-[0.3em] text-xs mb-6">Brain Teaser</span>
          <p className="text-4xl md:text-5xl font-black text-purple-dark leading-tight tracking-tight">
            {currentRiddle?.question}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="w-full space-y-6">
        {showAnswer ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-4"
          >
            <div className="bg-red-50 border-4 border-red-100 rounded-[32px] p-8 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2 block">Correct Answer</span>
              <p className="text-3xl font-black text-red-600 uppercase italic">{currentRiddle?.answer}</p>
            </div>
            <button 
              onClick={startNewRiddle}
              className="w-full btn-secondary py-5 flex items-center justify-center gap-3 bg-white"
            >
              Next Riddle
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        ) : (
          <div className="flex gap-4">
            <input 
              type="text"
              className="flex-1 bg-blue-50 border-4 border-blue-100 rounded-[32px] px-8 py-5 text-2xl font-black text-purple-dark focus:outline-none focus:border-blue-accent transition-all placeholder:text-blue-200"
              placeholder="Type your answer here..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
            />
            <button 
              onClick={checkAnswer}
              className="btn-primary px-12 text-sm"
            >
              Submit
            </button>
          </div>
        )}

        <div className="flex justify-between items-center px-2">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className={cn(
                  "w-3 h-3 rounded-full transition-colors",
                  i <= attempts ? "bg-red-400" : "bg-slate-200"
                )}
              />
            ))}
            <span className="text-xs text-slate-500 font-medium ml-1">Attempts</span>
          </div>
          
          <button 
            onClick={() => setShowHint(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            Need a hint?
          </button>
        </div>

        {showHint && currentRiddle && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="card-pastel bg-blue-50/50 border-blue-100 p-4 text-blue-800 italic"
          >
            Hint: {currentRiddle.hint}
          </motion.div>
        )}
      </div>
    </div>
  );
}
