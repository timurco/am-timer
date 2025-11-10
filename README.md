# Mindful Timer

A minimalist meditation timer and clock web application with smooth animations and screen wake-lock functionality.

![Mindful Timer](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8?style=flat-square&logo=tailwindcss)

## Features

- **Two Modes**
  - 🕐 **Clock Mode**: Live time display (HH:MM:SS) - default mode
  - ⏱️ **Timer Mode**: Countdown timer with presets

- **Timer Presets**
  - 5 seconds (for testing)
  - 10 minutes
  - 15 minutes
  - 30 minutes

- **Smart Features**
  - ✨ Smooth animated number transitions using Framer Motion
  - 🔴 Visual completion notification (fullscreen red flash)
  - 📊 Color-changing progress bar (green → orange)
  - 💾 Automatic state persistence (survives page reload)
  - 📱 Screen wake-lock (prevents screen from sleeping)
  - 🖥️ Fullscreen mode support
  - 📲 PWA-ready with app manifest

- **Design**
  - Pure black background
  - White text with Manrope ExtraLight font
  - Minimalist interface
  - Fully responsive (mobile & desktop)

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Wake Lock**: [NoSleep.js](https://github.com/richtr/NoSleep.js/) + Wake Lock API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mindful-timer.git
cd mindful-timer

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Usage

### Clock Mode (Default)
- Displays current time in HH:MM:SS format
- Screen stays awake while in clock mode
- Click anywhere to enable wake-lock

### Timer Mode
1. Click "Timer" to switch to timer mode
2. Select a preset duration (5s, 10min, 15min, 30min)
3. Click "start" to begin countdown
4. Use "pause" to pause the timer
5. Use "reset" to reset to selected preset
6. On completion: screen flashes red 10 times

### Fullscreen
- Click the fullscreen button (top-right corner) to toggle fullscreen mode
- Works great on mobile devices when installed as PWA

## Project Structure

```
12_Timer/
├── app/
│   ├── layout.tsx          # Root layout with PWA config
│   ├── page.tsx            # Main page component
│   └── globals.css         # Tailwind CSS imports
├── components/
│   ├── meditation-timer.tsx    # Main timer component
│   └── core/
│       └── sliding-number.tsx  # Animated digit component
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── icon-192.png        # PWA icon 192x192
│   └── icon-512.png        # PWA icon 512x512
├── lib/
│   └── utils.ts            # Utility functions
└── package.json
```

## Key Components

### MeditationTimer
Main component handling:
- Mode switching (Clock/Timer)
- Timer countdown logic with timestamp-based persistence
- Wake-lock management (Wake Lock API + NoSleep.js fallback)
- Fullscreen controls
- Completion flash effect

### SlidingNumber
Reusable animated digit component:
- Smooth vertical sliding transitions
- Individual digit animation
- Spring physics using Framer Motion

## Browser Support

- **Desktop**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari 16+, Chrome Android 90+
- **Wake Lock**: Falls back to NoSleep.js on unsupported browsers

## License

MIT License - feel free to use this project for any purpose.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Inspired by minimalist meditation practices
- Built with modern web technologies
- Animation technique inspired by motion-primitives library
