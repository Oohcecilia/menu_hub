import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useVIPAuth } from '@/lib/VIPAuthContext.jsx';

export default function VIPLogin() {
  const { login } = useVIPAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/vip/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 flex flex-col">
      {/* Back */}
      <div className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-stone-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Menu
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          {/* Crown badge */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-white">VIP Members</h1>
            <p className="text-stone-400 text-sm mt-1">Sign in to your exclusive account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-white placeholder:text-stone-500 text-sm focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 text-white placeholder:text-stone-500 text-sm focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-all"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-stone-500 text-sm mt-6">
            Not a member yet?{' '}
            <Link to="/vip/register" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
              Join VIP
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}