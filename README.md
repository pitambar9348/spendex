# 💎 Expense Tracker

<div align="center">

![Expense Tracker](https://img.shields.io/badge/Expense-Tracker-00ffa3?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-00d4ff?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-ff3b57?style=for-the-badge)

**A modern, feature-rich expense tracking application with advanced filtering, export capabilities, and stunning UI**

[Live Demo](#) • [Features](#-features) • [Installation](#-installation) • [Documentation](#-documentation)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Installation](#-installation)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🌟 Overview

**Expense Tracker** is a full-featured personal finance management application designed to help users track their income and expenses with precision and ease. Built with modern web technologies and a focus on user experience, it offers professional-grade features including advanced filtering, multiple export formats, and real-time data synchronization.

### Why Expense Tracker?

- ✅ **Comprehensive Category System** - 63 categories across 9 groups
- ✅ **Advanced Filtering** - Date range and category-based filtering
- ✅ **Multiple Export Formats** - CSV for analysis, PDF for sharing
- ✅ **Real-time Sync** - Powered by Supabase
- ✅ **Beautiful UI** - Modern dark theme with glass morphism
- ✅ **Mobile Responsive** - Works perfectly on all devices
- ✅ **Secure Authentication** - Email/password with password reset
- ✅ **Auto-save** - Never lose your data

---

## ✨ Features

### 💰 Financial Management

- **Income & Expense Tracking** - Record all financial transactions
- **Category Organization** - 63 pre-defined categories in 9 logical groups
- **Balance Calculation** - Real-time income, expense, and balance tracking
- **Date Management** - Track when each transaction occurred
- **Amount Formatting** - Indian locale with ₹ symbol and comma separators

### 🔍 Advanced Filtering

- **Date Filters**
  - From date (show from specific date onwards)
  - To date (show up to specific date)
  - Date range (between two dates, inclusive)
- **Category Filter** - Filter by any of 63 categories
- **Combined Filters** - Use multiple filters simultaneously
- **Filter Badge** - Visual indicator of active filters
- **Smart Empty States** - Different messages for filtered vs unfiltered views

### 📊 Data Export

#### CSV Export
- Standard format for Excel/Google Sheets
- Properly escaped text fields
- Includes: Date, Title, Category, Type, Amount
- Auto-download with timestamp filename
- Perfect for data analysis and pivot tables

#### PDF Export
- Professional report layout
- Company header with branding
- Summary section (Income/Expense/Balance)
- Shows active filters in report
- Color-coded amounts (green/red)
- Print-ready formatting
- Generation timestamp

### 🎨 Modern UI/UX

- **Dark Theme** - Eye-friendly with neon accents
- **Glass Morphism** - Frosted glass effects on cards
- **Smooth Animations** - Entrance animations and micro-interactions
- **Premium Typography** - Sora + Space Mono fonts
- **Responsive Design** - Mobile-first approach
- **Loading States** - Visual feedback for all actions
- **Toast Notifications** - Queue system with icons
- **Empty States** - Helpful messages when no data

### 🔐 Authentication & Security

- **Email/Password Auth** - Secure user authentication
- **Email Validation** - Regex-based email verification
- **Password Validation** - Minimum length requirements
- **Session Management** - Automatic token refresh
- **Inactivity Timeout** - Auto-refresh after 30 minutes
- **Password Reset** - Email-based password recovery
- **Profile Management** - Update display name
- **Secure Logout** - Complete session cleanup

### ⚡ Performance

- **Client-side Filtering** - Instant filter application
- **Optimized Rendering** - Efficient DOM updates
- **Auto-refresh** - Data sync every 5 minutes
- **Lazy Loading** - Load data only when needed
- **State Management** - Global state for reduced API calls
- **Debounced Actions** - Prevent duplicate submissions

### ⌨️ Keyboard Shortcuts

- `Ctrl/Cmd + K` - Toggle add transaction form
- `Escape` - Close open panels
- `Enter` - Submit forms

---

## 🛠️ Tech Stack

### Frontend

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with custom properties
- **Vanilla JavaScript** - ES6+ features
- **Font** - Google Fonts (Sora, Space Mono)

### Backend & Database

- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Row Level Security (RLS)

### Architecture

- **Client-side Rendering** - Fast initial load
- **RESTful API** - Supabase REST endpoints
- **Responsive Design** - Mobile-first approach
- **Progressive Enhancement** - Works without JavaScript for basic features

---

## 📸 Screenshots

### Dashboard
![Dashboard](screenshots/dashboard.png)
*Modern dashboard with income, expense, and balance cards*

### Transactions List
![Transactions](screenshots/transactions.png)
*Organized transaction list with category tags*

### Filter & Export
![Filters](screenshots/filters.png)
*Advanced filtering with date and category options*

### Add Transaction
![Add Transaction](screenshots/add-transaction.png)
*Clean form with categorized dropdowns*

### Mobile View
![Mobile](screenshots/mobile.png)
*Fully responsive mobile experience*

---

## 🚀 Installation

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Text editor (VS Code recommended)
- [Supabase Account](https://supabase.com/) (free tier available)

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/expense-tracker.git
cd expense-tracker
```

### Step 2: Set Up Supabase

1. Create a new project at [Supabase](https://supabase.com/)
2. Create the following tables:

#### **profiles** table
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

#### **expenses** table
```sql
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own expenses
CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own expenses
CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own expenses
CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own expenses
CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
```

### Step 3: Configure Supabase Credentials

Edit `js/supabase.js`:

```javascript
const SUPABASE_URL = "your-project-url.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key";
```

**Where to find these:**
1. Go to Project Settings → API
2. Copy **Project URL** → `SUPABASE_URL`
3. Copy **anon/public key** → `SUPABASE_ANON_KEY`

### Step 4: Configure Email Settings (Optional)

For password reset emails:

1. Go to Authentication → Email Templates
2. Customize the password reset email
3. Set redirect URL to: `https://yourdomain.com/reset-password.html`

### Step 5: Deploy

#### Option 1: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

#### Option 2: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Option 3: GitHub Pages
1. Push code to GitHub
2. Go to Settings → Pages
3. Select branch and folder
4. Your site will be live at `username.github.io/expense-tracker`

#### Option 4: Local Development
```bash
# Use any local server
python -m http.server 8000
# or
npx serve
# or use VS Code Live Server extension
```

Visit `http://localhost:8000`

---

## 📝 Usage

### Getting Started

1. **Sign Up**
   - Open the application
   - Click "Sign Up" tab
   - Enter name, email, and password
   - Verify email (if confirmation enabled)

2. **Add Your First Transaction**
   - Click "➕ Add Expense / Income"
   - Select type (Expense or Income)
   - Enter title and amount
   - Choose category from dropdown
   - Select date (defaults to today)
   - Click "Add Transaction"

3. **View Dashboard**
   - See total income, expense, and balance
   - View recent transactions table
   - Check color-coded amounts (green/red)

### Advanced Features

#### Filtering Transactions

1. Click "🔍 Filters" button
2. Set filters:
   - **From Date** - Start date (inclusive)
   - **To Date** - End date (inclusive)
   - **Category** - Specific category
3. Filters apply automatically
4. Clear with "Clear All Filters" button

**Filter Examples:**
```
Monthly Review:
- From: 2024-01-01
- To: 2024-01-31
- Category: All

Food Expenses:
- From: (empty)
- To: (empty)
- Category: Groceries

Quarterly Reports:
- From: 2024-01-01
- To: 2024-03-31
- Category: All
```

#### Exporting Data

**CSV Export:**
1. Apply filters (optional)
2. Click "📊 Export CSV"
3. File downloads automatically
4. Open in Excel/Google Sheets

**PDF Export:**
1. Apply filters (optional)
2. Click "📄 Export PDF"
3. Print dialog opens
4. Save as PDF or print

### Category Guide

**Food & Drinks:** Groceries, Restaurant, Snacks, Coffee/Tea, Food Delivery

**Housing & Utilities:** Rent, Electricity, Water, Gas, Internet, Mobile Recharge, Maintenance

**Transport:** Fuel, Public Transport, Cab/Taxi, Vehicle Maintenance, Parking, Toll

**Shopping:** Clothing, Footwear, Accessories, Online Shopping, Electronics

**Health & Medical:** Doctor, Medicines, Hospital, Health Insurance, Gym

**Education:** Books, Courses, Tuition, Online Learning

**Entertainment:** Movies, OTT Subscription, Games, Music, Events, Travel

**Financial:** EMI, Loan, Credit Card, Bank Charges, Investment

**Personal & Misc:** Personal Care, Salon, Gifts, Donations, Pets, Family, Emergency, Other

---

## ⚙️ Configuration

### Environment Variables

While this is a client-side app, you can configure:

**`js/supabase.js`** - Database connection
```javascript
const SUPABASE_URL = "your-url";
const SUPABASE_ANON_KEY = "your-key";
```

### Customization

#### Change Colors

Edit `css/style.css`:
```css
:root {
  --color-accent: #00ffa3;  /* Primary accent */
  --color-accent-secondary: #00d4ff;  /* Secondary accent */
  --color-danger: #ff3b57;  /* Error/delete color */
}
```

#### Change Fonts

Edit font import in `css/style.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=YourFont');

:root {
  --font-main: 'YourFont', sans-serif;
  --font-mono: 'YourMonoFont', monospace;
}
```

#### Add Categories

Edit `home.html` - Add to both dropdowns:
```html
<optgroup label="Your Group">
  <option>Your Category</option>
</optgroup>
```

#### Auto-refresh Interval

Edit `js/home.js`:
```javascript
// Change from 5 minutes to your preferred interval
setInterval(() => {
  loadExpensesAndTotals();
}, 10 * 60 * 1000); // 10 minutes
```

---

## 📁 Project Structure

```
expense-tracker/
├── index.html              # Login/Signup page
├── home.html              # Dashboard (main app)
├── reset-password.html    # Password reset page
│
├── css/
│   └── style.css          # All styles (1200+ lines)
│
├── js/
│   ├── supabase.js        # Supabase configuration
│   ├── auth.js            # Authentication logic
│   ├── auth-guard.js      # Route protection
│   ├── home.js            # Dashboard functionality
│   ├── reset-password.js  # Password reset logic
│   └── toast.js           # Notification system
│
├── screenshots/           # App screenshots
│   ├── dashboard.png
│   ├── transactions.png
│   ├── filters.png
│   └── mobile.png
│
├── docs/
│   ├── BACKEND_IMPROVEMENTS.md
│   ├── FILTER_EXPORT_GUIDE.md
│   └── CATEGORY_GUIDE.md
│
├── README.md              # This file
├── LICENSE               # MIT License
└── .gitignore           # Git ignore rules
```

### File Descriptions

| File | Purpose | Lines |
|------|---------|-------|
| `index.html` | Authentication page with sign in/up | ~70 |
| `home.html` | Main dashboard with all features | ~350 |
| `reset-password.html` | Password reset form | ~40 |
| `style.css` | Complete styling with responsive design | ~1200 |
| `auth.js` | Login, signup, password reset | ~350 |
| `auth-guard.js` | Session management & protection | ~80 |
| `home.js` | Dashboard, CRUD, filters, exports | ~750 |
| `toast.js` | Notification queue system | ~90 |

---

## 🔌 API Documentation

### Supabase Endpoints Used

#### Authentication

```javascript
// Sign Up
supabaseClient.auth.signUp({ email, password })

// Sign In
supabaseClient.auth.signInWithPassword({ email, password })

// Sign Out
supabaseClient.auth.signOut()

// Get User
supabaseClient.auth.getUser()

// Reset Password
supabaseClient.auth.resetPasswordForEmail(email, options)

// Update Password
supabaseClient.auth.updateUser({ password })
```

#### Database Operations

```javascript
// Insert Profile
supabaseClient.from("profiles")
  .insert([{ id, name, email }])

// Update Profile
supabaseClient.from("profiles")
  .upsert({ id, name })

// Get Profile
supabaseClient.from("profiles")
  .select("name")
  .eq("id", userId)
  .maybeSingle()

// Insert Expense
supabaseClient.from("expenses")
  .insert([{ user_id, title, amount, category, expense_date }])

// Get Expenses
supabaseClient.from("expenses")
  .select("*")
  .eq("user_id", userId)
  .order("expense_date", { ascending: false })

// Delete Expense
supabaseClient.from("expenses")
  .delete()
  .eq("id", expenseId)
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Contribution Guidelines

- Follow existing code style
- Add comments for complex logic
- Test thoroughly before submitting
- Update documentation if needed
- One feature per pull request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/expense-tracker.git

# Create branch
git checkout -b feature/my-feature

# Make changes and test locally
# Use Live Server or python -m http.server

# Commit and push
git add .
git commit -m "Description of changes"
git push origin feature/my-feature
```

### Bug Reports

Use GitHub Issues with:
- Clear title
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser and OS information

### Feature Requests

Open an issue with:
- Clear use case
- Why it's needed
- Proposed implementation (optional)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Expense Tracker

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Contact

**Project Maintainer:** Your Name

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com
- LinkedIn: [Your Name](https://linkedin.com/in/yourprofile)

**Project Link:** [https://github.com/yourusername/expense-tracker](https://github.com/yourusername/expense-tracker)

**Live Demo:** [https://your-expense-tracker.netlify.app](https://your-expense-tracker.netlify.app)

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) - Backend infrastructure
- [Google Fonts](https://fonts.google.com/) - Sora & Space Mono fonts
- [Shields.io](https://shields.io/) - README badges
- Icons from Unicode emoji standard

---

## 🗺️ Roadmap

### Version 1.1 (Planned)
- [ ] Budget planning & alerts
- [ ] Recurring transactions
- [ ] Multi-currency support
- [ ] Charts and analytics
- [ ] Dark/Light theme toggle

### Version 1.2 (Planned)
- [ ] Bill reminders
- [ ] Split expenses
- [ ] Export to Excel with formatting
- [ ] Bulk import from CSV
- [ ] Custom categories

### Version 2.0 (Future)
- [ ] Mobile apps (iOS/Android)
- [ ] Bank account integration
- [ ] Receipt scanning
- [ ] Financial insights AI
- [ ] Social features (shared expenses)

---

## 📊 Statistics

![GitHub stars](https://img.shields.io/github/stars/yourusername/expense-tracker?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/expense-tracker?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/expense-tracker)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/expense-tracker)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ and ☕

[Back to Top](#-expense-tracker)

</div>
