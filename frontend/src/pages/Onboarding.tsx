import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const Onboarding: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!user) return;
    try {
      setSaving(true);
      setError('');
      if (!firstName.trim() || !lastName.trim()) {
        setError('First name and Last name are required.');
        setSaving(false);
        return;
      }
      await user.update({ firstName, lastName });
      navigate('/select-role', { replace: true });
    } catch (e: any) {
      setError(e?.message || 'Failed to save details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[100svh] w-full flex items-center justify-center bg-[#070f2b] px-4 py-10">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-4 text-center">Tell us about you</h1>
        {error && <div className="text-red-400 text-sm mb-3 text-center">{error}</div>}
        <label className="block text-white/90 text-sm mb-1">First name<span className="text-pink-400"> *</span></label>
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full mb-4 h-11 rounded-xl bg-white/10 border border-white/30 text-white px-3"
          required
          placeholder="First name"
        />
        <label className="block text-white/90 text-sm mb-1">Last name<span className="text-pink-400"> *</span></label>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full mb-6 h-11 rounded-xl bg-white/10 border border-white/30 text-white px-3"
          required
          placeholder="Last name"
        />
        <button
          disabled={saving}
          onClick={handleContinue}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default Onboarding;


