import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useVIPAuth } from '@/lib/VIPAuthContext.jsx';

function Field({ icon: Icon, type = 'text', placeholder, value, onChange, required, rightEl }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 text-white placeholder:text-stone-500 text-sm focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-all"
      />
      {rightEl && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightEl}</div>}
    </div>
  );
}

export default function VIPRegister() {
  const { register } = useVIPAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 4) { setError('Password must be at least 4 characters.'); return; }
    setLoading(true);
    try {
      await register({ full_name: form.full_name, email: form.email, password: form.password, phone: form.phone });
      navigate('/vip/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const eyeBtn = (
    <button type="button" onClick={() => setShowPass(!showPass)} className="text-stone-500 hover:text-stone-300 transition-colors">
      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 flex flex-col">
      <div className="p-6">
        <Link to="/vip" className="inline-flex items-center gap-2 text-stone-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-white">Join VIP</h1>
            <p className="text-stone-400 text-sm mt-1">Create your exclusive membership</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Field icon={User} placeholder="Full name" value={form.full_name} onChange={set('full_name')} required />
            <Field icon={Mail} type="email" placeholder="Email address" value={form.email} onChange={set('email')} required />
            <Field icon={Phone} type="tel" placeholder="Phone number (optional)" value={form.phone} onChange={set('phone')} />
            <Field icon={Lock} type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={set('password')} required rightEl={eyeBtn} />
            <Field icon={Lock} type={showPass ? 'text' : 'password'} placeholder="Confirm password" value={form.confirm} onChange={set('confirm')} required />

            {error && (
              <p className="text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition-colors disabled:opacity-60 mt-1"
            >
              {loading ? 'Creating account…' : 'Create VIP Account'}
            </button>
          </form>

          {/* Perks preview */}
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Member Benefits</p>
            {['Exclusive offers & early access', 'Earn points on every order', 'Priority reservations at all branches', 'Personalized digital VIP card'].map(b => (
              <div key={b} className="flex items-center gap-2 text-xs text-stone-400">
                <div className="h-1 w-1 rounded-full bg-amber-400 flex-shrink-0" />
                {b}
              </div>
            ))}
          </div>

          <p className="text-center text-stone-500 text-sm mt-5">
            Already a member?{' '}
            <Link to="/vip" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}