import React, { useState } from 'react';
import { HelpCircle, X, ChevronRight, Brain, Puzzle as PuzzleIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STEPS = [
  {
    title: "Welcome to PastelQuest!",
    content: "A gentle space to train your brain through riddles and puzzles.",
    icon: <HelpCircle className="w-8 h-8 text-pink-400" />
  },
  {
    title: "The Riddle Realm",
    content: "Choose your difficulty and type. Correct answers boost your score. 3 wrong attempts reveals the answer but resets your streak!",
    icon: <Brain className="w-8 h-8 text-purple-400" />
  },
  {
    title: "Puzzle Playground",
    content: "Upload any image and slice it up. Drag pieces to swap them. Use the AI Assistant if you get stuck!",
    icon: <PuzzleIcon className="w-8 h-8 text-blue-400" />
  }
];

export function TutorialOverlay({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card-pastel max-w-sm w-full p-8 relative overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        <div className="mb-6 flex justify-center">
          {STEPS[step].icon}
        </div>

        <h3 className="text-2xl font-bold text-center mb-4">{STEPS[step].title}</h3>
        <p className="text-slate-600 text-center mb-8">{STEPS[step].content}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-pink-400' : 'bg-slate-200'}`}
              />
            ))}
          </div>
          
          <button 
            onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : onClose()}
            className="btn-primary flex items-center gap-1.5"
          >
            {step === STEPS.length - 1 ? "Start Adventure" : "Next"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
