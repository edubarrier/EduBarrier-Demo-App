import React, { useState, useEffect } from 'react';
import { Book, Users, Trophy, XCircle, Plus, LogOut, Eye, EyeOff, Trash2 } from 'lucide-react';
import { storage, db, supabase, ensureUserInDatabase } from './supabase';

// Default courses - these will be loaded into storage on first run
const defaultCourses = [
  {
    id: 'math1',
    title: 'Basic Math',
    category: 'Math',
    subject: 'Math',
    desc: 'Learn addition, subtraction, multiplication, division',
    intro: 'Welcome to Basic Math! Learn fundamental operations.',
    sections: [
      { title: 'Addition', text: 'Addition combines numbers. Example: 5 plus 3 equals 8.' },
      { title: 'Subtraction', text: 'Subtraction takes away. Example: 10 minus 3 equals 7.' },
      { title: 'Multiplication', text: 'Multiplication repeats addition. Example: 4 times 3 equals 12.' },
      { title: 'Division', text: 'Division splits into groups. Example: 12 divided by 4 equals 3.' }
    ],
    summary: 'Great job! You learned the four basic operations.',
    questions: [
      { q: 'What is 15 plus 27?', opts: ['42', '41', '43', '40'], ans: 0 },
      { q: 'What is 56 minus 23?', opts: ['33', '32', '34', '31'], ans: 0 },
      { q: 'What is 8 times 7?', opts: ['54', '56', '58', '52'], ans: 1 },
      { q: 'What is 72 divided by 9?', opts: ['7', '8', '9', '6'], ans: 1 },
      { q: 'Is 5 plus 5 equal to 10?', opts: ['True', 'False'], ans: 0 },
      { q: 'What is 89 plus 34?', opts: ['123', '122', '124', '121'], ans: 0 },
      { q: 'What is 100 minus 47?', opts: ['52', '53', '54', '51'], ans: 1 },
      { q: 'What is 12 times 6?', opts: ['70', '72', '74', '68'], ans: 1 },
      { q: 'Multiplication is repeated addition', opts: ['True', 'False'], ans: 0 },
      { q: 'What is 45 divided by 5?', opts: ['8', '9', '10', '7'], ans: 1 }
    ]
  },
  {
    id: 'reading1',
    title: 'Reading Skills',
    category: 'Reading',
    subject: 'Reading',
    desc: 'Improve comprehension and understanding',
    intro: 'Learn to understand what you read better.',
    sections: [
      { title: 'Main Ideas', text: 'The main idea is the central message. Look for it in titles and topic sentences.' },
      { title: 'Inferences', text: 'An inference is reading between the lines using clues from the text.' },
      { title: 'Context Clues', text: 'Context clues help you figure out unknown words from surrounding text.' },
      { title: 'Story Elements', text: 'Stories have characters, setting, plot, conflict, and theme.' }
    ],
    summary: 'Excellent work! You learned key reading strategies.',
    questions: [
      { q: 'What is the main idea?', opts: ['Theme', 'Summary', 'Central message', 'Title'], ans: 2 },
      { q: 'Who tells the story?', opts: ['Author', 'Narrator', 'Character', 'Reader'], ans: 1 },
      { q: 'Topic sentences are always first', opts: ['True', 'False'], ans: 1 },
      { q: 'Which helps you understand?', opts: ['Reading fast', 'Asking questions', 'Skipping', 'Once only'], ans: 1 },
      { q: 'Context clues help with words', opts: ['True', 'False'], ans: 0 },
      { q: 'The turning point is called?', opts: ['Exposition', 'Climax', 'Resolution', 'Theme'], ans: 1 },
      { q: 'The protagonist is always good', opts: ['True', 'False'], ans: 1 },
      { q: 'Setting means?', opts: ['Characters', 'Time and place', 'Theme', 'Plot'], ans: 1 },
      { q: 'Inference is reading between lines', opts: ['True', 'False'], ans: 0 },
      { q: 'Details support the main idea', opts: ['True', 'False'], ans: 0 }
    ]
  },
  {
    id: 'science1',
    title: 'Basic Science',
    category: 'Science',
    subject: 'Science',
    desc: 'Explore the scientific method and basic concepts',
    intro: 'Welcome to Science! Learn how scientists discover new things.',
    sections: [
      { title: 'Scientific Method', text: 'Scientists ask questions, make hypotheses, test them, and draw conclusions.' },
      { title: 'Matter', text: 'Matter is anything that takes up space. It can be solid, liquid, or gas.' },
      { title: 'Energy', text: 'Energy is the ability to do work. It comes in many forms like heat and light.' }
    ],
    summary: 'Great work learning basic science concepts!',
    questions: [
      { q: 'What is the first step of scientific method?', opts: ['Test', 'Ask a question', 'Conclude', 'Observe'], ans: 1 },
      { q: 'Ice is what state of matter?', opts: ['Solid', 'Liquid', 'Gas', 'Plasma'], ans: 0 },
      { q: 'Energy can be destroyed', opts: ['True', 'False'], ans: 1 },
      { q: 'What gives us light and heat?', opts: ['Moon', 'Sun', 'Stars', 'Planets'], ans: 1 },
      { q: 'A hypothesis is an educated guess', opts: ['True', 'False'], ans: 0 }
    ]
  },
  {
    id: 'history1',
    title: 'American History Basics',
    category: 'History',
    subject: 'History',
    desc: 'Learn key events in American history',
    intro: 'Discover important moments in American history.',
    sections: [
      { title: 'Colonial America', text: 'The 13 colonies were established along the Atlantic coast in the 1600s.' },
      { title: 'Revolution', text: 'America fought for independence from Britain in 1776.' },
      { title: 'Constitution', text: 'The Constitution was written in 1787 to establish our government.' }
    ],
    summary: 'Excellent! You learned about early American history.',
    questions: [
      { q: 'When was the Declaration signed?', opts: ['1776', '1787', '1800', '1812'], ans: 0 },
      { q: 'How many original colonies?', opts: ['10', '12', '13', '15'], ans: 2 },
      { q: 'The Constitution established our government', opts: ['True', 'False'], ans: 0 },
      { q: 'Who did America fight for independence?', opts: ['France', 'Spain', 'Britain', 'Germany'], ans: 2 }
    ]
  }
];

