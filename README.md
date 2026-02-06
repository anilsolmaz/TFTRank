# 🏆 TFT Rank Tracker

A modern web application for tracking and comparing Teamfight Tactics ranked statistics across multiple players with real-time data from Riot Games API.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 📊 Player Comparison
- **Up to 4 players** side-by-side comparison
- Real-time ranked statistics
- Trophy indicators (Gold/Silver/Bronze medals)
- Player profile avatars and tags

### 🎯 Custom Point System
- **1st place:** +4 points
- **2nd place:** +3 points
- **3rd place:** +2 points
- **4th place:** +1 point
- **5th place:** -1 point
- **6th place:** -2 points
- **7th place:** -3 points
- **8th place:** -4 points

### 📈 Game Statistics
- **Analyzed Games:** Filtered match count
- **Average Placement:** Mean finishing position
- **Top 4 Rate:** Percentage and count of top 4 finishes
- **Win Rate:** First place percentage
- **Current Rank:** Tier, division, and LP

### ⚔️ Match History
- Common matches across tracked players
- Placement-based color coding (1-8)
- Point display per match
- Top 2 trait/comp display for each player
- Up to 20 recent matches

### 🎨 Modern UI
- Glassmorphism design with backdrop blur
- Gradient accents and smooth animations
- Fully responsive (Desktop, Tablet, Mobile)
- Dark theme optimized
- Compact overlay labels for statistics

### 🔧 Filters
- **Today's Games:** Show only matches from today
- **Last 10 Games:** Most recent 10 matches
- **Last 20 Games:** Most recent 20 matches

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Riot Games API Key ([Get it here](https://developer.riotgames.com/))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/anilsolmaz/TFTRank.git
cd TFTRank/tft-rank
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
# Create .env.local in the root directory
NEXT_PUBLIC_RIOT_API_KEY=your_riot_api_key_here
```

4. **Run development server**
```bash
npm run dev
```

5. **Open in browser**
```
http://localhost:3000
```

## 🏗️ Building for Production

```bash
# Create optimized production build
npm run build

# Run production server
npm start
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
tft-rank/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── stats/          # API routes for Riot data
│   │   ├── components/
│   │   │   ├── Dashboard.tsx   # Main statistics dashboard
│   │   │   └── PlayerCard.tsx  # Individual player cards
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   └── types/
│       └── index.ts            # TypeScript type definitions
├── public/                     # Static assets
├── .env.local                  # Environment variables
├── next.config.mjs             # Next.js configuration
├── package.json
└── tsconfig.json
```

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** CSS Modules with Glassmorphism
- **Icons:** Lucide React
- **API:** Riot Games API
- **Deployment:** AWS EC2 / Vercel ready

## 🌐 API Integration

This app uses the official Riot Games API to fetch:
- Player account information (PUUID, summoner data)
- Ranked league information (tier, rank, LP)
- Match history and details
- Trait and composition data

**Supported Regions:**
- TR1 (Turkey)
- EUW1, EUN1, NA1, KR, etc.

**Rate Limits:**
- Development API key is rate-limited
- Consider implementing caching for production

## 🎮 Usage

1. The app automatically loads 4 pre-configured players on startup
2. Use the **filter dropdown** to select different time ranges
3. Compare players across various statistics
4. Scroll down to see common matches and detailed placement history
5. View trait compositions for each match

## 🚀 Deployment

### AWS EC2 Ubuntu

See `aws_deployment_guide.md` for detailed deployment instructions including:
- EC2 instance setup
- Node.js installation
- PM2 process management
- Nginx reverse proxy configuration
- SSL/HTTPS setup

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_RIOT_API_KEY` | Your Riot Games API key | ✅ Yes |

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Riot Games](https://developer.riotgames.com/) for the excellent API
- [Next.js](https://nextjs.org/) for the powerful React framework
- [Lucide](https://lucide.dev/) for beautiful icons

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Note:** This application is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties.
