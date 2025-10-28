import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const RoleSelection: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<'hr' | 'candidate' | ''>('');

  const saveRole = async () => {
    if (!user) return;
    try {
      setSaving(true);
      setError('');
      if (!selected) {
        setError('Please select a role to continue.');
        setSaving(false);
        return;
      }
      const currentUnsafe = (user.unsafeMetadata || {}) as Record<string, unknown>;
      await user.update({ unsafeMetadata: { ...currentUnsafe, role: selected } });
      await user.reload();
      if (selected === 'hr') {
        navigate('/hr', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (e: any) {
      setError(`Failed to save role. ${e?.errors?.[0]?.message || e?.message || ''}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070f2b] px-4">
      <div className="max-w-xl w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-10 shadow-2xl">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-6">Select your role</h1>
        <p className="text-white/70 text-center mb-8">Tell us how you’ll use HireMind.</p>
        {error && <div className="mb-4 text-red-400 text-center">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            disabled={saving}
            onClick={() => setSelected('hr')}
            className={`bg-white/10 hover:bg-white/20 border ${selected==='hr' ? 'border-purple-400 ring-2 ring-purple-400/40' : 'border-white/30'} text-white rounded-xl font-bold text-lg px-6 py-8 transition-all duration-300`}
          >
            👔 I’m an HR
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => setSelected('candidate')}
            className={`bg-white/10 hover:bg-white/20 border ${selected==='candidate' ? 'border-purple-400 ring-2 ring-purple-400/40' : 'border-white/30'} text-white rounded-xl font-bold text-lg px-6 py-8 transition-all duration-300`}
          >
            🧑‍🎓 I’m a Candidate
          </button>
        </div>
        <button
          disabled={saving}
          onClick={saveRole}
          className="mt-6 w-full h-11 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default RoleSelection;


