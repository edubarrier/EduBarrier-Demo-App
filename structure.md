# EduBarrier - Project Structure Documentation

## Project Overview
React educational platform connecting parents and children through educational assignments that earn screen time rewards.

---

## Tech Stack
- **Framework**: React 18 with Hooks
- **UI Library**: lucide-react for icons
- **Styling**: Tailwind CSS (utility classes)
- **Storage**: Browser localStorage API (persistent storage)
- **File Type**: Single-file .jsx component

---

## Storage System

### Implementation
```javascript
const storage = {
  async get(key) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  async set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  }
}
```

### Storage Keys
- `session` - Current logged-in user
- `users` - Array of all user accounts
- `fam-{familyId}` - Family/household data
- `assigns-{familyId}` - Course assignments for family

---

## Architecture

### User Roles

#### 1. Admin Account (NEW!)
- **Full system access** to manage platform
- Create and edit courses
- Manage subject categories  
- Reset user passwords
- Fix account issues
- View system statistics
- Access: admin@edubarrier.com / admin2025

#### 2. Parent Account
- Creates/joins households with 4-character alphanumeric codes (e.g., "AB12", "XY9Z")
- Assigns courses to children
- Sets time rewards (5-60 minutes) and passing scores (50-100%)
- Views children's progress and statistics
- Edits household name and manages children
- Cannot change household code (generated once, permanent)

#### 2. Child Account
- Joins household with parent's code
- Completes assigned courses (intro → lessons → summary → quiz)
- Takes quizzes to earn screen time
- Tracks remaining time and usage
- Views course progress

### Household Code Generation
- **Format**: 4 characters, alphanumeric
- **Characters Used**: A-Z (excluding O, I), 2-9 (excluding 0, 1)
- **Example codes**: AB12, XY9Z, PQ45
- **Generated**: Once per household, cannot be changed
- **Purpose**: Family members join by entering this code

---

## Core Components

### App Component
- Main router and authentication handler
- Manages login/signup flow
- Routes to ParentView or ChildView based on role
- Handles session persistence

### ParentView Component
- **Tabs**: Home, Household, Courses, Settings
- **States**: 
  - `fam` - Current family data
  - `kids` - Array of children in household
  - `assigns` - Course assignments
  - `editingHousehold` - Boolean for name editing mode
  - `householdName` - Temp storage for name input
  - `message` - Success/error messages
- **Key Functions**:
  - `load()` - Fetches family, children, and assignments
  - `updateHouseholdName()` - Saves new household name
  - `doAssign()` - Creates new course assignment
  - `updateChildInfo()` - Edits child account details
  - `deleteChild()` - Removes child from household

### ChildView Component
- Shows available courses and screen time
- Handles course progression and quiz taking
- Manages time earned vs time used
- Displays results and rewards

---

## Data Structures

### User Object
```javascript
{
  id: 'u1234567890',           // Unique identifier
  email: 'user@example.com',    // Login email
  password: 'password',          // Plain text (demo only)
  name: 'John Doe',             // Display name
  role: 'parent' | 'child',     // Account type
  familyId: 'fam1234567890'     // Associated household
}
```

### Family Object
```javascript
{
  id: 'fam1234567890',          // Unique identifier
  name: 'Smith Family',         // Editable household name
  code: 'AB12',                 // 4-char alphanumeric code (permanent)
  parents: ['u123', 'u456'],    // Array of parent user IDs
  children: ['u789', 'u012']    // Array of child user IDs
}
```

### Assignment Object
```javascript
{
  id: 'a1234567890',            // Unique identifier
  childId: 'u789',              // Target child
  courseId: 'math1',            // Course to complete
  mins: 15,                     // Time reward (minutes)
  pass: 70,                     // Passing score (percentage)
  status: 'pending' | 'completed', // Completion status
  score: 85                     // Quiz score (only if completed)
}
```

### Course Object
```javascript
{
  id: 'math1',                  // Unique identifier
  title: 'Basic Math',          // Display name
  category: 'Math',             // Subject category
  subject: 'Math',              // For filtering
  desc: 'Learn addition...',    // Short description
  intro: 'Welcome to...',       // Introduction text
  sections: [                   // Lesson sections
    { 
      title: 'Addition', 
      text: 'Addition combines...' 
    }
  ],
  summary: 'Great job!',        // Final summary
  questions: [                  // Quiz questions
    {
      q: 'What is 5+3?',        // Question text
      opts: ['8', '7', '9'],    // Answer options
      ans: 0                    // Correct answer index
    }
  ]
}
```

