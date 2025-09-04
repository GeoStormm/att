# University Attendance Management System

A comprehensive, RFID-based attendance tracking solution designed for modern universities. This system provides real-time attendance monitoring, automated reporting, and seamless integration with existing academic infrastructure.

## 🎯 Features

### Core Functionality
- **RFID-Based Attendance Tracking**: Automatic student and professor identification
- **Real-Time Monitoring**: Live dashboard with active sessions and attendance data
- **Smart Scheduling**: Automated timetable management with conflict detection
- **Comprehensive Reporting**: Detailed attendance analytics and export capabilities
- **Multi-Device Support**: ESP32-based RFID readers for multiple classrooms

### Management Capabilities
- **Student Management**: Complete student profiles with RFID tag association
- **Professor Management**: Faculty profiles with department and course assignments
- **Classroom Management**: Room configuration with capacity and device mapping
- **Course Management**: Course creation with enrollment management
- **Timetable Management**: Weekly schedule creation and management

### Advanced Features
- **Attendance Analytics**: Real-time statistics and trend analysis
- **Export Functionality**: CSV export for reports and compliance
- **Role-Based Access**: Secure access control for different user types
- **Mobile Responsive**: Optimized for all device types
- **Real-Time Updates**: Live data synchronization across all components

## 🏗️ Architecture

### Frontend
- **Next.js 14**: Modern React framework with TypeScript
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Framer Motion**: Smooth animations and transitions
- **Responsive Design**: Mobile-first approach for all screen sizes

### Backend
- **Supabase**: PostgreSQL database with real-time capabilities
- **Row Level Security**: Advanced data protection and access control
- **RESTful API**: Clean, documented API endpoints
- **Real-Time Subscriptions**: Live data updates across all clients

### Hardware
- **ESP32 Microcontrollers**: Reliable RFID reading and WiFi connectivity
- **MFRC522 RFID Readers**: Industry-standard RFID technology
- **LED Indicators**: Visual feedback for system status
- **Audio Feedback**: Buzzer notifications for user interactions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- ESP32 development board
- MFRC522 RFID reader module

### 1. Database Setup
```sql
-- Run the schema setup in Supabase SQL Editor
-- Execute in order:
-- 1. database/schema.sql
-- 2. database/functions.sql
-- 3. database/sample-data.sql (optional)
```

### 2. Environment Configuration
Create `.env.local` in the dashboard directory:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Dashboard Installation
```bash
cd dashboard-nextjs
npm install
npm run dev
```

### 4. ESP32 Setup
1. Install required libraries (see `esp32/libraries.txt`)
2. Configure `esp32/secrets.h` with your credentials
3. Upload the sketch to your ESP32 device

## 📊 Dashboard Features

### Dashboard Overview
- **Real-Time Metrics**: Live student, professor, and session counts
- **Quick Actions**: Fast access to common operations
- **System Status**: Database and device connectivity monitoring
- **Recent Activity**: Latest sessions and attendance records

### Management Pages
- **Students**: Add, edit, and manage student profiles
- **Professors**: Faculty management with department assignments
- **Classrooms**: Room configuration and device mapping
- **Courses**: Course creation and enrollment management
- **Timetable**: Weekly schedule planning and management
- **Sessions**: Active session monitoring and control
- **Attendance**: Comprehensive reporting and analytics

## 🔧 Configuration

### RFID Device Setup
1. **Hardware Assembly**: Connect ESP32 to MFRC522 module
2. **Network Configuration**: Set WiFi credentials in `secrets.h`
3. **Supabase Setup**: Configure API endpoints and authentication
4. **Device Registration**: Add device ID to classroom configuration

### Database Configuration
- **Tables**: All required tables are created automatically
- **Functions**: Stored procedures for attendance logic
- **Policies**: Row-level security for data protection
- **Indexes**: Optimized for performance

## 📈 Usage Examples

### Starting a Class Session
1. Professor scans RFID card at classroom entrance
2. System automatically starts session and populates roster
3. Students scan cards to record attendance
4. Real-time updates appear on dashboard

### Managing Enrollments
1. Navigate to Courses page
2. Select course and manage student enrollments
3. Export enrollment lists for administrative use
4. Track enrollment changes over time

### Generating Reports
1. Use Attendance page with date filters
2. Apply status and course filters as needed
3. Export data to CSV for external analysis
4. View real-time attendance statistics

## 🔒 Security Features

- **Row Level Security**: Database-level access control
- **Authentication**: Secure user management
- **Data Encryption**: All data encrypted in transit and at rest
- **Audit Logging**: Complete activity tracking
- **Access Control**: Role-based permissions

## 📱 Mobile Experience

- **Responsive Design**: Optimized for all screen sizes
- **Touch-Friendly**: Mobile-optimized interface elements
- **Fast Loading**: Optimized performance for mobile devices
- **Offline Capability**: Basic functionality without internet

## 🚀 Deployment

### Production Deployment
1. **Build Application**: `npm run build`
2. **Environment Variables**: Configure production Supabase instance
3. **Hosting**: Deploy to Vercel, Netlify, or your preferred platform
4. **Database**: Use production Supabase instance
5. **Monitoring**: Enable logging and performance monitoring

### ESP32 Deployment
1. **Firmware Update**: Upload latest code to devices
2. **Network Configuration**: Ensure stable WiFi connectivity
3. **Testing**: Verify RFID reading and API communication
4. **Maintenance**: Regular firmware updates and monitoring

## 🛠️ Development

### Local Development
```bash
# Clone repository
git clone https://github.com/your-username/university-attendance-system.git

# Install dependencies
cd dashboard-nextjs
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Code Structure
```
dashboard-nextjs/
├── app/                    # Next.js app router
│   ├── (schedule)/        # Timetable management
│   ├── attendance/        # Attendance reporting
│   ├── courses/           # Course management
│   ├── students/          # Student management
│   ├── professors/        # Professor management
│   └── classrooms/        # Classroom management
├── components/            # Reusable UI components
├── lib/                   # Utility functions and configurations
└── public/                # Static assets
```

## 📋 Requirements

### System Requirements
- **Node.js**: 18.0.0 or higher
- **Database**: PostgreSQL 12+ (Supabase recommended)
- **Browser**: Modern browsers with ES6+ support
- **Network**: Stable internet connection for real-time features

### Hardware Requirements
- **ESP32**: Development board with WiFi
- **RFID Reader**: MFRC522 module
- **RFID Cards**: ISO14443A compatible tags
- **Power Supply**: 3.3V regulated power
- **Enclosure**: Protective case for classroom installation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- **API Reference**: Available in Supabase dashboard
- **Component Library**: Built-in documentation for UI components
- **Database Schema**: Complete schema documentation

### Troubleshooting
- **Common Issues**: Check the issues section
- **ESP32 Problems**: Verify wiring and network configuration
- **Database Issues**: Check Supabase logs and policies

### Contact
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Email**: Support email for enterprise customers

## 🎉 Acknowledgments

- **Supabase Team**: For the excellent backend platform
- **Next.js Team**: For the amazing React framework
- **ESP32 Community**: For hardware support and examples
- **Open Source Contributors**: For various libraries and tools

---

**Ready to revolutionize your university's attendance tracking?** 🚀

This system provides everything you need for a professional, scalable attendance management solution. From RFID hardware to comprehensive reporting, it's designed to impress university administrators and streamline academic operations.