const App = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [loading, setLoading] = useState(true); // Add loading state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [signup, setSignup] = useState(false);
  const [type, setType] = useState('parent');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [householdAction, setHouseholdAction] = useState('create'); // 'create' or 'join'
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState(''); // for new household creation

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    // Initialize courses in database if they don't exist
    try {
      const existingCourses = await db.getAllCourses();
      if (!existingCourses || existingCourses.length === 0) {
        // Add default courses to database
        for (const course of defaultCourses) {
          await db.createCourse(course);
        }
      }
    } catch (err) {
      console.error('Error initializing courses:', err);
    }
    
    // Initialize subjects in database if they don't exist
    try {
      const existingSubjects = await db.getAllSubjects();
      if (!existingSubjects || existingSubjects.length === 0) {
        const defaultSubjects = ['Math', 'Reading', 'Science', 'History'];
        for (const subject of defaultSubjects) {
          await db.createSubject(subject);
        }
      }
    } catch (err) {
      console.error('Error initializing subjects:', err);
    }
    
    // Restore session if it exists (fixes browser refresh logout issue)
    try {
      const savedSession = await storage.get('session');
      if (savedSession) {
        // Verify user still exists in database
        const userExists = await db.getUser(savedSession.email);
        if (userExists) {
          setUser(savedSession);
          if (savedSession.role === 'admin') {
            setView('admin');
          } else if (savedSession.role === 'parent') {
            setView('parent');
          } else if (savedSession.role === 'child') {
            setView('child');
          }
        } else {
          // User was deleted, clear session
          await storage.remove('session');
        }
      }
    } catch (err) {
      console.error('Error restoring session:', err);
      await storage.remove('session');
    }
    
    // Done loading
    setLoading(false);
  };

  const generateHouseholdCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters like 0, O, 1, I
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleLogin = async () => {
    setError('');
    setSuccessMessage('');
    
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    
    // Admin login - ensure admin exists in database
    if (email === 'admin@edubarrier.com' && password === 'admin2025') {
      let adminUser = await db.getUser(email);
      if (!adminUser) {
        const admin = { 
          id: 'admin', 
          email: 'admin@edubarrier.com', 
          password: 'admin2025',
          name: 'Admin', 
          role: 'admin',
          familyId: null
        };
        await db.createUser(admin);
        adminUser = admin;
      }
      
      await storage.set('session', adminUser);
      setUser(adminUser);
      setView('admin');
      return;
    }
    
    // Demo parent login - ensure in database with proper family structure
    if (email === 'demo@parent.com' && password === 'demo') {
      try {
        let demoParent = await db.getUser(email);
        
        // If demo parent doesn't exist, create the full demo family structure
        if (!demoParent) {
          // Generate a household code
          const householdCode = generateHouseholdCode();
          
          // Create the demo family first (families table only has: id, name, code)
          const demoFamilyId = `family_demo_${Date.now()}`;
          const demoFamily = {
            id: demoFamilyId,
            name: 'Demo Family',
            code: householdCode
          };
          await db.createFamily(demoFamily);
          
          // Create demo parent user linked to family (use family_id for database)
          demoParent = { 
            id: 'demo_parent', 
            email: 'demo@parent.com', 
            password: 'demo',
            role: 'parent', 
            name: 'Demo Parent', 
            family_id: demoFamilyId  // Changed from familyId to family_id
          };
          await db.createUser(demoParent);
          
          // Create demo child user linked to same family
          const demoChild = { 
            id: 'demo_child', 
            email: 'demo@child.com', 
            password: 'demo',
            role: 'child', 
            name: 'Demo Child', 
            family_id: demoFamilyId  // Changed from familyId to family_id
          };
          await db.createUser(demoChild);
          
          // Initialize child settings
          await db.updateChildSettings({
            childId: 'demo_child',
            isLocked: false,
            timerRunning: false,
            timeEarned: 0,
            timeUsed: 0
          });
          
          console.log('Demo family created:', demoFamilyId, 'with code:', householdCode);
        }
        
        await storage.set('session', demoParent);
        setUser(demoParent);
        setView('parent');
        return;
      } catch (error) {
        console.error('Demo parent login error:', error);
        setError('Demo account setup failed. Please try again.');
        return;
      }
    }
    
    // Demo child login - ensure in database and linked to demo family
    if (email === 'demo@child.com' && password === 'demo') {
      try {
        let demoChild = await db.getUser(email);
        
        // If demo child doesn't exist, they should have been created with parent
        // This means we need to create the full structure
        if (!demoChild) {
          // Check if demo parent exists
          let demoParent = await db.getUser('demo@parent.com');
          
          if (!demoParent) {
            // Neither exists, create everything
            const householdCode = generateHouseholdCode();
            const demoFamilyId = `family_demo_${Date.now()}`;
            
            // Create family (only id, name, code - no parents/children arrays)
            const demoFamily = {
              id: demoFamilyId,
              name: 'Demo Family',
              code: householdCode
            };
            await db.createFamily(demoFamily);
            
            demoParent = { 
              id: 'demo_parent', 
              email: 'demo@parent.com', 
              password: 'demo',
              role: 'parent', 
              name: 'Demo Parent', 
              family_id: demoFamilyId  // Changed from familyId to family_id
            };
            await db.createUser(demoParent);
            
            demoChild = { 
              id: 'demo_child', 
              email: 'demo@child.com', 
              password: 'demo',
              role: 'child', 
              name: 'Demo Child', 
              family_id: demoFamilyId  // Changed from familyId to family_id
            };
            await db.createUser(demoChild);
          } else {
            // Parent exists, just create child linked to their family
            demoChild = { 
              id: 'demo_child', 
              email: 'demo@child.com', 
              password: 'demo',
              role: 'child', 
              name: 'Demo Child', 
              family_id: demoParent.family_id  // Changed from familyId to family_id
            };
            await db.createUser(demoChild);
          }
          
          // Initialize child settings
          await db.updateChildSettings({
            childId: 'demo_child',
            isLocked: false,
            timerRunning: false,
            timeEarned: 0,
            timeUsed: 0
          });
        }
        
        await storage.set('session', demoChild);
        setUser(demoChild);
        setView('child');
        return;
      } catch (error) {
        console.error('Demo child login error:', error);
        setError('Demo account setup failed. Please try again.');
        return;
      }
    }

    try {
      // Try Supabase Auth first (this is the authoritative source)
      const { data, error: authError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (data?.user) {
        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          setError('Please verify your email before logging in. Check your inbox for the verification link.');
          await supabase.auth.signOut();
          return;
        }

        // Ensure user exists in our users table
        await ensureUserInDatabase(data.user);
        
        // Fetch full user data from our database
        const fullUser = await db.getUser(data.user.email);
        
        if (fullUser) {
          await storage.set('session', fullUser);
          setUser(fullUser);
          setView(fullUser.role === 'admin' ? 'admin' : 
                 fullUser.role === 'parent' ? 'parent' : 'child');
        } else {
          setError('User account not found in database. Please contact support.');
        }
        return;
      }

      // If Supabase Auth fails, try database direct login (for accounts created before auth)
      if (authError) {
        const dbUser = await db.getUser(email);
        if (dbUser && dbUser.password === password) {
          await storage.set('session', dbUser);
          setUser(dbUser);
          setView(dbUser.role === 'admin' ? 'admin' : 
                 dbUser.role === 'parent' ? 'parent' : 'child');
          return;
        }
        
        setError('Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
    }
  };

  const handleSignup = async () => {
    setError('');
    setSuccessMessage('');
    
    if (!email || !password || !name) {
      setError('Please fill in all fields');
      return;
    }
    
    // Additional validation for parent creating new household
    if (type === 'parent' && householdAction === 'create' && !newHouseholdName.trim()) {
      setError('Please enter a household name');
      return;
    }

    if (type === 'child' && !code) {
      setError('Please enter household code');
      return;
    }

    if (type === 'parent' && householdAction === 'join' && !code) {
      setError('Please enter household code');
      return;
    }

    try {
      // Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            name, 
            role: type,
            householdName: type === 'parent' && householdAction === 'create' ? newHouseholdName.trim() : null,
            householdAction: type === 'parent' ? householdAction : null,
            householdCode: (type === 'child' || householdAction === 'join') ? code : null
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('This email is already registered. Please log in instead.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      // Show success message and don't log in yet
      setSuccessMessage('OK Account created! Check your email for a verification link.');
      setSignup(false);
      setEmail('');
      setPassword('');
      setName('');
      setCode('');
      setNewHouseholdName('');

    } catch (err) {
      console.error('Signup error:', err);
      setError('An error occurred during signup. Please try again.');
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setSuccessMessage('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccessMessage('OK Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
      setEmail('');
    } catch (err) {
      console.error('Password reset error:', err);
      setError('An error occurred. Please try again.');
    }
  };

  const handleLogout = async () => {
    await storage.set('session', null);
    setUser(null);
    setView('login');
    setEmail('');
    setPassword('');
    setName('');
  };

  // Auth Callback Component
  const AuthCallback = () => {
    const [loading, setLoading] = useState(true);
    const [callbackError, setCallbackError] = useState('');
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
      handleAuthCallback();
    }, []);

    const handleAuthCallback = async () => {
      try {
        // Get the authenticated user
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

        if (userError || !authUser) {
          setCallbackError('Authentication failed. Please try logging in again.');
          setLoading(false);
          return;
        }

        // Ensure user exists in our database
        const dbUser = await ensureUserInDatabase(authUser);
        
        // Get full user data
        const fullUser = await db.getUser(authUser.email);
        
        if (!fullUser) {
          setCallbackError('Unable to create user account. Please contact support.');
          setLoading(false);
          return;
        }

        // Save session
        await storage.set('session', fullUser);
        
        // Show success and redirect
        setLoading(false);
        setRedirecting(true);
        
        setTimeout(() => {
          setUser(fullUser);
          setView(fullUser.role === 'admin' ? 'admin' : 
                 fullUser.role === 'parent' ? 'parent' : 'child');
        }, 2000);

      } catch (err) {
        console.error('Auth callback error:', err);
        setCallbackError('An unexpected error occurred. Please try logging in again.');
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
          {loading && (
            <>
              <div className="mb-6">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600"></div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Verifying your email...</h2>
              <p className="text-gray-600">Please wait while we set up your account.</p>
            </>
          )}

          {redirecting && (
            <>
              <div className="mb-6 text-green-500">
                <svg className="inline-block w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-green-600">Email verified!</h2>
              <p className="text-gray-600">Redirecting to your dashboard...</p>
            </>
          )}

          {callbackError && (
            <>
              <div className="mb-6 text-red-500">
                <XCircle className="inline-block w-16 h-16" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-red-600">Verification Failed</h2>
              <p className="text-gray-600 mb-6">{callbackError}</p>
              <button
                onClick={() => {
                  setView('login');
                  window.history.pushState({}, '', '/');
                }}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // Check if we're on the auth callback route
  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback />;
  }

  // Show loading screen while checking session
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <img 
                src="data:image/webp;base64,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" 
                alt="EduBarrier Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">EduBarrier</h1>
            <p className="text-gray-600 mt-2">Learn First. Play Later.</p>
          </div>

          {signup && (
            <div className="space-y-4 mb-6">
              <div className="flex gap-2">
                <button onClick={() => setType('parent')} className={'flex-1 py-2 px-4 rounded-lg font-medium ' + (type === 'parent' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600')}>
                  Parent
                </button>
                <button onClick={() => setType('child')} className={'flex-1 py-2 px-4 rounded-lg font-medium ' + (type === 'child' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600')}>
                  Child
                </button>
              </div>

              {type === 'parent' && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Household Setup</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setHouseholdAction('create')}
                      className={'flex-1 py-2 px-3 rounded-lg text-sm font-medium ' + (householdAction === 'create' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 border border-gray-300')}
                    >
                      Create New
                    </button>
                    <button
                      onClick={() => setHouseholdAction('join')}
                      className={'flex-1 py-2 px-3 rounded-lg text-sm font-medium ' + (householdAction === 'join' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 border border-gray-300')}
                    >
                      Join Existing
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}
            
            {signup && <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500" />}
            {signup && type === 'parent' && householdAction === 'create' && (
              <input
                type="text"
                placeholder="Household Name (e.g., Smith Family)"
                value={newHouseholdName}
                onChange={(e) => setNewHouseholdName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500"
              />
            )}
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500" />
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500" />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-gray-400">
                {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {!signup && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 transition"
                >
                  Forgot password?
                </button>
              </div>
            )}
            {signup && (type === 'child' || (type === 'parent' && householdAction === 'join')) && (
              <input
                type="text"
                placeholder="Household Code (4 characters)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength="4"
                className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500"
              />
            )}
            <button onClick={signup ? handleSignup : handleLogin} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition">
              {signup ? 'Sign Up' : 'Login'}
            </button>
            <button onClick={() => { setSignup(!signup); setError(''); setSuccessMessage(''); }} className="w-full text-indigo-600 py-2 text-sm hover:text-indigo-700 transition">
              {signup ? 'Have account? Login' : 'Need account? Sign Up'}
            </button>
          </div>

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
                <p className="text-gray-600 mb-4">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                {error && <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
                {successMessage && <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{successMessage}</div>}
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:border-indigo-500 focus:outline-none mb-4"
                />
                <div className="flex gap-3">
                  <button 
                    onClick={() => { setShowForgotPassword(false); setError(''); setSuccessMessage(''); }} 
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleForgotPassword} 
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
                  >
                    Send Reset Link
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'admin') {
    return <AdminView user={user} onLogout={handleLogout} />;
  }

  if (view === 'parent') {
    return <ParentView user={user} onLogout={handleLogout} />;
  }

  return <ChildView user={user} onLogout={handleLogout} />;
};

const ParentView = ({ user, onLogout }) => {
  const [tab, setTab] = useState('home');
  const [fam, setFam] = useState(null);
  const [kids, setKids] = useState([]);
  const [assigns, setAssigns] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selKid, setSelKid] = useState('');
  const [selCourse, setSelCourse] = useState('');
  const [mins, setMins] = useState(30);
  const [passScore, setPassScore] = useState(80);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [editingChild, setEditingChild] = useState(null);
  const [editingHousehold, setEditingHousehold] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [calendarChild, setCalendarChild] = useState('');
  const [previewCourse, setPreviewCourse] = useState(null);
  const [previewSection, setPreviewSection] = useState(0);

  useEffect(() => {
    load();
    // DISABLED: Main polling causes flickering with ChildCard polling
    // Real-time updates now handled by ChildCard component polling (lock status, time)
    // Manual refresh button available if needed
    /*
    if (!editingHousehold && !editingChild) {
      const interval = setInterval(load, 3000);
      return () => clearInterval(interval);
    }
    */
  }, [user.family_id || user.familyId, editingHousehold, editingChild]);

  // Helper to normalize assignment object (handle both snake_case from DB and camelCase from old code)
  const normalizeAssignment = (a) => ({
    ...a,
    childId: a.child_id || a.childId,
    familyId: a.family_id || a.familyId,
    courseId: a.course_id || a.courseId,
    passScore: a.pass_score || a.passScore,
    child_id: a.child_id || a.childId,
    family_id: a.family_id || a.familyId,
    course_id: a.course_id || a.courseId,
    pass_score: a.pass_score || a.passScore
  });

  const load = async () => {
    try {
      // User object from database has family_id (snake_case)
      const familyId = user.family_id || user.familyId;
      const f = await db.getFamily(familyId);
      console.log('Loaded family data:', f);
      setFam(f);
      if (f) {
        if (!editingHousehold) {
          setHouseholdName(f.name || '');
        }
        // Get all children in this family from database (by matching family_id in users table)
        const allUsers = await db.getAllUsers();
        const childUsers = allUsers.filter(u => (u.family_id || u.familyId) === familyId && u.role === 'child');
        console.log('Found children:', childUsers);
        setKids(childUsers);
      } else {
        console.warn('No family data found for:', familyId);
      }
      
      // Load assignments from database and normalize them
      const a = await db.getAssignmentsByFamily(familyId) || [];
      console.log('Loaded assignments from database:', a.length, 'assignments');
      console.log('Raw assignments:', a.map(asn => ({ id: asn.id, status: asn.status, course: asn.course_id || asn.courseId })));
      const normalizedAssignments = a.map(normalizeAssignment);
      console.log('Normalized assignments:', normalizedAssignments.map(asn => ({ id: asn.id, status: asn.status, course: asn.courseId })));
      setAssigns(normalizedAssignments);
      
      // Load courses from database
      const c = await db.getAllCourses() || defaultCourses;
      setCourses(c);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const doAssign = async () => {
    setMessage('');
    
    if (!selKid || !selCourse) {
      setMessage('Please select a child and course');
      return;
    }
    
    // Use snake_case for database columns
    const a = {
      id: 'a' + Date.now(),
      child_id: selKid,  // Changed from childId
      family_id: user.family_id || user.familyId,  // Changed from familyId
      course_id: selCourse,  // Changed from courseId
      mins: parseInt(mins),
      pass_score: parseInt(passScore),  // Changed from passScore
      status: 'pending',
      score: null
    };
    
    await db.createAssignment(a);
    const normalizedAssignment = normalizeAssignment(a);
    const updated = [...assigns, normalizedAssignment];
    setAssigns(updated);
    setSelKid('');
    setSelCourse('');
    setMessage('Course assigned successfully!');
  };

  const deleteAssignment = async (assignmentId) => {
    if (!confirm('Are you sure you want to delete this assignment? This cannot be undone.')) {
      return;
    }
    
    try {
      console.log('===== DELETE ASSIGNMENT START =====');
      console.log('Assignment ID to delete:', assignmentId);
      console.log('Current assigns count:', assigns.length);
      console.log('Current assigns:', assigns.map(a => ({ id: a.id, status: a.status, course: a.courseId })));
      
      // Delete from database and wait for confirmation
      const deleted = await db.deleteAssignment(assignmentId);
      
      if (!deleted) {
        throw new Error('Database deletion failed');
      }
      
      console.log('✅ Database deletion returned true');
      
      // Small delay to ensure database commit
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Waited 500ms for database commit');
      
      // Reload from database to get fresh data
      console.log('Reloading data from database...');
      await load();
      
      console.log('After reload - assigns count:', assigns.length);
      console.log('After reload - assigns:', assigns.map(a => ({ id: a.id, status: a.status, course: a.courseId })));
      console.log('===== DELETE ASSIGNMENT END =====');
      
      setMessage('Assignment deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('❌ Error deleting assignment:', error);
      setMessage('Error deleting assignment. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const updateHouseholdName = async () => {
    if (!householdName.trim()) {
      setMessage('Please enter a household name');
      return;
    }
    
    try {
      const f = await db.getFamily(user.familyId);
      if (f) {
        f.name = householdName.trim();
        await db.updateFamily(f);
        setFam(f);
        setEditingHousehold(false);
        setMessage('Household name updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error: Household not found');
      }
    } catch (error) {
      console.error('Error updating household name:', error);
      setMessage('Error updating household name');
    }
  };

  const updateChildInfo = async (childId, updates) => {
    try {
      // Check if email is being changed and if it already exists
      if (updates.email) {
        const existingUser = await db.getUserByEmail(updates.email);
        if (existingUser && existingUser.id !== childId) {
          setMessage('Email already exists');
          return;
        }
      }
      
      // Get current child data
      const currentChild = kids.find(k => k.id === childId);
      if (!currentChild) {
        setMessage('Child not found');
        return;
      }
      
      // Update in database with correct column names
      const updatedChild = {
        ...currentChild,
        ...updates,
        family_id: currentChild.family_id || currentChild.familyId
      };
      
      await db.updateUser(updatedChild);
      setEditingChild(null);
      setMessage('Child information updated successfully!');
      load();
    } catch (error) {
      console.error('Error updating child:', error);
      setMessage('Error updating child. Please try again.');
    }
  };

  const deleteChild = async (childId) => {
    if (!confirm('Are you sure you want to remove this child from your household?')) {
      return;
    }
    
    try {
      // Delete child's assignments from database
      const assignments = await db.getAssignmentsByFamily(user.family_id || user.familyId);
      const childAssignments = assignments.filter(a => (a.child_id || a.childId) === childId);
      for (const assignment of childAssignments) {
        await db.deleteAssignment(assignment.id);
      }
      
      // Delete child's settings from database
      await db.deleteChildSettings(childId);
      
      // Delete child user from database
      await db.deleteUser(childId);
      
      setMessage('Child removed successfully');
      load();
    } catch (error) {
      console.error('Error removing child:', error);
      setMessage('Error removing child. Please try again.');
    }
  };

  const toggleChildLock = async (childId) => {
    try {
      console.log('===== TOGGLE LOCK START =====');
      console.log('Child ID:', childId);
      
      // Get current settings from database
      const currentSettings = await db.getChildSettings(childId);
      console.log('Current settings from DB:', currentSettings);
      
      if (!currentSettings) {
        console.error('No settings found for child:', childId);
        setMessage('Error: Could not load child settings');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      
      // Handle both camelCase and snake_case from database
      const currentLockState = currentSettings.is_locked || currentSettings.isLocked || false;
      const newLockState = !currentLockState;
      
      console.log('Current lock state:', currentLockState);
      console.log('New lock state:', newLockState);
      
      // Update in database with snake_case (Supabase standard)
      await db.updateChildSettings(childId, {
        is_locked: newLockState,
        timer_running: newLockState ? false : (currentSettings.timer_running || currentSettings.timerRunning || false),
        time_earned: currentSettings.time_earned || currentSettings.timeEarned || 0,
        time_used: currentSettings.time_used || currentSettings.timeUsed || 0
      });
      
      console.log('Database updated with new lock state');
      console.log('===== TOGGLE LOCK END =====');
      
      setMessage(newLockState ? 'Child screen access locked' : 'Child screen access unlocked');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.log('Error toggling lock:', error);
      setMessage('Error toggling lock. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const clearChildTime = async (childId) => {
    if (!confirm('Are you sure you want to clear all of this child\'s screen time? This cannot be undone.')) {
      return;
    }
    
    // Get current settings
    const currentSettings = await db.getChildSettings(childId) || {
      childId,
      isLocked: false,
      timerRunning: false,
      timeEarned: 0,
      timeUsed: 0
    };
    
    // Reset time to zero
    await db.updateChildSettings(childId, {
      is_locked: currentSettings.isLocked || currentSettings.is_locked || false,
      timer_running: false, // Stop timer when clearing
      time_earned: 0,
      time_used: 0
    });
    
    setMessage('Child screen time cleared successfully');
    setTimeout(() => setMessage(''), 3000);
    
    // Force re-render
    const updatedKids = await db.getUsersByFamily(fam.id);
    setKids(updatedKids.filter(u => u.role === 'child'));
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === 'All' || course.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const subjects = ['All', ...new Set(courses.map(c => c.subject))];

  const NavIcon = ({ icon: Icon, label, active, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1 flex-1 py-2">
      <Icon size={24} className={active ? 'text-teal-700' : 'text-gray-600'} />
      <span className={'text-xs font-medium ' + (active ? 'text-teal-700' : 'text-gray-600')}>{label}</span>
    </button>
  );

  // Separate component for child card to properly use hooks
  const ChildCard = ({ child, assigns, editingChild, setEditingChild, updateChildInfo, deleteChild, toggleChildLock, clearChildTime }) => {
    const [isLocked, setIsLocked] = useState(false);
    const [actualTimeEarned, setActualTimeEarned] = useState(0);
    
    useEffect(() => {
      // Check lock status AND time earned from database
      const checkStatusAndTime = async () => {
        const settings = await db.getChildSettings(child.id);
        const newLockStatus = settings?.isLocked || settings?.is_locked || false;
        const newTimeEarned = settings?.timeEarned || settings?.time_earned || 0;
        
        // Only update state if values actually changed (prevents unnecessary re-renders)
        setIsLocked(prev => prev !== newLockStatus ? newLockStatus : prev);
        setActualTimeEarned(prev => prev !== newTimeEarned ? newTimeEarned : prev);
      };
      
      checkStatusAndTime();
      
      // Poll for changes every 3 seconds for real-time sync
      const interval = setInterval(checkStatusAndTime, 3000);
      
      return () => clearInterval(interval);
    }, [child.id]);
    
    const childAssigns = assigns.filter(a => a.childId === child.id);
    const completed = childAssigns.filter(a => a.status === 'completed').length;
    const totalTime = childAssigns.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.mins, 0);
    const isEditing = editingChild?.id === child.id;
    
    return (
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 border-2 border-teal-100">
        {isEditing ? (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Edit Child Info</h3>
            <input
              type="text"
              value={editingChild.name}
              onChange={(e) => setEditingChild({...editingChild, name: e.target.value})}
              placeholder="Name"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
            />
            <input
              type="email"
              value={editingChild.email}
              onChange={(e) => setEditingChild({...editingChild, email: e.target.value})}
              placeholder="Email"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
            />
            <input
              type="password"
              value={editingChild.password}
              onChange={(e) => setEditingChild({...editingChild, password: e.target.value})}
              placeholder="New Password (optional)"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => updateChildInfo(child.id, {
                  name: editingChild.name,
                  email: editingChild.email,
                  ...(editingChild.password && { password: editingChild.password })
                })}
                className="flex-1 bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditingChild(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{child.name}</h3>
                <p className="text-sm text-gray-600">{child.email}</p>
              </div>
              <div className="bg-teal-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                {child.name.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-600">{childAssigns.length}</p>
                <p className="text-xs text-gray-600">Assigned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{completed}</p>
                <p className="text-xs text-gray-600">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{actualTimeEarned}m</p>
                <p className="text-xs text-gray-600">Earned</p>
              </div>
            </div>

            <div className="space-y-2">
              {/* Lock Status Banner */}
              {isLocked && actualTimeEarned === 0 && (
                <div className="bg-orange-100 border-2 border-orange-300 rounded-lg p-2 text-center">
                  <p className="text-orange-800 font-bold text-sm">🔒 Auto-Locked (No Time)</p>
                  <p className="text-orange-700 text-xs">Assign courses to earn time</p>
                </div>
              )}
              
              {isLocked && actualTimeEarned > 0 && (
                <div className="bg-red-100 border-2 border-red-300 rounded-lg p-2 text-center">
                  <p className="text-red-700 font-bold text-sm">🔒 Manually Locked</p>
                </div>
              )}
              
              {/* Lock/Unlock Button */}
              <button
                onClick={() => toggleChildLock(child.id)}
                className={`w-full py-2 rounded-lg text-sm font-bold transition-all ${
                  isLocked 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {isLocked ? 'Unlock Screen Access' : 'Lock Screen Access'}
              </button>
              
              {/* Clear Time Button */}
              <button
                onClick={() => clearChildTime(child.id)}
                className="w-full py-2 rounded-lg text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition-all"
              >
                Clear Screen Time
              </button>
              
              {/* Edit and Remove Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingChild({...child, password: ''})}
                  className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-teal-700"
                >
                  Edit Info
                </button>
                <button
                  onClick={() => deleteChild(child.id)}
                  className="flex-1 bg-gray-400 text-white py-2 rounded-lg text-sm font-semibold hover:bg-gray-500"
                >
                  Remove
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 pb-20">
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-teal-100 text-sm">Parent Dashboard</p>
            {fam && <p className="text-xs mt-2 bg-white bg-opacity-20 inline-block px-3 py-1 rounded-full">Household Code: {fam.code}</p>}
          </div>
          <button 
            onClick={onLogout} 
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {message && (
          <div className="mb-4 bg-teal-50 border-2 border-teal-200 text-teal-800 px-4 py-3 rounded-xl flex justify-between items-center">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-teal-600 hover:text-teal-800">
              <XCircle size={20} />
            </button>
          </div>
        )}
        
        {tab === 'home' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard Overview</h2>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500 p-3 rounded-xl">
                      <Users className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Total Children</p>
                      <p className="text-3xl font-bold text-gray-800">{kids.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500 p-3 rounded-xl">
                      <Book className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Active Courses</p>
                      <p className="text-3xl font-bold text-gray-800">{assigns.filter(a => a.status === 'pending').length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500 p-3 rounded-xl">
                      <Trophy className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Completed</p>
                      <p className="text-3xl font-bold text-gray-800">{assigns.filter(a => a.status === 'completed').length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-3">Recent Activity</h3>
              <div className="space-y-2">
                {assigns.slice().reverse().slice(0, 5).map(a => {
                  const child = kids.find(k => k.id === a.childId);
                  const course = courses.find(c => c.id === a.courseId);
                  return (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{child?.name}</p>
                        <p className="text-sm text-gray-600">{course?.title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={'px-3 py-1 rounded-full text-xs font-medium ' + (a.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700')}>
                          {a.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                        {a.status === 'pending' && (
                          <button
                            onClick={() => deleteAssignment(a.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete assignment"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'household' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Manage Household</h2>
                <button 
                  onClick={async () => {
                    try {
                      // Reload from database - no syncing needed, database is source of truth
                      await load();
                      setMessage('Children refreshed from database');
                    } catch (error) {
                      console.error('Error refreshing children:', error);
                      setMessage('Error refreshing. Please try again.');
                    }
                  }}
                  className="text-sm bg-teal-100 text-teal-700 px-4 py-2 rounded-lg hover:bg-teal-200"
                >
                  Sync Children
                </button>
              </div>

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {message}
                </div>
              )}

              {/* Household Name Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Household Information</h3>
                {editingHousehold ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={householdName}
                      onChange={(e) => setHouseholdName(e.target.value)}
                      placeholder="Household Name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={updateHouseholdName}
                        className="flex-1 bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingHousehold(false)}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Household Name</p>
                        <p className="text-xl font-bold text-gray-800">{fam?.name || 'Loading...'}</p>
                      </div>
                      <button
                        onClick={() => {
                          setHouseholdName(fam?.name || '');
                          setEditingHousehold(true);
                        }}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-teal-700"
                      >
                        Edit Name
                      </button>
                    </div>
                    <div className="bg-white rounded-xl p-4 border-2 border-teal-200">
                      <p className="text-sm text-gray-600 mb-1">Household Code</p>
                      <div className="flex items-center justify-between">
                        <p className="text-3xl font-bold font-mono text-teal-600">{fam?.code || '----'}</p>
                        <div className="text-xs text-gray-500 text-right">
                          <p>Share this code with</p>
                          <p>children and parents</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Children Section */}
              <h3 className="text-lg font-bold text-gray-800 mb-4">Children</h3>
              {kids.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto text-gray-300 mb-4" size={64} />
                  <p className="text-gray-600 text-lg mb-2">No children in household</p>
                  <p className="text-sm text-gray-500">Share your household code: <span className="font-bold text-teal-600">{fam?.code}</span></p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {kids.map(child => (
                    <ChildCard
                      key={child.id}
                      child={child}
                      assigns={assigns}
                      editingChild={editingChild}
                      setEditingChild={setEditingChild}
                      updateChildInfo={updateChildInfo}
                      deleteChild={deleteChild}
                      toggleChildLock={toggleChildLock}
                      clearChildTime={clearChildTime}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'library' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Course Library</h2>
              
              {/* Search and Filter Section */}
              <div className="mb-6 space-y-3">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none"
                />
                <div className="flex items-center gap-3">
                  <label className="text-sm font-bold text-gray-700">Filter by Subject:</label>
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none"
                  >
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredCourses.length === 0 ? (
                <div className="text-center py-12">
                  <Book className="mx-auto text-gray-300 mb-4" size={64} />
                  <p className="text-gray-600 text-lg">No courses found</p>
                  <p className="text-sm text-gray-500 mt-2">Try adjusting your search or filter</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredCourses.map(course => (
                    <div key={course.id} className="border-2 border-gray-200 rounded-2xl p-6 hover:border-teal-300 hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">{course.title}</h3>
                          <p className="text-sm text-teal-600 font-medium">{course.category}</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4">{course.desc}</p>
                      
                      <div className="flex gap-2 mb-4">
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs">
                          {course.questions.length} Questions
                        </span>
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                          {course.sections.length} Sections
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setPreviewCourse(course);
                            setPreviewSection(0);
                          }}
                          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                        >
                          Preview
                        </button>
                        <button 
                          onClick={() => {
                            setSelCourse(course.id);
                            setTab('schedule');
                          }}
                          className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                        >
                          Assign
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'calendar' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Calendar & Schedule</h2>

              {/* Child Selector */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Child</label>
                <select
                  value={calendarChild}
                  onChange={(e) => setCalendarChild(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none"
                >
                  <option value="">Choose a child to view their calendar...</option>
                  {kids.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
              </div>

              {calendarChild ? (
                (() => {
                  const child = kids.find(k => k.id === calendarChild);
                  const childAssigns = assigns.filter(a => a.childId === calendarChild);
                  
                  return (
                    <div>
                      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 mb-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{child?.name}'s Schedule</h3>
                        <p className="text-sm text-gray-600">View assigned courses and tasks</p>
                      </div>

                      {/* Simple Calendar View */}
                      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 mb-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-4">Current Month</h4>
                        <div className="grid grid-cols-7 gap-2 mb-4">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center font-bold text-sm text-gray-600 py-2">
                              {day}
                            </div>
                          ))}
                          {Array.from({ length: 35 }, (_, i) => {
                            const day = i - 2; // Start from -2 to show previous month days
                            const isToday = day === new Date().getDate();
                            const hasAssignment = day > 0 && childAssigns.length > 0;
                            
                            return (
                              <div
                                key={i}
                                className={`aspect-square flex items-center justify-center rounded-lg text-sm ${
                                  day < 1 ? 'text-gray-300' : 
                                  isToday ? 'bg-teal-600 text-white font-bold' :
                                  hasAssignment ? 'bg-teal-100 text-teal-700 font-semibold' :
                                  'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {day > 0 ? day : ''}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Assigned Tasks */}
                      <div>
                        <h4 className="text-lg font-bold text-gray-800 mb-4">Assigned Tasks</h4>
                        {childAssigns.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-xl">
                            <Book className="mx-auto text-gray-300 mb-2" size={48} />
                            <p className="text-gray-600">No courses assigned yet</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {childAssigns.map(a => {
                              const course = courses.find(c => c.id === a.courseId);
                              return (
                                <div
                                  key={a.id}
                                  className={`p-4 rounded-xl border-2 ${
                                    a.status === 'completed'
                                      ? 'bg-green-50 border-green-200'
                                      : 'bg-orange-50 border-orange-200'
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h5 className="font-bold text-gray-800">{course?.title}</h5>
                                      <p className="text-sm text-gray-600">{course?.category}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Reward: {a.mins} minutes | Passing: {a.pass}%
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                                          a.status === 'completed'
                                            ? 'bg-green-200 text-green-800'
                                            : 'bg-orange-200 text-orange-800'
                                        }`}
                                      >
                                        {a.status === 'completed' ? `✓ ${a.score}%` : 'Pending'}
                                      </span>
                                      {a.status === 'pending' && (
                                        <button
                                          onClick={() => deleteAssignment(a.id)}
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Delete assignment"
                                        >
                                          <Trash2 size={18} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Quick Assign Button */}
                      <button
                        onClick={() => {
                          setSelKid(calendarChild);
                          setTab('schedule');
                        }}
                        className="w-full mt-6 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                      >
                        Assign New Course
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto text-gray-300 mb-4" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <p className="text-gray-600 text-lg">Select a child to view their calendar</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'schedule' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Assign Course</h2>
              
              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {message}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Child</label>
                  <select value={selKid} onChange={(e) => setSelKid(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none">
                    <option value="">Choose a child...</option>
                    {kids.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Course</label>
                  <select value={selCourse} onChange={(e) => setSelCourse(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none">
                    <option value="">Choose a course...</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title} - {c.category}</option>)}
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Screen Time Reward (minutes)</label>
                    <input type="number" value={mins} onChange={(e) => setMins(e.target.value)} min="5" max="240" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Passing Score (%)</label>
                    <input type="number" value={passScore} onChange={(e) => setPassScore(e.target.value)} min="50" max="100" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none" />
                  </div>
                </div>

                <button onClick={doAssign} className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  <Plus size={24} />
                  Assign Course
                </button>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Assignments</h3>
                {assigns.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No assignments yet</p>
                ) : (
                  <div className="space-y-2">
                    {assigns.slice().reverse().slice(0, 5).map(a => {
                      const child = kids.find(k => k.id === a.childId);
                      const course = courses.find(c => c.id === a.courseId);
                      return (
                        <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-800">{course?.title}</p>
                            <p className="text-sm text-gray-600">{child?.name} • {a.mins}min reward</p>
                          </div>
                          <span className={'px-3 py-1 rounded-full text-xs font-medium ' + (a.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700')}>
                            {a.status === 'completed' ? `${a.score}%` : 'Pending'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Progress Reports</h2>
              
              {kids.map(child => {
                const childAssigns = assigns.filter(a => a.childId === child.id);
                const completed = childAssigns.filter(a => a.status === 'completed');
                const avgScore = completed.length > 0 ? Math.round(completed.reduce((sum, a) => sum + (a.score || 0), 0) / completed.length) : 0;
                const totalTime = completed.reduce((sum, a) => sum + a.mins, 0);
                
                return (
                  <div key={child.id} className="mb-6 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">{child.name} Report</h3>
                    
                    <div className="grid md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-blue-600">{childAssigns.length}</p>
                        <p className="text-xs text-gray-600 mt-1">Total Assigned</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-green-600">{completed.length}</p>
                        <p className="text-xs text-gray-600 mt-1">Completed</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-purple-600">{avgScore}%</p>
                        <p className="text-xs text-gray-600 mt-1">Avg Score</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-orange-600">{totalTime}m</p>
                        <p className="text-xs text-gray-600 mt-1">Time Earned</p>
                      </div>
                    </div>

                    <h4 className="font-bold text-gray-800 mb-3">Course History</h4>
                    <div className="space-y-2">
                      {childAssigns.slice().reverse().map(a => {
                        const course = courses.find(c => c.id === a.courseId);
                        return (
                          <div key={a.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div>
                              <p className="font-medium text-gray-800">{course?.title}</p>
                              <p className="text-xs text-gray-500">{course?.category}</p>
                            </div>
                            <div className="text-right">
                              {a.status === 'completed' ? (
                                <>
                                  <p className="text-lg font-bold text-green-600">{a.score}%</p>
                                  <p className="text-xs text-gray-500">+{a.mins}min</p>
                                </>
                              ) : (
                                <span className="text-orange-600 text-sm font-medium">In Progress</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>
              
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Account Information</h3>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Name:</span> {user.name}</p>
                    <p className="text-sm"><span className="font-medium">Email:</span> {user.email}</p>
                    <p className="text-sm"><span className="font-medium">Role:</span> Parent</p>
                  </div>
                </div>

                <div className="border-b pb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Household Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Household Name</p>
                      {editingHousehold ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={householdName}
                            onChange={(e) => setHouseholdName(e.target.value)}
                            className="flex-1 px-3 py-2 border-2 border-teal-300 rounded-lg focus:outline-none focus:border-teal-500"
                            placeholder="Enter household name"
                          />
                          <button
                            onClick={updateHouseholdName}
                            className="bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-teal-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingHousehold(false);
                              setHouseholdName(fam?.name || '');
                            }}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-base font-semibold text-gray-800">{fam?.name || 'Loading...'}</p>
                          <button
                            onClick={() => setEditingHousehold(true)}
                            className="text-teal-600 text-sm font-medium hover:text-teal-700"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">Household Code</p>
                      <p className="text-2xl font-bold font-mono text-teal-600">{fam?.code || '----'}</p>
                      <p className="text-xs text-gray-500 mt-2">Share this code with children and other parents to add them to your household</p>
                    </div>
                  </div>
                </div>

                <div className="border-b pb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">App Settings</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Notifications</p>
                        <p className="text-xs text-gray-500">Get notified when children complete courses</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Email Reports</p>
                        <p className="text-xs text-gray-500">Receive weekly progress reports via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Auto-Sync</p>
                        <p className="text-xs text-gray-500">Automatically sync data across devices</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border-b pb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">About</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">EduBarrier Version 1.0.0</p>
                    <p className="text-xs text-gray-500">© 2025 EduBarrier. All rights reserved.</p>
                    <button 
                      onClick={() => {
                        console.log('=== DEBUG INFO ===');
                        console.log('User:', user);
                        console.log('Family:', fam);
                        console.log('Storage key:', 'fam-' + user.familyId);
                        console.log('LocalStorage:', localStorage.getItem('fam-' + user.familyId));
                        alert('Debug info logged to console. Press F12 to view.');
                      }}
                      className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded hover:bg-gray-200"
                    >
                      Debug Storage
                    </button>
                  </div>
                </div>

                <button onClick={onLogout} className="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                  <LogOut size={20} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Course Preview Modal */}
      {previewCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{previewCourse.title}</h2>
                <p className="text-sm text-teal-600 font-medium">{previewCourse.category}</p>
              </div>
              <button
                onClick={() => setPreviewCourse(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={32} />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <button
                  onClick={() => setPreviewSection(0)}
                  className={'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ' + (previewSection === 0 ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700')}
                >
                  Introduction
                </button>
                {previewCourse.sections.map((section, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPreviewSection(idx + 1)}
                    className={'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ' + (previewSection === idx + 1 ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700')}
                  >
                    {section.title}
                  </button>
                ))}
                <button
                  onClick={() => setPreviewSection(previewCourse.sections.length + 1)}
                  className={'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ' + (previewSection === previewCourse.sections.length + 1 ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700')}
                >
                  Quiz Preview
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
              {previewSection === 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Introduction</h3>
                  <p className="text-gray-700">{previewCourse.intro}</p>
                </div>
              )}
              {previewSection > 0 && previewSection <= previewCourse.sections.length && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{previewCourse.sections[previewSection - 1].title}</h3>
                  <p className="text-gray-700">{previewCourse.sections[previewSection - 1].text}</p>
                </div>
              )}
              {previewSection === previewCourse.sections.length + 1 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Quiz Preview ({previewCourse.questions.length} Questions)</h3>
                  <div className="space-y-4">
                    {previewCourse.questions.slice(0, 3).map((q, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-4">
                        <p className="font-semibold text-gray-800 mb-2">{idx + 1}. {q.q}</p>
                        <div className="space-y-1 pl-4">
                          {q.opts.map((opt, optIdx) => (
                            <p key={optIdx} className={'text-sm ' + (optIdx === q.ans ? 'text-green-600 font-semibold' : 'text-gray-600')}>
                              {opt} {optIdx === q.ans && '✓'}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                    {previewCourse.questions.length > 3 && (
                      <p className="text-sm text-gray-500 text-center">
                        ...and {previewCourse.questions.length - 3} more questions
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPreviewCourse(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelCourse(previewCourse.id);
                  setPreviewCourse(null);
                  setTab('schedule');
                }}
                className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg"
              >
                Assign This Course
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-around py-2">
          <NavIcon 
            icon={({ size, className }) => (
              <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            )}
            label="Home"
            active={tab === 'home'}
            onClick={() => setTab('home')}
          />
          <NavIcon 
            icon={({ size, className }) => (
              <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="8" y1="14" x2="16" y2="14" />
                <line x1="8" y1="18" x2="16" y2="18" />
              </svg>
            )}
            label="Manage"
            active={tab === 'household'}
            onClick={() => setTab('household')}
          />
          <NavIcon 
            icon={Book}
            label="Library"
            active={tab === 'library'}
            onClick={() => setTab('library')}
          />
          <NavIcon 
            icon={({ size, className }) => (
              <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            )}
            label="Calendar"
            active={tab === 'calendar'}
            onClick={() => setTab('calendar')}
          />
          <NavIcon 
            icon={({ size, className }) => (
              <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            )}
            label="Reports"
            active={tab === 'reports'}
            onClick={() => setTab('reports')}
          />
          <NavIcon 
            icon={({ size, className }) => (
              <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2" />
              </svg>
            )}
            label="Settings"
            active={tab === 'settings'}
            onClick={() => setTab('settings')}
          />
        </div>
      </div>
    </div>
  );
};

const ChildView = ({ user, onLogout }) => {
  const [assigns, setAssigns] = useState([]);
  const [courses, setCourses] = useState([]);
  const [timeData, setTimeData] = useState({ total: 0, used: 0 });
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerInterval, setTimerInterval] = useState(null);
  const [active, setActive] = useState(null);
  const [sec, setSec] = useState(0);
  const [viewing, setViewing] = useState(false);
  const [qNum, setQNum] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const [isLocked, setIsLocked] = useState(false);  // NEW: Track lock status

  useEffect(() => {
    loadData();
    
    // Poll for lock status every 3 seconds (for real-time sync with parent)
    const checkLockStatus = async () => {
      const settings = await db.getChildSettings(user.id);
      const lockStatus = settings?.is_locked || settings?.isLocked || false;
      
      // Smart state update: Only update if value actually changed (reduces flicker)
      setIsLocked(prev => {
        if (prev !== lockStatus) {
          console.log('Child lock status changed:', prev, '→', lockStatus);
          return lockStatus;
        }
        return prev;  // No change, don't trigger re-render
      });
      
      // Auto-pause timer if locked (for OS API integration readiness)
      if (lockStatus && isTimerRunning) {
        console.log('Auto-pausing timer due to lock');
        pauseTimer();
      }
    };
    
    checkLockStatus();  // Check immediately
    const lockCheckInterval = setInterval(checkLockStatus, 3000);  // Then every 3 seconds
    
    return () => {
      if (timerInterval) clearInterval(timerInterval);
      clearInterval(lockCheckInterval);
    };
  }, [isTimerRunning]);  // Add isTimerRunning as dependency

  const loadData = async () => {
    // Load assignments from database for this child
    const familyId = user.family_id || user.familyId;
    const allAssignments = await db.getAssignmentsByFamily(familyId) || [];
    const myAssignments = allAssignments
      .filter(a => (a.child_id || a.childId) === user.id)
      .map(a => ({
        ...a,
        childId: a.child_id || a.childId,
        familyId: a.family_id || a.familyId,
        courseId: a.course_id || a.courseId,
        passScore: a.pass_score || a.passScore
      }));
    setAssigns(myAssignments);
    
    // Load time data from database (child_settings table)
    const childSettings = await db.getChildSettings(user.id);
    const t = childSettings ? {
      total: childSettings.timeEarned || childSettings.time_earned || 0,
      used: childSettings.timeUsed || childSettings.time_used || 0
    } : { total: 0, used: 0 };
    setTimeData(t);
    
    // AUTO-LOCK CHECK: If child has 0 time remaining, they should be locked
    // This handles the case where child logs in with no time (not just timer expiry)
    const timeRemaining = t.total - t.used;
    const currentLockStatus = childSettings?.is_locked || childSettings?.isLocked || false;
    
    if (timeRemaining <= 0 && !currentLockStatus) {
      console.log('Auto-locking child: 0 time remaining on load');
      // Lock the child in database
      await db.updateChildSettings(user.id, {
        is_locked: true,
        timer_running: false,
        time_earned: t.total,
        time_used: t.used
      });
      setIsLocked(true);
    }
    
    // Load courses from database
    const c = await db.getAllCourses() || defaultCourses;
    setCourses(c);
    
    // Check lock status from database (for real-time sync)
    const checkLockStatus = async () => {
      const settings = await db.getChildSettings(user.id);
      if (settings) {
        const isLocked = settings.isLocked || false;
        
        // If locked and timer was running, stop it
        if (isLocked && timerInterval) {
          clearInterval(timerInterval);
          setTimerInterval(null);
          setIsTimerRunning(false);
        }
      }
    };
    
    // Check lock status now
    await checkLockStatus();
    
    // Poll for lock status changes every 3 seconds for real-time sync
    const lockCheckInterval = setInterval(checkLockStatus, 3000);
    
    // Clean up interval on unmount
    return () => clearInterval(lockCheckInterval);
  };

  const startTimer = async () => {
    // Check if locked from database
    const settings = await db.getChildSettings(user.id);
    if (settings && settings.isLocked) {
      alert('Screen access is locked by your parent. Please ask them to unlock it.');
      return;
    }
    
    if (timerInterval) return; // Already running
    
    setIsTimerRunning(true);
    
    // Update timer running state in database
    await db.updateChildSettings({
      childId: user.id,
      isLocked: settings?.isLocked || false,
      timerRunning: true,
      timeEarned: settings?.timeEarned || settings?.time_earned || 0,
      timeUsed: settings?.timeUsed || settings?.time_used || 0
    });
    
    const interval = setInterval(async () => {
      // Check if locked during timer from database
      const currentSettings = await db.getChildSettings(user.id);
      if (currentSettings && currentSettings.isLocked) {
        clearInterval(interval);
        setIsTimerRunning(false);
        setTimerInterval(null);
        await db.updateChildSettings({
          ...currentSettings,
          timerRunning: false
        });
        alert('Screen access has been locked by your parent.');
        return;
      }
      
      const timeEarned = currentSettings?.timeEarned || currentSettings?.time_earned || 0;
      const timeUsed = currentSettings?.timeUsed || currentSettings?.time_used || 0;
      const remaining = timeEarned - timeUsed;
      
      if (remaining <= 0) {
        // Time's up! Auto-lock child (for OS API integration readiness)
        clearInterval(interval);
        setIsTimerRunning(false);
        setTimerInterval(null);
        
        // AUTO-LOCK: Set is_locked = true when time runs out
        // FUTURE: Native OS APIs will enforce this lock at system level
        await db.updateChildSettings(user.id, {
          is_locked: true,  // Lock the device
          timer_running: false,
          time_earned: timeEarned,
          time_used: timeUsed
        });
        
        setIsLocked(true);  // Update local state immediately
        alert('Screen time is up! Your device has been locked. Ask your parent to unlock or complete more courses.');
        return;
      }
      
      // Increment used time by 1 minute in database
      const newTimeUsed = timeUsed + 1;
      await db.updateChildSettings({
        childId: user.id,
        isLocked: currentSettings?.isLocked || false,
        timerRunning: true,
        timeEarned: timeEarned,
        timeUsed: newTimeUsed
      });
      
      setTimeData({ total: timeEarned, used: newTimeUsed });
    }, 60000); // Every 1 minute
    
    setTimerInterval(interval);
  };

  const pauseTimer = async () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setIsTimerRunning(false);
    
    // Update timer running state in database
    const settings = await db.getChildSettings(user.id);
    if (settings) {
      await db.updateChildSettings({
        ...settings,
        timerRunning: false
      });
    }
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const startCourse = (a) => {
    setActive(a);
    setViewing(true);
    setSec(0);
    setQNum(0);
    setAnswers([]);
    setResults(null);
  };

  const startQuiz = () => {
    setViewing(false);
    setQNum(0);
  };

  const submitAnswer = (idx) => {
    const newAns = [...answers, idx];
    setAnswers(newAns);
    const course = courses.find(c => c.id === active.courseId);
    if (qNum + 1 < course.questions.length) {
      setQNum(qNum + 1);
    } else {
      calcResults(newAns, course);
    }
  };

  const calcResults = async (ans, course) => {
    console.log('===== CALC RESULTS START =====');
    console.log('Active assignment FULL object:', active);
    console.log('Active ID field:', active.id);
    console.log('Active assignment_id field:', active.assignment_id);
    
    // Get the actual ID, checking multiple possible field names
    const assignmentId = active.id || active.assignment_id || active.assignmentId;
    console.log('Using assignment ID:', assignmentId);
    
    if (!assignmentId) {
      console.error('ERROR: No assignment ID found!', active);
      return;
    }
    
    const correct = ans.filter((a, i) => a === course.questions[i].ans).length;
    const score = Math.round((correct / course.questions.length) * 100);
    const passScore = active.passScore || active.pass_score || 0;
    const passed = score >= passScore;

    console.log('Score:', score, '/', 'Pass Score:', passScore, '/', 'Passed:', passed);

    // Update assignment in database
    const assignmentData = {
      status: passed ? 'completed' : 'pending',
      score: score,
      completed_at: passed ? new Date().toISOString() : null
    };
    
    console.log('Updating assignment with data:', assignmentData);
    console.log('Using ID:', assignmentId);
    
    // FIXED: Call updateAssignment with single object parameter (not two parameters)
    const assignmentToUpdate = {
      id: assignmentId,
      ...assignmentData
    };
    
    console.log('Calling db.updateAssignment with:', assignmentToUpdate);
    const updated = await db.updateAssignment(assignmentToUpdate);
    
    if (updated) {
      console.log('✅ Database update successful!', updated);
    } else {
      console.error('❌ Database update failed - but continuing with state update');
    }
    
    // Update the active assignment locally
    const updatedActive = {
      ...active,
      status: passed ? 'completed' : 'pending',
      score: score,
      completed_at: passed ? new Date().toISOString() : null
    };
    
    console.log('Updated active assignment:', updatedActive);
    console.log('Assignment marked as completed in state (and database if update succeeded)');
    
    // Small delay for effect
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('Waited 100ms');
    
    // Update the assignments array with the modified assignment
    const updatedAssignments = assigns.map(a => 
      (a.id === assignmentId) ? updatedActive : a
    );
    
    console.log('Updated assignments array:', updatedAssignments);
    setAssigns(updatedAssignments);
    const pendingAfterUpdate = updatedAssignments.filter(a => a.status === 'pending');
    const completedAfterUpdate = updatedAssignments.filter(a => a.status === 'completed');
    
    console.log('Pending assignments:', pendingAfterUpdate.length, pendingAfterUpdate);
    console.log('Completed assignments:', completedAfterUpdate.length, completedAfterUpdate);
    
    console.log('State updated with new assignments');
    
    console.log('Quiz completed summary:', {
      score,
      passScore,
      passed,
      timeReward: active.mins,
      assignmentId: assignmentId
    });
    
    // If passed, award time in database
    if (passed) {
      console.log('Course passed - awarding time...');
      const settings = await db.getChildSettings(user.id);
      const currentTimeEarned = settings?.timeEarned || settings?.time_earned || 0;
      const currentTimeUsed = settings?.timeUsed || settings?.time_used || 0;
      const timeToAdd = active.mins || 0;
      const newTimeEarned = currentTimeEarned + timeToAdd;
      
      console.log('Time award details:', {
        currentTimeEarned,
        timeToAdd,
        newTimeEarned
      });
      
      // Call with (childId, settings) format to match supabase.js
      await db.updateChildSettings(user.id, {
        is_locked: settings?.isLocked || settings?.is_locked || false,
        timer_running: settings?.timerRunning || settings?.timer_running || false,
        time_earned: newTimeEarned,
        time_used: currentTimeUsed
      });
      
      console.log('Time updated in database');
      setTimeData({ total: newTimeEarned, used: currentTimeUsed });
      console.log('Time data state updated');
    }
    
    setResults({ score, passed, correct, total: course.questions.length });
    console.log('Results state set - showing congratulations screen');
    console.log('===== CALC RESULTS END =====');
  };

  const closeAll = () => {
    setActive(null);
    setViewing(false);
    setResults(null);
    // DON'T reload from database - it will overwrite our state-only update
    console.log('Closing quiz - NOT reloading from database');
  };

  // FIXED: Use useMemo so pending recalculates when assigns changes
  const pending = React.useMemo(() => {
    const p = assigns.filter(a => a.status === 'pending');
    console.log('PENDING RECALCULATED:', p.length, p);
    return p;
  }, [assigns]);
  
  const remaining = Math.max(0, timeData.total - timeData.used);

  if (active && viewing) {
    const course = courses.find(c => c.id === active.courseId);
    const total = course.sections.length + 2;
    const widthPct = ((sec + 1) / total) * 100;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex justify-between mb-6">
            <h2 className="text-2xl font-bold">{course.title}</h2>
            <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm">
              Section {sec + 1} of {total}
            </span>
          </div>
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all" style={{ width: widthPct + '%' }} />
            </div>
          </div>
          <div className="mb-8">
            {sec === 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4">Introduction</h3>
                <p>{course.intro}</p>
              </div>
            )}
            {sec > 0 && sec <= course.sections.length && (
              <div>
                <h3 className="text-xl font-bold mb-4">{course.sections[sec - 1].title}</h3>
                <p>{course.sections[sec - 1].text}</p>
              </div>
            )}
            {sec === total - 1 && (
              <div>
                <h3 className="text-xl font-bold mb-4">Summary</h3>
                <p>{course.summary}</p>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            {sec > 0 && <button onClick={() => setSec(sec - 1)} className="flex-1 bg-gray-200 py-4 rounded-xl font-semibold">Previous</button>}
            {sec < total - 1 ? (
              <button onClick={() => setSec(sec + 1)} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold">Next</button>
            ) : (
              <button onClick={startQuiz} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold">Start Quiz</button>
            )}
          </div>
          <button onClick={closeAll} className="w-full mt-4 text-gray-600 py-2 text-sm">Exit</button>
        </div>
      </div>
    );
  }

  if (active && !results) {
    const course = courses.find(c => c.id === active.courseId);
    const q = course.questions[qNum];
    const progPct = ((qNum + 1) / course.questions.length) * 100;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex justify-between mb-6">
            <h2 className="text-2xl font-bold">{course.title}</h2>
            <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm">
              Q {qNum + 1}/{course.questions.length}
            </span>
          </div>
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all" style={{ width: progPct + '%' }} />
            </div>
          </div>
          <p className="text-xl mb-6">{q.q}</p>
          <div className="space-y-3">
            {q.opts.map((opt, i) => (
              <button key={i} onClick={() => submitAnswer(i)} className="w-full p-4 text-left border-2 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all">
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center">
          {results.passed ? (
            <>
              <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="text-green-600" size={48} />
              </div>
              <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
              <p className="text-gray-600 mb-6">You passed!</p>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
                <p className="text-5xl font-bold text-purple-600 mb-2">{results.score}%</p>
                <p className="text-gray-600">{results.correct} of {results.total} correct</p>
              </div>
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                <p className="text-green-700 font-semibold">You earned {active.mins} minutes!</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-orange-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="text-orange-600" size={48} />
              </div>
              <h2 className="text-3xl font-bold mb-2">Keep Trying!</h2>
              <p className="text-gray-600 mb-6">You need {active.pass}% to pass</p>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
                <p className="text-5xl font-bold text-orange-600 mb-2">{results.score}%</p>
                <p className="text-gray-600">{results.correct} of {results.total} correct</p>
              </div>
            </>
          )}
          <button onClick={closeAll} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold">
            {results.passed ? 'Continue' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  const timePct = timeData.total > 0 ? ((timeData.total - timeData.used) / timeData.total) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Hi, {user.name}!</h1>
            <p className="text-purple-100">Complete courses to earn time</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Lock Status Indicator */}
            <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
              isLocked 
                ? 'bg-red-500 bg-opacity-90' 
                : 'bg-green-500 bg-opacity-90'
            }`}>
              {isLocked ? '🔒 Locked' : '✓ Unlocked'}
            </div>
            <button onClick={onLogout} className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Screen Time</h2>
          
          {/* Lock Status Warning - Enhanced for future OS integration */}
          {isLocked && (
            <div className="bg-red-100 border-2 border-red-300 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl text-red-600 font-bold">🔒</div>
                <div className="flex-1">
                  <p className="text-red-800 font-bold">Screen Access Locked</p>
                  <p className="text-red-700 text-sm">Your parent has locked your screen access.</p>
                  <p className="text-red-600 text-xs mt-1">
                    Note: In the future, this will use OS-level controls to block apps.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center mb-4">
            <p className="text-6xl font-bold text-purple-600">{remaining}m</p>
            <p className="text-gray-600 mt-2">Time Remaining</p>
            
            {/* Timer Status */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isTimerRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm font-medium text-gray-600">
                {isTimerRunning ? 'Timer Active' : 'Timer Paused'}
              </span>
            </div>
          </div>
          
          {/* Timer Controls - Disabled when locked */}
          {/* FUTURE: When lock is active in native app, OS APIs will enforce this:
               - iOS: Screen Time API will block app launches
               - Android: Digital Wellbeing API will restrict app usage
               Current web version: Honor system (UI disabled) */}
          {remaining > 0 && !isLocked && (
            <button
              onClick={toggleTimer}
              className={`w-full py-4 rounded-xl font-bold text-white mb-4 transition-all ${
                isTimerRunning 
                  ? 'bg-orange-500 hover:bg-orange-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isTimerRunning ? '⏸ Pause Timer' : '▶ Start Timer'}
            </button>
          )}
          
          {isLocked && (
            <div className="bg-gray-200 text-gray-500 w-full py-4 rounded-xl font-bold mb-4 text-center cursor-not-allowed">
              🔒 Timer Controls Disabled (Locked)
            </div>
          )}
          
          {remaining === 0 && !isLocked && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-700 text-center font-semibold">No time remaining. Complete more courses!</p>
            </div>
          )}
          
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all" style={{ width: timePct + '%' }} />
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            {timeData.used}m used • {timeData.total}m earned
          </p>
          
          <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-3">
            <p className="text-xs text-purple-800 text-center">
              💡 Tip: Pause your timer when stepping away to save your screen time!
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Your Courses</h2>
          {pending.length === 0 ? (
            <div className="text-center py-12">
              <Book className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-600">No courses assigned yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map(a => {
                const course = courses.find(c => c.id === a.courseId);
                return (
                  <div key={a.id} className="border-2 border-purple-200 rounded-2xl p-4">
                    <div className="flex justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold">{course?.title}</h3>
                        <p className="text-sm text-gray-600">{course?.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600">+{a.mins}m</p>
                        <p className="text-xs text-gray-500">Reward</p>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{course?.desc}</p>
                    <button onClick={() => startCourse(a)} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
                      Start Course
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Courses Section */}
        {assigns.filter(a => a.status === 'completed').length > 0 && (
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-green-600">✓ Completed Courses</h2>
            <div className="space-y-3">
              {assigns.filter(a => a.status === 'completed').map(a => {
                const course = courses.find(c => c.id === a.courseId);
                return (
                  <div key={a.id} className="border-2 border-green-200 bg-green-50 rounded-2xl p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{course?.title}</h3>
                        <p className="text-sm text-gray-600">{course?.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{a.score}%</p>
                        <p className="text-xs text-gray-500">Score</p>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-2 text-sm text-gray-600">
                      <span className="bg-green-100 px-3 py-1 rounded-full">✓ Completed</span>
                      <span className="bg-purple-100 px-3 py-1 rounded-full">+{a.mins}m earned</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== ADMIN VIEW ====================
const AdminView = ({ user, onLogout }) => {
  const [tab, setTab] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Course management
  const [editingCourse, setEditingCourse] = useState(null);
  const [newCourse, setNewCourse] = useState({
    title: '',
    category: '',
    subject: '',
    desc: '',
    intro: '',
    summary: '',
    sections: [{ title: '', text: '' }],
    questions: [{ q: '', opts: ['', '', '', ''], ans: 0 }]
  });
  
  // Subject management
  const [newSubject, setNewSubject] = useState('');
  
  // User management
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load courses from database
      const c = await db.getAllCourses() || defaultCourses;
      setCourses(c);
      
      // Load subjects from database
      const s = await db.getAllSubjects() || ['Math', 'Reading', 'Science', 'History'];
      setSubjects(s);
      
      // Load users from database
      const u = await db.getAllUsers() || [];
      setUsers(u);
      
      // Load all families
      const famList = [];
      for (const user of u) {
        if (user.familyId) {
          const fam = await db.getFamily(user.familyId);
          if (fam && !famList.find(f => f.id === fam.id)) {
            famList.push(fam);
          }
        }
      }
      setFamilies(famList);
    } catch (err) {
      console.error('Error loading admin data:', err);
      setError('Error loading data. Please refresh the page.');
    }
  };

  const saveCourse = async () => {
    try {
      if (!newCourse.title || !newCourse.subject) {
        setError('Please fill in title and subject');
        return;
      }
      
      const courseToSave = {
        ...newCourse,
        id: editingCourse ? editingCourse.id : 'course' + Date.now(),
        category: newCourse.subject
      };
      
      if (editingCourse) {
        // Update existing course in database
        await db.updateCourse(courseToSave);
        const updatedCourses = courses.map(c => c.id === editingCourse.id ? courseToSave : c);
        setCourses(updatedCourses);
        setMessage('Course updated successfully!');
      } else {
        // Create new course in database
        await db.createCourse(courseToSave);
        setCourses([...courses, courseToSave]);
        setMessage('Course created successfully!');
      }
      
      setEditingCourse(null);
      setNewCourse({
        title: '',
        category: '',
        subject: '',
        desc: '',
        intro: '',
        summary: '',
        sections: [{ title: '', text: '' }],
        questions: [{ q: '', opts: ['', '', '', ''], ans: 0 }]
      });
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error saving course:', err);
      setError('Error saving course: ' + err.message);
    }
  };

  const deleteCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    
    try {
      await db.deleteCourse(courseId);
      const updated = courses.filter(c => c.id !== courseId);
      setCourses(updated);
      setMessage('Course deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting course:', err);
      setError('Error deleting course: ' + err.message);
    }
  };

  const addSubject = async () => {
    if (!newSubject.trim()) {
      setError('Please enter a subject name');
      return;
    }
    
    if (subjects.includes(newSubject.trim())) {
      setError('Subject already exists');
      return;
    }
    
    try {
      await db.createSubject(newSubject.trim());
      const updated = [...subjects, newSubject.trim()];
      setSubjects(updated);
      setNewSubject('');
      setMessage('Subject added successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error adding subject:', err);
      setError('Error adding subject: ' + err.message);
    }
  };

  const deleteSubject = async (subject) => {
    if (!confirm(`Are you sure you want to delete the subject "${subject}"?`)) return;
    
    try {
      await db.deleteSubject(subject);
      const updated = subjects.filter(s => s !== subject);
      setSubjects(updated);
      setMessage('Subject deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting subject:', err);
      setError('Error deleting subject: ' + err.message);
    }
  };

  const resetUserPassword = async () => {
    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }
    
    try {
      const updatedUser = { ...selectedUser, password: newPassword.trim() };
      await db.updateUser(updatedUser);
      
      const updated = users.map(u => 
        u.id === selectedUser.id ? updatedUser : u
      );
      setUsers(updated);
      setSelectedUser(null);
      setNewPassword('');
      setMessage('Password reset successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('Error resetting password: ' + err.message);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    
    try {
      const userToDelete = users.find(u => u.id === userId);
      if (!userToDelete) {
        setError('User not found in list');
        return;
      }
      
      console.log('Deleting user:', userToDelete.email, 'ID:', userId);
      
      // STEP 1: Delete from Supabase Auth FIRST (if they exist there)
      try {
        // Try to delete from Supabase Auth using the user's ID
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
        if (authDeleteError) {
          console.log('Auth delete error (may not exist in auth):', authDeleteError.message);
        } else {
          console.log('OK Deleted from Supabase Auth');
        }
      } catch (authErr) {
        console.log('Could not delete from Supabase Auth:', authErr.message);
      }
      
      // STEP 2: Delete child settings if child (must happen before user delete due to foreign keys)
      if (userToDelete.role === 'child') {
        try {
          await db.deleteChildSettings(userId);
          console.log('OK Deleted child settings');
        } catch (settingsErr) {
          console.log('No child settings to delete or error:', settingsErr.message);
        }
      }
      
      // STEP 3: Delete any assignments (must happen before user delete due to foreign keys)
      try {
        const { error: assignError } = await supabase
          .from('assignments')
          .delete()
          .eq('child_id', userId);
        if (!assignError) {
          console.log('OK Deleted assignments');
        }
      } catch (assignErr) {
        console.log('No assignments to delete or error:', assignErr.message);
      }
      
      // STEP 4: Now delete from users table
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (deleteError) {
        console.error('âŒ Database delete failed:', deleteError);
        setError('Failed to delete user: ' + deleteError.message);
        return;
      }
      
      console.log('OK Deleted from users table');
      
      // STEP 5: Reload all users to confirm deletion
      const updatedUsers = await db.getAllUsers();
      console.log('Users after delete:', updatedUsers.length);
      
      const stillExists = updatedUsers.find(u => u.id === userId);
      if (stillExists) {
        setError('User still exists! This should not happen. Check Supabase RLS policies.');
        return;
      }
      
      console.log('OK User successfully deleted');
      setUsers(updatedUsers);
      setMessage('User deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
      
    } catch (err) {
      console.error('âŒ Error deleting user:', err);
      setError('Error deleting user: ' + err.message);
    }
  };

  const fixUserIssue = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    try {
      // Fix family link
      if (user.familyId) {
        const fam = await db.getFamily(user.familyId);
        if (fam) {
          if (user.role === 'parent' && !fam.parents.includes(userId)) {
            fam.parents.push(userId);
            await db.updateFamily(fam);
          } else if (user.role === 'child' && !fam.children.includes(userId)) {
            fam.children.push(userId);
            await db.updateFamily(fam);
          }
          setMessage('User family link fixed!');
        } else {
          setMessage('Family not found - user may need to rejoin');
        }
      } else {
        setMessage('User has no family assigned');
      }
      
      await loadData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error fixing user issue:', err);
      setError('Error fixing user: ' + err.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addSection = () => {
    setNewCourse({
      ...newCourse,
      sections: [...newCourse.sections, { title: '', text: '' }]
    });
  };

  const removeSection = (index) => {
    const updated = newCourse.sections.filter((_, i) => i !== index);
    setNewCourse({ ...newCourse, sections: updated });
  };

  const updateSection = (index, field, value) => {
    const updated = newCourse.sections.map((s, i) => 
      i === index ? { ...s, [field]: value } : s
    );
    setNewCourse({ ...newCourse, sections: updated });
  };

  const addQuestion = () => {
    setNewCourse({
      ...newCourse,
      questions: [...newCourse.questions, { q: '', opts: ['', '', '', ''], ans: 0 }]
    });
  };

  const removeQuestion = (index) => {
    const updated = newCourse.questions.filter((_, i) => i !== index);
    setNewCourse({ ...newCourse, questions: updated });
  };

  const updateQuestion = (index, field, value) => {
    const updated = newCourse.questions.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    );
    setNewCourse({ ...newCourse, questions: updated });
  };

  const updateOption = (qIndex, optIndex, value) => {
    const updated = newCourse.questions.map((q, i) => {
      if (i === qIndex) {
        const newOpts = [...q.opts];
        newOpts[optIndex] = value;
        return { ...q, opts: newOpts };
      }
      return q;
    });
    setNewCourse({ ...newCourse, questions: updated });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-red-100">EduBarrier Administration</p>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg hover:bg-opacity-30">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {(message || error) && (
          <div className={`mb-4 px-4 py-3 rounded-xl flex justify-between items-center ${
            error ? 'bg-red-50 border-2 border-red-200 text-red-800' : 'bg-green-50 border-2 border-green-200 text-green-800'
          }`}>
            <span>{error || message}</span>
            <button onClick={() => { setMessage(''); setError(''); }} className="hover:opacity-70">
              <XCircle size={20} />
            </button>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button onClick={() => setTab('dashboard')} className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap ${tab === 'dashboard' ? 'bg-red-600 text-white' : 'bg-white text-gray-700'}`}>
            Dashboard
          </button>
          <button onClick={() => setTab('courses')} className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap ${tab === 'courses' ? 'bg-red-600 text-white' : 'bg-white text-gray-700'}`}>
            Courses
          </button>
          <button onClick={() => setTab('subjects')} className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap ${tab === 'subjects' ? 'bg-red-600 text-white' : 'bg-white text-gray-700'}`}>
            Subjects
          </button>
          <button onClick={() => setTab('users')} className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap ${tab === 'users' ? 'bg-red-600 text-white' : 'bg-white text-gray-700'}`}>
            Users
          </button>
        </div>

        {/* Dashboard Tab */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 p-3 rounded-xl">
                    <Book className="text-white" size={24} />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Total Courses</p>
                    <p className="text-3xl font-bold text-gray-800">{courses.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 p-3 rounded-xl">
                    <Users className="text-white" size={24} />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Total Users</p>
                    <p className="text-3xl font-bold text-gray-800">{users.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500 p-3 rounded-xl">
                    <Users className="text-white" size={24} />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Families</p>
                    <p className="text-3xl font-bold text-gray-800">{families.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 p-3 rounded-xl">
                    <Book className="text-white" size={24} />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Subjects</p>
                    <p className="text-3xl font-bold text-gray-800">{subjects.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">System Status</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Storage System</span>
                  <span className="text-green-600 font-semibold">✓ Online</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Course System</span>
                  <span className="text-green-600 font-semibold">✓ Online</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">User System</span>
                  <span className="text-green-600 font-semibold">✓ Online</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {tab === 'courses' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
                {editingCourse && (
                  <button onClick={() => { setEditingCourse(null); setNewCourse({ title: '', category: '', subject: '', desc: '', intro: '', summary: '', sections: [{ title: '', text: '' }], questions: [{ q: '', opts: ['', '', '', ''], ans: 0 }] }); }} className="text-red-600 hover:text-red-700">
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Course Title"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    className="px-4 py-3 border-2 rounded-xl focus:border-red-500 focus:outline-none"
                  />
                  <select
                    value={newCourse.subject}
                    onChange={(e) => setNewCourse({ ...newCourse, subject: e.target.value, category: e.target.value })}
                    className="px-4 py-3 border-2 rounded-xl focus:border-red-500 focus:outline-none"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <textarea
                  placeholder="Course Description"
                  value={newCourse.desc}
                  onChange={(e) => setNewCourse({ ...newCourse, desc: e.target.value })}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:border-red-500 focus:outline-none"
                  rows={2}
                />

                <textarea
                  placeholder="Introduction Text"
                  value={newCourse.intro}
                  onChange={(e) => setNewCourse({ ...newCourse, intro: e.target.value })}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:border-red-500 focus:outline-none"
                  rows={2}
                />

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-lg">Course Sections</h3>
                    <button onClick={addSection} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                      <Plus size={20} />
                    </button>
                  </div>
                  {newCourse.sections.map((section, idx) => (
                    <div key={idx} className="mb-3 p-4 border-2 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">Section {idx + 1}</span>
                        {newCourse.sections.length > 1 && (
                          <button onClick={() => removeSection(idx)} className="text-red-600 hover:text-red-700">
                            <XCircle size={20} />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Section Title"
                        value={section.title}
                        onChange={(e) => updateSection(idx, 'title', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg mb-2"
                      />
                      <textarea
                        placeholder="Section Content"
                        value={section.text}
                        onChange={(e) => updateSection(idx, 'text', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={3}
                      />
                    </div>
                  ))}
                </div>

                <textarea
                  placeholder="Summary Text"
                  value={newCourse.summary}
                  onChange={(e) => setNewCourse({ ...newCourse, summary: e.target.value })}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:border-red-500 focus:outline-none"
                  rows={2}
                />

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-lg">Quiz Questions</h3>
                    <button onClick={addQuestion} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                      <Plus size={20} />
                    </button>
                  </div>
                  {newCourse.questions.map((question, qIdx) => (
                    <div key={qIdx} className="mb-4 p-4 border-2 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">Question {qIdx + 1}</span>
                        {newCourse.questions.length > 1 && (
                          <button onClick={() => removeQuestion(qIdx)} className="text-red-600 hover:text-red-700">
                            <XCircle size={20} />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Question"
                        value={question.q}
                        onChange={(e) => updateQuestion(qIdx, 'q', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg mb-2"
                      />
                      <div className="space-y-2">
                        {question.opts.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`question-${qIdx}`}
                              checked={question.ans === optIdx}
                              onChange={() => updateQuestion(qIdx, 'ans', optIdx)}
                              className="w-4 h-4"
                            />
                            <input
                              type="text"
                              placeholder={`Option ${optIdx + 1}`}
                              value={opt}
                              onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                              className="flex-1 px-3 py-2 border rounded-lg"
                            />
                            <span className="text-xs text-gray-500">{question.ans === optIdx ? '✓ Correct' : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={saveCourse} className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700">
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Existing Courses ({courses.length})</h2>
              <div className="space-y-3">
                {courses.map(course => (
                  <div key={course.id} className="flex justify-between items-center p-4 border-2 rounded-xl">
                    <div>
                      <h3 className="font-bold text-lg">{course.title}</h3>
                      <p className="text-sm text-gray-600">{course.subject} • {course.sections.length} sections • {course.questions.length} questions</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingCourse(course); setNewCourse(course); }} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                        Edit
                      </button>
                      <button onClick={() => deleteCourse(course.id)} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Subjects Tab */}
        {tab === 'subjects' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Add New Subject</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Subject Name"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 rounded-xl focus:border-red-500 focus:outline-none"
                />
                <button onClick={addSubject} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700">
                  Add Subject
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Existing Subjects ({subjects.length})</h2>
              <div className="grid md:grid-cols-3 gap-3">
                {subjects.map(subject => (
                  <div key={subject} className="flex justify-between items-center p-4 border-2 rounded-xl">
                    <span className="font-semibold">{subject}</span>
                    <button onClick={() => deleteSubject(subject)} className="text-red-600 hover:text-red-700">
                      <XCircle size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">User Management</h2>
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-xl focus:border-red-500 focus:outline-none mb-4"
              />

              <div className="space-y-3">
                {filteredUsers.map(u => (
                  <div key={u.id} className="p-4 border-2 rounded-xl">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{u.name}</h3>
                        <p className="text-sm text-gray-600">{u.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Role: {u.role} {u.familyId && `OK Family ID: ${u.familyId}`}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        u.role === 'parent' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedUser(u)} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600">
                        Reset Password
                      </button>
                      <button onClick={() => fixUserIssue(u.id)} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600">
                        Fix Issues
                      </button>
                      <button onClick={() => deleteUser(u.id)} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
              <p className="text-gray-600 mb-4">
                Resetting password for: <span className="font-bold">{selectedUser.name}</span>
              </p>
              <input
                type="text"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-xl focus:border-red-500 focus:outline-none mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => { setSelectedUser(null); setNewPassword(''); }} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold">
                  Cancel
                </button>
                <button onClick={resetUserPassword} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold">
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