---

## File Organization
- **Production File**: `/mnt/user-data/outputs/edubarrier.jsx`
- **Documentation**: `/mnt/user-data/outputs/structure.md`
- Always update both when making changes

---

## Code Conventions

### Component Style
- Use functional components with hooks
- Arrow functions for components
- Destructure props in parameters

### Styling
- Tailwind utility classes only
- Gradient backgrounds: `from-{color}-600 to-{color}-600`
- Rounded corners: `rounded-3xl` (cards), `rounded-xl` (buttons)
- Consistent spacing: `mb-4`, `mb-6`, `p-6`, `p-8`

### Icons
From lucide-react:
- `Book` - Courses/education
- `Users` - Children/family
- `Trophy` - Achievements
- `XCircle` - Close/error
- `Plus` - Add new
- `LogOut` - Sign out
- `Eye`/`EyeOff` - Password visibility

### State Management
- `useState` for local state only
- No external state management
- Storage handled via localStorage

---

## Key Features

### 1. Authentication System
- Login with email/password
- Signup for parent or child accounts
- Demo account: demo@parent.com / demo
- Session persistence via localStorage

### 2. Household Management
- Create new household → generates unique 4-char code
- Join existing household → enter code
- Edit household name (both in Household tab and Settings)
- View and copy household code
- Sync children feature (repairs broken family links)

### 3. Course Assignment
- Parent selects child and course
- Set time reward (5-60 minutes in 5-min increments)
- Set passing score (50-100% in 5% increments)
- Preview courses before assigning

### 4. Course Completion
- Multi-section lessons with navigation
- Progress indicator
- Quiz at the end
- Immediate feedback on pass/fail
- Time reward only on passing

### 5. Screen Time Tracking
- Shows remaining time
- Displays total earned vs used
- Visual progress bar
- Updates when courses completed

### 6. Child Management
- Edit child name, email, password
- View child statistics
- Remove child from household
- View child's assignment history

---

## Course Library

### Available Courses
1. **Basic Math** (Math)
   - 4 sections: Addition, Subtraction, Multiplication, Division
   - 10 quiz questions

2. **Reading Skills** (Reading)
   - 4 sections: Main Ideas, Inferences, Context Clues, Story Elements
   - 10 quiz questions

3. **Basic Science** (Science)
   - 3 sections: Scientific Method, Matter, Energy
   - 5 quiz questions

4. **American History Basics** (History)
   - 3 sections: Colonial America, Revolution, Constitution
   - 4 quiz questions

---

## Recent Changes (November 3, 2025)

### Version 1.2.1 - UX Improvements

**NEW FEATURES:**
1. **Always Start at Login Screen**
   - App now always opens to login screen
   - No automatic session restoration
   - Users must log in each time for security
   - Previous session data cleared on startup

2. **Parent Logout Button**
   - Added logout button to parent dashboard header (top right)
   - Matches child account UI pattern
   - Easy access from any tab
   - Consistent logout experience across all roles

**BUG FIXES:**
1. **Fixed White Screen in Manage Tab**
   - Resolved orphaned React hooks issue
   - Created separate ChildCard component
   - Proper hook usage at component top level
   - Manage tab now renders correctly

### Version 1.2.0 - Timer Controls & Screen Lock

**NEW FEATURES:**
1. **Child Timer Pause/Play Controls**
   - Children can pause timer when stepping away
   - Start/stop earned screen time on demand
   - Timer only counts down when active
   - Visual status indicators (green = active, gray = paused)
   - Saves unused time for later use

2. **Parent Manual Lock/Unlock**
   - Lock individual child's screen access instantly
   - Per-child lock controls in Household tab
   - Lock status displays on child's card
   - Auto-pauses timer when locked
   - Independent of earned time amount

3. **Real-Time Status Sync**
   - Lock status checks every 5 seconds
   - Timer state persists across refreshes
   - Immediate visual feedback
   - Alert messages for state changes

