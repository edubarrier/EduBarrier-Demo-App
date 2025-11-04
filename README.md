# EduBarrier

**Learn First. Play Later.**

An educational platform that connects parents and children through meaningful learning experiences. Children complete educational courses to earn screen time, creating a healthy balance between education and recreation.

## 🌟 Features

- **Parent Dashboard**: Assign courses, track progress, manage screen time
- **Child Portal**: Complete lessons and quizzes to earn rewards
- **Admin Panel**: Manage courses, subjects, and system users
- **Screen Time Management**: Lock/unlock controls and timer system
- **Course Library**: Pre-built courses in Math, Reading, Science, and History
- **Household System**: Multi-child family management with unique codes
- **Real-time Sync**: Supabase backend for instant updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/edubarrier.git
   cd edubarrier
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📦 Deployment

See [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) for complete step-by-step instructions.

Quick steps:
1. Set up Supabase database (run `supabase-setup.sql`)
2. Push to GitHub
3. Deploy to Vercel
4. Add environment variables in Vercel

## 🔐 Default Accounts

### Admin Account
- Email: `admin@edubarrier.com`
- Password: `admin2025`

### Demo Parent Account
- Email: `demo@parent.com`
- Password: `demo`
- Household Code: `AB12`

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT-GUIDE.md) - Complete deployment instructions
- [Structure Documentation](./structure.md) - Technical architecture details
- [Supabase Setup](./supabase-setup.sql) - Database schema

## 🛠️ Built With

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Supabase** - Backend database
- **Lucide React** - Icon library
- **Vercel** - Hosting platform

## 🗂️ Project Structure

```
edubarrier/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Entry point
│   ├── index.css        # Global styles
│   └── supabase.js      # Database client
├── public/              # Static assets
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
└── tailwind.config.js   # Tailwind configuration
```

## 🎯 Usage

### For Parents
1. Create account or join with household code
2. Add children to your household
3. Assign courses with time rewards
4. Monitor progress and manage screen time

### For Children
1. Join household with parent's code
2. Complete assigned courses
3. Pass quizzes to earn screen time
4. Use earned time for recreation

### For Admins
1. Create and manage courses
2. Add/remove subject categories
3. Manage user accounts
4. View system statistics

## 🔄 Version History

- **v1.2.1** (Current) - UX improvements, logout button, always start at login
- **v1.2.0** - Timer controls and screen lock features
- **v1.1.0** - Admin panel and dynamic course system
- **v1.0.0** - Initial release

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

## 📄 License

This project is licensed under the MIT License.

## 💬 Support

For questions or issues:
1. Check the [Deployment Guide](./DEPLOYMENT-GUIDE.md)
2. Review the [Structure Documentation](./structure.md)
3. Open an issue on GitHub

## 🙏 Acknowledgments

- Built with love for families who value education
- Inspired by the need for healthier screen time habits
- Powered by amazing open-source tools

---

**EduBarrier** - Making learning rewarding, one course at a time.

Last Updated: November 3, 2025
