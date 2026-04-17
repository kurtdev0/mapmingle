import React from 'react';
import { ShieldCheck } from 'lucide-react';

const sections = [
  {
    title: 'What we collect',
    body: 'We collect the information you provide when creating an account (name, email, profile photo) and content you share on the platform (posts, captions, locations). We also collect basic usage data such as pages visited and features used to improve the product.',
  },
  {
    title: 'How we use your data',
    body: 'Your data is used to personalize your experience, show relevant travel recommendations, and enable community features like guides and bookings. We do not sell your personal information to third parties under any circumstances.',
  },
  {
    title: 'AI & third-party services',
    body: 'MapMingle uses Google Gemini AI to generate travel recommendations and itineraries. Queries sent to the AI include your search input but never your personal account details. Map data is provided by OpenStreetMap contributors via Leaflet.',
  },
  {
    title: 'Data storage',
    body: 'Your data is stored securely on Supabase infrastructure. We retain your account data for as long as your account is active. You may request deletion of your account and all associated data at any time by contacting us.',
  },
  {
    title: 'Cookies',
    body: 'We use session cookies to keep you logged in and local storage for your preferences. We do not use third-party tracking or advertising cookies.',
  },
  {
    title: 'Your rights',
    body: 'You have the right to access, correct, or delete the personal data we hold about you. You can update most information directly from your Profile settings. For full data removal requests, reach out to our support team.',
  },
  {
    title: 'Changes to this policy',
    body: 'We may update this policy from time to time. Significant changes will be communicated via the platform. Continued use of MapMingle after changes take effect constitutes your acceptance of the updated policy.',
  },
];

const Privacy: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      {/* Header */}
      <div className="mb-12">
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-5 border border-indigo-100">
          <ShieldCheck size={20} className="text-indigo-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
        <p className="text-gray-400 text-sm">Last updated: April 2025</p>
      </div>

      {/* Intro */}
      <p className="text-gray-500 leading-relaxed mb-10">
        MapMingle is committed to protecting your privacy. This policy explains what data we collect,
        how we use it, and the choices you have. We keep it simple — no legalese.
      </p>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map(({ title, body }) => (
          <div key={title} className="border-t border-gray-100 pt-8">
            <h2 className="text-base font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Privacy;
