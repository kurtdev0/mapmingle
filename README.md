<h1 align="center">
  <img src="public/favicon.svg" width="32" alt="logo" /> MapMingle
</h1>

<p align="center">
  <strong>Discover the undiscovered. Escape the tourist traps.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Gemini-AI-orange?style=flat-square&logo=google" alt="Gemini" />
</p>

<hr />

## What is MapMingle?

I built MapMingle because I was tired of generic travel guides sending everyone to the same 5 overcrowded spots. I wanted an app that genuinely helps travelers find *real* hidden gems, while also organizing itineraries logically on a map.

MapMingle is a dynamic travel companion that fuses the utility of Google Maps with community-driven insights and Google's Gemini AI. It's designed with a premium, glassmorphic UI specifically for modern travelers and local guides who want authentic experiences.

## ✨ Key Features

- **🗺️ Interactive Itinerary Planner**: Tell the AI where you're going and for how many days. It builds a connected, map-routed itinerary of "must-see" and "must-eat" spots tailored to the location.
- **💎 Hidden Gems Feed**: A social feed where locals drop pins and share gorgeous locations that aren't on the typical tourist radar.
- **🛡️ Verified Guides System**: Local experts can verify their profiles (shield badge), offer custom tour packages, and receive direct booking requests.
- **💧 Essentials Locator**: You're walking around Rome and need a drink or a bathroom. The app uses AI to instantly map real public water fountains and restrooms near your exact coordinates. 
- **⚖️ The "Truth Scale"**: Wondering if that viral Instagram spot is actually worth it? The Truth Scale analyzes wait times, crowds, and value-for-money to generate a brutally honest "exaggeration score."

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, React Router, Tailwind CSS v4 
- **Maps**: Leaflet & React-Leaflet
- **Backend/Auth**: Supabase (PostgreSQL, Authentication, Storage)
- **AI Integration**: Google GenAI SDK (`gemini-2.5-flash` & `gemini-3-flash-preview`)

## 🚀 Running it locally

If you want to spin this up on your own machine, it's pretty straightforward.

1. **Clone the repo**
   ```bash
   git clone https://github.com/kurtdev0/mapmingle.git
   cd mapmingle
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your environment setup**
   Rename `.env.example` to `.env.local` and drop in your keys:
   ```env
   GEMINI_API_KEY=your_key_here
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Fire up the dev server**
   ```bash
   npm run dev
   ```

## 🤝 Contributing
Found a bug? Have an idea for a cool new feature? Feel free to open an issue or throw a pull request my way.

## 📄 License
MIT License - feel free to use this for your own projects!
