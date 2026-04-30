import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, createUserProfile, signInWithGoogle } from '../../services/firebase';
import { toast } from 'react-hot-toast';
import { Mail, Lock, User, Chrome, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LoginForm({ onToggle, onSuccess }: { onToggle: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recovery, setRecovery] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (recovery) {
        await sendPasswordResetEmail(auth, email);
        toast.success('Password reset email sent!');
        setRecovery(false);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success('Signed in with Google!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="card-pastel w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-2xl font-bold text-center mb-6">
        {recovery ? 'Reset Password' : 'Welcome Back'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600 ml-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="email"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50/50"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {!recovery && (
          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-medium text-slate-600">Password</label>
              <button 
                type="button"
                onClick={() => setRecovery(true)}
                className="text-xs text-blue-600 hover:underline"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50/50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
        )}

        <button 
          disabled={loading}
          type="submit"
          className="w-full btn-secondary text-base py-3 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (recovery ? 'Send Reset Link' : 'Login')}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      <div className="mt-8 relative text-center">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
        <span className="relative px-4 bg-white text-xs text-slate-400 uppercase tracking-widest font-medium">Or</span>
      </div>

      <button 
        onClick={handleGoogleSignIn}
        className="mt-6 w-full px-4 py-3 rounded-xl border border-slate-200 flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors font-medium text-slate-700"
      >
        <Chrome className="w-5 h-5" />
        Continue with Google
      </button>

      <p className="mt-8 text-center text-sm text-slate-600">
        {recovery ? (
          <button onClick={() => setRecovery(false)} className="text-blue-600 font-semibold hover:underline">
            Back to login
          </button>
        ) : (
          <>
            Don't have an account?{' '}
            <button onClick={onToggle} className="text-pink-600 font-semibold hover:underline">
              Create one
            </button>
          </>
        )}
      </p>
    </div>
  );
}

export function SignUpForm({ onToggle, onSuccess }: { onToggle: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: username });
      await sendEmailVerification(user);
      
      await createUserProfile({
        uid: user.uid,
        username,
        email,
        highScores: { riddle: 0, puzzle: 0 },
        preferences: { theme: 'pastel', volume: 0.5 }
      });

      toast.success('Account created! Please check your email for verification.');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-pastel w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600 ml-1">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-slate-50/50"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600 ml-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="email"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-slate-50/50"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600 ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="password"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-slate-50/50"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button 
          disabled={loading}
          type="submit"
          className="w-full btn-primary text-base py-3 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <button onClick={onToggle} className="text-blue-600 font-semibold hover:underline">
          Login
        </button>
      </p>
    </div>
  );
}
