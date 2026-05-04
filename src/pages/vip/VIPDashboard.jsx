import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Crown, LogOut, MapPin, Phone, Clock, Star, Zap, ExternalLink
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useVIPAuth } from '@/lib/VIPAuthContext.jsx';

// QR Code generator
function MemberQRCode({ value, size = 180 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const modules = generateGrid(value);
    const n = modules.length;
    const cell = size / n;

    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#f59e0b';

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (modules[r][c]) {
          const x = c * cell + 0.5;
          const y = r * cell + 0.5;
          const w = cell - 1;
          const h = cell - 1;
          const rad = cell * 0.12;

          ctx.beginPath();
          ctx.moveTo(x + rad, y);
          ctx.lineTo(x + w - rad, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
          ctx.lineTo(x + w, y + h - rad);
          ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
          ctx.lineTo(x + rad, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
          ctx.lineTo(x, y + rad);
          ctx.quadraticCurveTo(x, y, x + rad, y);
          ctx.fill();
        }
      }
    }
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-2xl" />;
}

// simple QR grid (unchanged)
function generateGrid(text) {
  const S = 25;
  const g = Array.from({ length: S }, () => Array(S).fill(false));
  const bytes = [...text].map(c => c.charCodeAt(0));
  let di = 0;

  for (let r = 0; r < S; r++) {
    for (let c = 0; c < S; c++) {
      g[r][c] = (bytes[(di++) % bytes.length] + r + c) % 2 === 0;
    }
  }
  return g;
}

const TIER_CONFIG = {
  bronze: { label: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30', stars: 1 },
  silver: { label: 'Silver', color: 'text-slate-300', bg: 'bg-slate-300/10 border-slate-300/30', stars: 2 },
  gold: { label: 'Gold', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30', stars: 3 },
  platinum: { label: 'Platinum', color: 'text-cyan-300', bg: 'bg-cyan-300/10 border-cyan-300/30', stars: 4 },
};

// ✅ STATIC BRANCHES (NO API)
const STATIC_BRANCHES = [
  {
    name: "Main Branch - Cebu",
    address: "Cebu City, Philippines",
    phone: "+63 912 345 6789",
    hours: "10:00 AM - 10:00 PM",
  },
  {
    name: "Ayala Center Branch",
    address: "Ayala Center Cebu",
    phone: "+63 987 654 3210",
    hours: "10:00 AM - 9:00 PM",
  },
  {
    name: "IT Park Branch",
    address: "Cebu IT Park",
    phone: "+63 900 111 2222",
    hours: "11:00 AM - 11:00 PM",
  },
];

export default function VIPDashboard() {
  const { vipUser, logout } = useVIPAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!vipUser) navigate('/vip');
  }, [vipUser, navigate]);

  if (!vipUser) return null;

  const tier = TIER_CONFIG[vipUser.membership_tier] || TIER_CONFIG.bronze;
  const qrValue = `VIP:${vipUser.user_email}:${vipUser.id}`;

  const handleLogout = () => {
    logout();
    navigate('/vip');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950">

      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-stone-950/70 border-b border-white/8">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Crown className="h-5 w-5 text-amber-400" />
            <span className="font-serif font-bold text-white text-base">VIP Members</span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/" className="text-stone-400 hover:text-white text-xs">← Menu</Link>
            <button onClick={handleLogout} className="text-stone-400 hover:text-white text-xs flex items-center gap-1.5">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 pb-16">

        {/* VIP CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-stone-800 via-stone-900 to-amber-950 border border-white/10 p-6 shadow-2xl"
        >
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-amber-400/5 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-amber-400/8 blur-xl" />

          <div className="relative z-10 flex justify-between mb-6">
            <div>
              <p className="text-stone-500 text-xs uppercase">Member</p>
              <h2 className="text-2xl font-serif text-white font-bold">{vipUser.full_name}</h2>
              <p className="text-stone-400 text-sm">{vipUser.user_email}</p>
            </div>

            <div className={`px-3 py-1.5 rounded-full border text-xs font-bold ${tier.bg} ${tier.color}`}>
              <Crown className="h-3 w-3 inline mr-1" />
              {tier.label}
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-stone-500 text-xs">Points</p>
              <p className="text-3xl text-amber-400 font-bold">{vipUser.points || 0}</p>

              <div className="flex gap-0.5 mt-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < tier.stars ? 'text-amber-400 fill-amber-400' : 'text-stone-700'}`} />
                ))}
              </div>
            </div>

            <MemberQRCode value={qrValue} size={100} />
          </div>
        </motion.div>

        {/* BRANCHES (STATIC WORKING) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h3 className="text-white font-serif text-lg font-semibold">
            Our Branches
          </h3>

          {STATIC_BRANCHES.map((branch, i) => (
            <motion.div
              key={branch.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-stone-900/60 border border-white/10 rounded-2xl p-4 space-y-2"
            >
              <p className="text-white font-semibold">{branch.name}</p>

              <div className="text-stone-400 text-xs flex items-center gap-2">
                <MapPin className="h-3 w-3" /> {branch.address}
              </div>

              <div className="text-stone-400 text-xs flex items-center gap-2">
                <Phone className="h-3 w-3" /> {branch.phone}
              </div>

              <div className="text-stone-400 text-xs flex items-center gap-2">
                <Clock className="h-3 w-3" /> {branch.hours}
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}