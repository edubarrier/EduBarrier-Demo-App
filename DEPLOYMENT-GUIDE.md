# EduBarrier Deployment Guide
## Deploy Your App to the Web (No Coding Experience Required!)

This guide will help you deploy EduBarrier to the internet so anyone can access it. We'll use:
- **GitHub** - To store your code
- **Vercel** - To host your website (free!)
- **Supabase** - To store your data in the cloud (free!)

**Total Time:** About 30-45 minutes
**Cost:** $0 (All services have free plans)

---

## 📋 What You'll Need

1. A computer with internet access
2. An email address
3. That's it! No coding required.

---

## Part 1: Create Your Accounts (10 minutes)

### Step 1: Create a GitHub Account
1. Go to https://github.com
2. Click "Sign up" in the top right
3. Enter your email, create a password, and choose a username
4. Verify your email
5. Choose the free plan

### Step 2: Create a Vercel Account
1. Go to https://vercel.com
2. Click "Sign Up"
3. Click "Continue with GitHub" (this connects your accounts)
4. Authorize Vercel to access your GitHub

### Step 3: Create a Supabase Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Click "Sign in with GitHub"
4. Authorize Supabase to access your GitHub

✅ **You now have all three accounts!**

---

## Part 2: Set Up Supabase Database (10 minutes)

### Step 1: Create a New Project
1. In Supabase, click "New Project"
2. Choose an organization (or create one with your name)
3. Fill in:
   - **Project Name:** edubarrier
   - **Database Password:** Create a strong password (SAVE THIS!)
   - **Region:** Choose closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for setup

### Step 2: Get Your Connection Details
1. Click on "Settings" (gear icon) in the left sidebar
2. Click "API" in the settings menu
3. You'll see two important things:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon public key** (long string of letters/numbers)
4. **SAVE THESE!** Copy them to a text file

### Step 3: Create Database Tables
1. Click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy and paste this code (I'll provide it in a separate file)
4. Click "Run" at the bottom right
5. You should see "Success. No rows returned"

✅ **Your database is ready!**

---

## Part 3: Upload to GitHub (10 minutes)

### Step 1: Create a New Repository
1. Go to https://github.com
2. Click the "+" icon (top right) → "New repository"
3. Fill in:
   - **Repository name:** edubarrier
   - **Description:** Educational platform for families
   - **Public** (select this option)
   - ✅ Check "Add a README file"
4. Click "Create repository"

### Step 2: Upload Your Files
1. You should see your new repository page
2. Click "Add file" → "Upload files"
3. Drag and drop these files (I'll create them for you):
   - All the project files from the folder I'll create
4. Scroll down, add commit message: "Initial commit"
5. Click "Commit changes"

✅ **Your code is on GitHub!**

---

## Part 4: Deploy to Vercel (10 minutes)

### Step 1: Import Your Project
1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Find "edubarrier" in your list of repositories
4. Click "Import"

### Step 2: Configure Your Project
1. **Framework Preset:** Select "Vite"
2. **Root Directory:** Leave as "./"
3. **Build Command:** Leave default
4. **Output Directory:** Leave default

### Step 3: Add Environment Variables
This connects your website to your database!

1. Click "Environment Variables"
2. Add these two variables:

**Variable 1:**
- Name: `VITE_SUPABASE_URL`
- Value: (Paste your Supabase Project URL from Part 2)

**Variable 2:**
- Name: `VITE_SUPABASE_ANON_KEY`
- Value: (Paste your Supabase anon key from Part 2)

3. Click "Deploy"
4. Wait 2-3 minutes for deployment

### Step 4: View Your Live Site!
1. Once deployment finishes, you'll see "Congratulations! 🎉"
2. Click "Visit" or the domain name shown
3. Your app is now LIVE on the internet!

✅ **Your app is deployed!**

---

## Part 5: Set Up Your Domain (Optional, 5 minutes)

Your site has a URL like: `edubarrier-xxxxx.vercel.app`

### Want a Custom Domain?
1. Buy a domain from Namecheap or GoDaddy (about $12/year)
2. In Vercel, go to your project
3. Click "Settings" → "Domains"
4. Add your domain and follow the instructions

---

## 🎉 You're Done!

Your EduBarrier app is now live on the internet! Share your Vercel URL with anyone.

### Important URLs to Save:
- 🌐 **Your Live Site:** `https://your-site.vercel.app`
- 💾 **GitHub Repo:** `https://github.com/yourusername/edubarrier`
- 🗄️ **Supabase Dashboard:** `https://supabase.com/dashboard`
- 🚀 **Vercel Dashboard:** `https://vercel.com/dashboard`

---

## 🔧 Making Updates

### When You Want to Change Something:

**Easy Way (using GitHub website):**
1. Go to your GitHub repository
2. Click on the file you want to edit
3. Click the pencil icon (Edit)
4. Make your changes
5. Click "Commit changes"
6. Vercel automatically deploys in 1-2 minutes!

**Better Way (using GitHub Desktop - recommended):**
1. Download GitHub Desktop: https://desktop.github.com
2. Clone your repository
3. Edit files on your computer
4. Commit and push changes
5. Vercel auto-deploys!

---

## 🆘 Troubleshooting

### "Build failed" on Vercel
- Check that environment variables are correct
- Make sure VITE_SUPABASE_URL starts with https://
- Make sure VITE_SUPABASE_ANON_KEY has no extra spaces

### "Can't connect to database"
- Verify your Supabase project is running
- Check environment variables in Vercel
- Make sure you ran the SQL setup script

### "Page not loading"
- Wait a few minutes after deployment
- Clear your browser cache (Ctrl+F5)
- Check Vercel deployment logs

### Still stuck?
1. Check Vercel deployment logs
2. Check browser console (F12 → Console tab)
3. Post in GitHub Discussions on your repo

---

## 📊 Monitoring Your App

### Supabase Dashboard
- View all users, families, and assignments
- See real-time activity
- Export data as needed

### Vercel Analytics (Optional)
- See how many people visit
- Track page loads
- Monitor performance

---

## 🔒 Security Notes

1. **Never share** your Supabase database password
2. **Never share** your Supabase service role key (if you see it)
3. The anon key is safe to use in your app (it's public)
4. Enable RLS (Row Level Security) in Supabase for production

---

## 💰 Costs

### Free Tier Limits:
- **Vercel:** 100GB bandwidth/month (plenty for small-medium use)
- **Supabase:** 500MB database, 2GB bandwidth (good for hundreds of users)
- **GitHub:** Unlimited public repositories

### When You Might Need to Upgrade:
- 1000+ active users
- Heavy daily usage
- Need custom domain email
- Want priority support

Most family/school uses will stay free forever!

---

## 🎓 Next Steps

1. Test your app thoroughly
2. Create admin account and test courses
3. Invite family members to test
4. Set up analytics (optional)
5. Add custom domain (optional)
6. Enable backups in Supabase

---

## 📞 Getting Help

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **GitHub Docs:** https://docs.github.com

---

**Created with ❤️ for EduBarrier**
**Last Updated:** November 3, 2025