**Storage Keys Added:**
- `timer-running-{childId}` - Boolean timer state
- `child-locked-{childId}` - Boolean lock state

### Version 1.1.0 - Admin Panel Added

**NEW FEATURES:**
1. **Complete Admin Interface**
   - Dashboard with system statistics
   - Course creation and management
   - Subject category management
   - User management and password resets
   - Account issue resolution tools

2. **Dynamic Course System**
   - Courses now stored in localStorage (not hardcoded)
   - Admins can create unlimited courses
   - Courses automatically appear for all parents
   - Full CRUD operations (Create, Read, Update, Delete)

3. **Subject Management**
   - Add custom subject categories
   - Delete unused subjects
   - Subjects automatically populate course dropdown

4. **User Management Tools**
   - Search users by name or email
   - Reset any user's password
   - Fix broken account links
   - Delete problematic accounts
   - View user details and family connections

**Admin Access:**
- Email: admin@edubarrier.com
- Password: admin2025

### Fixed Issues (Earlier)
1. **Storage System**
   - Changed from non-existent `window.storage` to `localStorage`
   - Now data persists across page refreshes
   - Added error handling and logging

2. **Household Code Display**
   - Changed from 4-digit numbers to 4-char alphanumeric
   - Format: Mix of uppercase letters and numbers
   - Excludes confusing characters (0, O, 1, I)
   - Demo account code: "AB12"

3. **Household Name Editing**
   - Fixed "Loading..." issue in both Manage and Settings tabs
   - Edit button properly initializes input field
   - Save button now updates data in localStorage
   - Changes reflect immediately across all tabs
   - Auto-dismissing success message

4. **Data Loading**
   - Improved load() function with error handling
   - Added debug logging
   - Initializes householdName state on load
   - Better null checking

5. **Debug Features**
   - Added "Debug Storage" button in Settings
   - Logs all storage data to console
   - Helps troubleshoot data issues

---

## Known Patterns

### Colors
- **Primary**: Teal/Emerald gradient (`from-teal-600 to-emerald-600`)
- **Secondary**: Blue gradient for stats
- **Success**: Green (`bg-green-500`, `text-green-600`)
- **Warning**: Orange (`bg-orange-100`, `text-orange-700`)
- **Error**: Red (`bg-red-500`)

### Layout
- **Container**: `max-w-6xl mx-auto p-4`
- **Cards**: `bg-white rounded-3xl shadow-lg p-6`
- **Buttons**: `bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3 rounded-xl font-semibold`
- **Inputs**: `border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none`

---

## Testing Checklist

### After Making Changes
- [ ] Log in with demo account (demo@parent.com / demo)
- [ ] Verify household name displays correctly
- [ ] Verify household code shows (not "----")
- [ ] Edit household name in Settings tab
- [ ] Verify name updates in Household tab too
- [ ] Create child account and join with code
- [ ] Assign course to child
- [ ] Log in as child and complete course
- [ ] Verify time is earned
- [ ] Check browser console for errors

---

## Future Enhancements
- [ ] User profile pictures
- [ ] Multiple household support for parents
- [ ] Course creation by parents
- [ ] Weekly reports
- [ ] Time scheduling (restrict screen time to certain hours)
- [ ] Achievement badges
- [ ] Course recommendations
- [ ] Export/import family data
- [ ] Email notifications
- [ ] Password reset functionality
- [ ] Secure password hashing
- [ ] API backend integration

---

## Troubleshooting

### "Loading..." Persists
1. Open browser console (F12)
2. Check for errors
3. Click "Debug Storage" in Settings
4. Verify family data exists in localStorage
5. Check familyId matches between user and family

### Household Code Shows "----"
1. Clear localStorage and log in again
2. For demo account, code should be "AB12"
3. For new accounts, code should be 4 alphanumeric characters
4. Check console logs for family data

### Changes Don't Save
1. Check browser console for errors
2. Verify localStorage is enabled in browser
3. Try in incognito/private mode
4. Check if localStorage quota exceeded

### Children Not Showing
1. Click "Sync Children" button in Household tab
2. Verify child used correct household code
3. Check family.children array in debug output

---

Last Updated: November 3, 2025
Version: 1.2.1
