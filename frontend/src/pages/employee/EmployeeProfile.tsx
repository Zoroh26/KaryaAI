import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/userService';
import { ToastContainer, useToast } from '@/components/ui/Toast';

const EmployeeProfile = () => {
  const { user } = useAuth();
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toasts, toast, removeToast } = useToast();

  useEffect(() => {
    if (user) {
      setSkills(user.skillset || []);
      setIsAvailable(user.isAvailable || false);
    }
  }, [user]);

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim() !== '') {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // NOTE: Currently backend /api/users/:id requires Admin privileges. 
      // This will fail unless the backend routes are updated to allow users to update their own profile.
      // E.g. PUT /api/users/me
      await userService.updateUser(user.uid, {
        skillset: skills,
        isAvailable
      });
      toast.success('Profile updated', 'Your profile changes have been saved successfully.');
    } catch (err: any) {
      toast.error('Update failed', err.message || 'Failed to update profile. May require Admin privileges on backend.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-black min-h-screen text-white p-6 max-w-4xl mx-auto">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-navbar">My Profile</h1>
          <p className="text-white/70 font-navbar mt-2">Manage your skillset and availability for AI task assignment.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="mt-4 sm:mt-0 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary hover:bg-primary/90 text-black h-10 px-6 py-2 font-navbar disabled:opacity-50"
        >
          {isSaving ? (
            <><i className="fas fa-spinner fa-spin"></i> Saving...</>
          ) : (
            <><i className="fas fa-save"></i> Save Changes</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-[#0f181a] border border-white/10 rounded-xl p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-primary/20 text-primary flex items-center justify-center text-4xl font-bold mx-auto mb-4">
              {user?.full_name?.substring(0, 2).toUpperCase() || 'EMP'}
            </div>
            <h2 className="text-xl font-bold font-navbar">{user?.full_name}</h2>
            <p className="text-white/50 text-sm font-navbar mb-4">{user?.email}</p>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/70 uppercase tracking-wider">
              {user?.role}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Availability Settings */}
          <div className="bg-[#0f181a] border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold font-navbar flex items-center mb-4">
              <i className="fas fa-calendar-check text-primary mr-2"></i>
              Availability Status
            </h3>
            <p className="text-sm text-white/60 font-navbar mb-4">
              Toggle your availability to let the AI know if you can take on new tasks.
            </p>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                />
                <div className={`block w-14 h-8 rounded-full transition-colors ${isAvailable ? 'bg-primary' : 'bg-white/20'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-black w-6 h-6 rounded-full transition-transform ${isAvailable ? 'transform translate-x-6' : ''}`}></div>
              </div>
              <div className="ml-3 font-navbar font-medium">
                {isAvailable ? (
                  <span className="text-primary">Available for new tasks</span>
                ) : (
                  <span className="text-white/50">Currently busy</span>
                )}
              </div>
            </label>
          </div>

          {/* Skillset Management */}
          <div className="bg-[#0f181a] border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold font-navbar flex items-center mb-4">
              <i className="fas fa-code text-primary mr-2"></i>
              My Skillset
            </h3>
            <p className="text-sm text-white/60 font-navbar mb-4">
              Add your technical skills to help the AI accurately assign tasks that match your expertise. Press Enter to add.
            </p>
            
            <input 
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleAddSkill}
              placeholder="e.g., React, Node.js, Python..."
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-navbar focus:outline-none focus:border-primary transition-colors mb-4"
            />

            <div className="flex flex-wrap gap-2">
              {skills.length === 0 ? (
                <div className="text-sm text-white/40 italic">No skills added yet.</div>
              ) : (
                skills.map(skill => (
                  <span key={skill} className="inline-flex items-center bg-white/5 border border-white/10 px-3 py-1.5 rounded-md text-sm font-medium font-navbar">
                    {skill}
                    <button 
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 text-white/40 hover:text-red-400 focus:outline-none transition-colors"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
