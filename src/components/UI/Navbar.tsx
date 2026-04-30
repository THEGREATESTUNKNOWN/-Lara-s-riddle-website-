import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { auth, signInWithGoogle } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { Brain, Puzzle, Trophy, User, LogOut, LogIn, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const { user, profile } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => signOut(auth);

  const navItems = [
    { id: 'riddles', label: 'Riddles', icon: Brain },
    { id: 'puzzles', label: 'Puzzles', icon: Puzzle },
    { id: 'leaderboard', label: 'Leaderboards', icon: Trophy },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-lg rounded-2xl border border-white/50 shadow-sm px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => onNavigate('home')}
          >
            <div className="w-8 h-8 bg-pink-accent rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-black text-2xl text-purple-dark -skew-x-12 transform inline-block px-8 py-2 overflow-visible">
              Simple ≠ Easy
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3 bg-slate-100/80 px-4 py-2 rounded-full border border-slate-200">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="font-display font-black text-sm tabular-nums text-purple-dark tracking-tighter">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-black uppercase tracking-widest transition-all hover:text-pink-500",
                currentPage === item.id ? "text-pink-500 border-b-2 border-pink-500" : "text-purple-dark/60"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onNavigate('profile')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-blue-pastel flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-700" />
                </div>
                <span className="text-sm font-medium">{profile?.username || 'User'}</span>
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-xl hover:bg-red-50 text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onNavigate('login')}
                className="text-sm font-medium px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Login
              </button>
              <button 
                onClick={() => onNavigate('signup')}
                className="btn-primary text-sm"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
