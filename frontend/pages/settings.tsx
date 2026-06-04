import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { User, Bell, Shield, Palette, Globe, ChevronRight } from 'lucide-react';

const SECTIONS = [
  {
    id: 'profile',
    icon: User,
    title: 'Profile',
    description: 'Manage your name, school, and contact information.',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Control email, push, and in-app notification preferences.',
    color: 'text-orange-600 bg-orange-50',
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Security',
    description: 'Update your password and manage two-factor authentication.',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    id: 'appearance',
    icon: Palette,
    title: 'Appearance',
    description: 'Customise the look and feel of AI.',
    color: 'text-purple-600 bg-purple-50',
  },
  {
    id: 'language',
    icon: Globe,
    title: 'Language & Region',
    description: 'Set your preferred language, timezone, and date format.',
    color: 'text-teal-600 bg-teal-50',
  },
];

export default function SettingsPage() {
  const [active, setActive] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: 'John Doe',
    school: 'Delhi Public School',
    location: 'Bokaro Steel City',
    email: 'john.doe@dpsbokaro.edu.in',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex font-sans">
      <Sidebar />

      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        <TopBar backLabel="Settings" />

        <main className="flex-1 px-4 py-7 sm:px-6 lg:px-10">
          <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-500" />
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-sm text-gray-400 mb-6 pl-5">
            Manage your account and application preferences.
          </p>

          {/* Section cards */}
          <div className="space-y-3 mb-6">
            {SECTIONS.map(({ id, icon: Icon, title, description, color }) => (
              <div key={id}>
                <button
                  onClick={() => setActive(active === id ? null : id)}
                  className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow text-left"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`text-gray-400 transition-transform ${
                      active === id ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {/* Profile Expand Panel */}
                {active === id && id === 'profile' && (
                  <div className="bg-white rounded-2xl border border-gray-100 border-t-0 rounded-t-none px-5 pb-5 -mt-2 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Full Name', key: 'name', placeholder: 'Your name' },
                        { label: 'School', key: 'school', placeholder: 'School name' },
                        { label: 'Location', key: 'location', placeholder: 'City' },
                        { label: 'Email', key: 'email', placeholder: 'Email address' },
                      ].map(({ label, key, placeholder }) => (
                        <div key={key}>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            {label}
                          </label>
                          <input
                            type="text"
                            value={profile[key as keyof typeof profile]}
                            onChange={(e) =>
                              setProfile({ ...profile, [key]: e.target.value })
                            }
                            placeholder={placeholder}
                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 bg-gray-50 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleSave}
                        className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-all"
                        style={{ background: saved ? '#16a34a' : '#111' }}
                      >
                        {saved ? '✓ Saved' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Generic expand for other sections */}
                {active === id && id !== 'profile' && (
                  <div className="bg-white rounded-2xl border border-gray-100 border-t-0 rounded-t-none px-5 pb-5 -mt-2 pt-4">
                    <p className="text-sm text-gray-500 italic">
                      {title} settings coming soon.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-2xl border border-red-100 p-5">
            <h3 className="text-sm font-bold text-red-600 mb-3">Danger Zone</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Delete Account</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  This will permanently remove your data. This action cannot be undone.
                </p>
              </div>
              <button className="px-4 py-2 border border-red-200 rounded-full text-sm font-medium text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 ml-4">
                Delete
              </button>
            </div>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}