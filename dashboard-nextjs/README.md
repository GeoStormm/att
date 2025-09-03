# 🎓 University Attendance System - Next.js Dashboard

A modern, responsive dashboard built with **Next.js 14**, **TypeScript**, and **Tailwind CSS** for the ESP32-based university attendance system.

## ✨ Features

- **🚀 Modern Tech Stack**: Next.js 14, TypeScript, Tailwind CSS
- **🎨 Beautiful UI**: Smooth animations with Framer Motion
- **📱 Responsive Design**: Works perfectly on all devices
- **⚡ Real-time Data**: Live updates from Supabase database
- **🎯 Type Safety**: Full TypeScript support
- **🔔 Toast Notifications**: User-friendly feedback system
- **📊 Interactive Charts**: Data visualization with Recharts
- **🎭 Smooth Animations**: Non-overwhelming, elegant transitions

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Database**: Supabase
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase project set up

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd dashboard-nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
dashboard-nextjs/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard page
├── components/             # Reusable components
│   ├── ui/                # UI components
│   │   ├── StatCard.tsx   # Statistics card
│   │   └── StatusBadge.tsx # Status indicator
│   └── layout/            # Layout components
│       └── Navigation.tsx # Navigation bar
├── lib/                   # Utilities and config
│   └── supabase.ts        # Supabase client
├── public/                # Static assets
└── package.json           # Dependencies
```

## 🎨 Components

### StatCard
Beautiful statistics cards with icons and animations:
- Color-coded themes (primary, success, warning, danger)
- Smooth fade-in animations
- Responsive design

### StatusBadge
Status indicators for attendance records:
- Present, Late, Absent, Active, Ended
- Color-coded with emojis
- Scale-in animations

### Navigation
Modern navigation bar with:
- Responsive mobile menu
- Active state indicators
- Smooth transitions

## 🔧 Configuration

### Tailwind CSS
Custom color palette and animations:
- Primary, Success, Warning, Danger colors
- Custom keyframes for smooth animations
- Responsive breakpoints

### Supabase
Database connection and types:
- TypeScript interfaces for all tables
- Real-time data fetching
- Error handling with toast notifications

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Tablet**: Responsive grid layouts
- **Desktop**: Full-featured dashboard experience
- **Breakpoints**: Tailwind's responsive utilities

## 🎭 Animations

Smooth, non-overwhelming animations using Framer Motion:
- **Fade In**: Gentle opacity transitions
- **Slide Up/Down**: Smooth vertical movements
- **Scale In**: Subtle size animations
- **Staggered**: Sequential element animations

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Deploy to Vercel
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Deploy to Other Platforms
- **Netlify**: Supports Next.js out of the box
- **Railway**: Easy deployment with environment variables
- **AWS**: Use AWS Amplify or custom setup

## 🔒 Environment Variables

Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📊 Database Schema

The dashboard connects to these Supabase tables:
- `professors` - Professor information
- `students` - Student records
- `classrooms` - Classroom details
- `sessions` - Class sessions
- `attendance` - Attendance records
- `active_sessions` - View of current sessions

## 🎯 Features Roadmap

- [ ] Real-time attendance updates
- [ ] Advanced analytics and charts
- [ ] Export functionality (PDF, Excel)
- [ ] User authentication
- [ ] Role-based access control
- [ ] Mobile app (React Native)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the console for errors
2. Verify your Supabase configuration
3. Ensure all dependencies are installed
4. Check the database schema matches

## 🎉 Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS
- Framer Motion for smooth animations
- Supabase for the backend infrastructure

---

**Built with ❤️ for modern education technology**
