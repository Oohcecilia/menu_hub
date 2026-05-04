import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVIPAuth } from '@/lib/VIPAuthContext.jsx';
import VIPLogin from './VIPLogin.jsx';

export default function VIPIndex() {
  const { vipUser, loading } = useVIPAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && vipUser) navigate('/vip/dashboard');
  }, [vipUser, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-stone-800 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <VIPLogin />;
}