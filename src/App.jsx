import React, { useState, useEffect, startTransition } from 'react';
import { Book, Users, Trophy, XCircle, Plus, LogOut, Eye, EyeOff, Trash2, Upload } from 'lucide-react';
import { storage, db, supabase, ensureUserInDatabase, fileUpload } from './supabase';

// ==================== QUIZ HELPER FUNCTIONS ====================

// Normalize question (add type if missing for backward compatibility)
const normalizeQuestion = (question) => {
  if (!question.type) {
    // Old format: has opts array = multiple choice
    if (question.opts && Array.isArray(question.opts)) {
      return { ...question, type: 'multiple-choice' };
    }
  }
  return question;
};

// Check if answer is correct for any question type
const checkAnswer = (question, userAnswer) => {
  const q = normalizeQuestion(question);
  
  switch (q.type) {
    case 'multiple-choice':
      return userAnswer === q.ans;
      
    case 'true-false':
      return userAnswer === q.ans;
      
    case 'fill-blank':
      const accepted = q.acceptedAnswers || [q.ans];
      return accepted.some(a => 
        a.toString().toLowerCase().trim() === 
        userAnswer.toString().toLowerCase().trim()
      );
      
    case 'matching':
      // userAnswer should be array of indices
      if (!Array.isArray(userAnswer) || userAnswer.length !== q.pairs.length) {
        return false;
      }
      return userAnswer.every((idx, i) => idx === i);
      
    default:
      return false;
  }
};

// Move array item from one index to another (for reordering)
const moveArrayItem = (arr, fromIndex, toIndex) => {
  const newArr = [...arr];
  const [movedItem] = newArr.splice(fromIndex, 1);
  newArr.splice(toIndex, 0, movedItem);
  return newArr;
};

// Default courses - these will be loaded into storage on first run
const defaultCourses = [
  {
    id: 'math1',
    title: 'Basic Math',
    category: 'Math',
    subject: 'Math',
    description: 'Learn addition, subtraction, multiplication, division',
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
    description: 'Improve comprehension and understanding',
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
    description: 'Explore the scientific method and basic concepts',
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
    description: 'Learn key events in American history',
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
    
    // Set up Supabase Auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      // Handle sign in after email verification
      // Don't process INITIAL_SESSION to avoid blocking page load
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user && event !== 'INITIAL_SESSION') {
        try {
          // Ensure user exists in database with proper family setup
          const dbUser = await ensureUserInDatabase(session.user);
          
          if (dbUser) {
            console.log('User authenticated and set up:', dbUser);
            // Don't auto-login here, let the user login manually
            // This prevents issues with the UI state
          }
        } catch (error) {
          console.error('Error setting up user after sign in:', error);
          // If setup fails, sign out to prevent broken state
          await supabase.auth.signOut();
        }
      }
    });
    
    // Cleanup function
    return () => {
      authListener?.subscription?.unsubscribe();
    };
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
    
    // Check for orphaned Supabase Auth session (user exists in auth but not in database)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        console.log('Found Supabase Auth user:', authUser.email);
        // Check if user exists in our database
        const dbUser = await db.getUser(authUser.email);
        if (!dbUser) {
          console.log('Auth user exists but not in database - signing out orphaned session');
          await supabase.auth.signOut();
        }
      }
    } catch (err) {
      console.error('Error checking auth session:', err);
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

        try {
          // Ensure user exists in our users table with proper family setup
          await ensureUserInDatabase(data.user);
          
          // Fetch full user data from our database
          const fullUser = await db.getUser(data.user.email);
          
          if (fullUser) {
            // Verify family exists if family_id is set
            if (fullUser.family_id) {
              const family = await db.getFamily(fullUser.family_id);
              if (!family) {
                setError('Your household setup is incomplete. Please contact support or try creating your account again.');
                await supabase.auth.signOut();
                return;
              }
            }
            
            await storage.set('session', fullUser);
            setUser(fullUser);
            setView(fullUser.role === 'admin' ? 'admin' : 
                   fullUser.role === 'parent' ? 'parent' : 'child');
          } else {
            setError('User account setup incomplete. Please try again or contact support.');
            await supabase.auth.signOut();
          }
        } catch (setupError) {
          console.error('User setup error:', setupError);
          if (setupError.message.includes('Household code not found')) {
            setError('The household code you used during signup is no longer valid. Please contact the household admin.');
          } else {
            setError('Account setup failed: ' + setupError.message);
          }
          await supabase.auth.signOut();
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
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg p-2">
              <img 
                src="data:image/png;base64,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" 
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
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All');
  const [ageFilter, setAgeFilter] = useState('All');
  const [editingChild, setEditingChild] = useState(null);
  const [editingHousehold, setEditingHousehold] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [calendarChild, setCalendarChild] = useState('');
  const [previewCourse, setPreviewCourse] = useState(null);
  const [previewSection, setPreviewSection] = useState(0);
  const [availableDate, setAvailableDate] = useState(new Date().toISOString().split('T')[0]); // NEW: Date for assignment
  const [calendarDate, setCalendarDate] = useState(new Date()); // NEW: Currently viewing month
  const [selectedDate, setSelectedDate] = useState(null); // NEW: Date clicked on calendar

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
      score: null,
      available_date: availableDate  // NEW: Add scheduled date
    };
    
    await db.createAssignment(a);
    const normalizedAssignment = normalizeAssignment(a);
    const updated = [...assigns, normalizedAssignment];
    setAssigns(updated);
    setSelKid('');
    setSelCourse('');
    setAvailableDate(new Date().toISOString().split('T')[0]);  // NEW: Reset to today
    
    // Show message with scheduled date
    const scheduledDateFormatted = new Date(availableDate + 'T00:00:00').toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    setMessage(`Course assigned successfully! Available on ${scheduledDateFormatted}`);
    setTimeout(() => setMessage(''), 5000);
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
      
      console.log('âœ“ Database deletion returned true');
      
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
      console.error('âœ— Error deleting assignment:', error);
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
      const result = await db.updateChildSettings(childId, {
        is_locked: newLockState,
        timer_running: newLockState ? false : (currentSettings.timer_running || currentSettings.timerRunning || false),
        time_earned: currentSettings.time_earned || currentSettings.timeEarned || 0,
        time_used: currentSettings.time_used || currentSettings.timeUsed || 0
      });
      
      console.log('Update result:', result);
      
      if (!result) {
        throw new Error('Database update returned null');
      }
      
      console.log('Database updated with new lock state');
      
      // Don't force reload - let polling handle it to prevent flicker
      // The ChildCard component will update within 3 seconds via polling
      
      console.log('===== TOGGLE LOCK END =====');
      
      // Get time data to show helpful message
      const timeEarned = currentSettings.time_earned || currentSettings.timeEarned || 0;
      const timeUsed = currentSettings.time_used || currentSettings.timeUsed || 0;
      const timeRemaining = timeEarned - timeUsed;
      
      let message = newLockState ? 'Child screen access locked' : 'Child screen access unlocked';
      
      // Add helpful context when unlocking at 0 time
      if (!newLockState && timeRemaining <= 0) {
        message = 'Child screen access unlocked (0 time remaining - they will need to earn more time)';
      }
      
      setMessage(message);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('âœ— Error toggling lock:', error);
      setMessage('Error toggling lock: ' + error.message);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const clearChildTime = async (childId) => {
    if (!confirm('Are you sure you want to clear all of this child\'s screen time? This will lock their device until they earn more time.')) {
      return;
    }
    
    // Reset time to zero AND lock the device
    await db.updateChildSettings(childId, {
      is_locked: true,        // CRITICAL: Lock when time is 0
      timer_running: false,   // Stop any running timer
      time_earned: 0,         // Clear earned time
      time_used: 0            // Clear used time
    });
    
    setMessage('Child screen time cleared and device locked');
    setTimeout(() => setMessage(''), 3000);
    
    // Force re-render
    const updatedKids = await db.getUsersByFamily(fam.id);
    setKids(updatedKids.filter(u => u.role === 'child'));
  };

  const toggleExtraCredit = async (childId) => {
    try {
      // Get current settings from database
      const currentSettings = await db.getChildSettings(childId);
      
      if (!currentSettings) {
        setMessage('Error: Could not load child settings');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      
      // Handle both camelCase and snake_case from database
      const currentExtraCreditState = currentSettings.extra_credit_enabled || currentSettings.extraCreditEnabled || false;
      const newExtraCreditState = !currentExtraCreditState;
      
      // Update in database with snake_case (Supabase standard)
      const result = await db.updateChildSettings(childId, {
        is_locked: currentSettings.is_locked || currentSettings.isLocked || false,
        timer_running: currentSettings.timer_running || currentSettings.timerRunning || false,
        time_earned: currentSettings.time_earned || currentSettings.timeEarned || 0,
        time_used: currentSettings.time_used || currentSettings.timeUsed || 0,
        extra_credit_enabled: newExtraCreditState
      });
      
      if (!result) {
        throw new Error('Database update returned null');
      }
      
      const message = newExtraCreditState ? 'Extra Credit enabled for child' : 'Extra Credit disabled for child';
      setMessage(message);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error toggling extra credit:', error);
      setMessage('Error toggling extra credit: ' + error.message);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === 'All' || course.subject === subjectFilter;
    
    // NEW: Difficulty filter
    const matchesDifficulty = difficultyFilter === 'All' || 
                              (course.difficulty || 'beginner') === difficultyFilter.toLowerCase();
    
    // NEW: Time filter
    const courseTime = course.estimatedTime || course.estimated_time || 30;
    const matchesTime = timeFilter === 'All' || 
                       (timeFilter === 'Quick' && courseTime <= 20) ||
                       (timeFilter === 'Medium' && courseTime > 20 && courseTime <= 45) ||
                       (timeFilter === 'Long' && courseTime > 45);
    
    // NEW: Age filter
    const courseMinAge = course.ageRangeMin || course.age_range_min || 6;
    const courseMaxAge = course.ageRangeMax || course.age_range_max || 16;
    const matchesAge = ageFilter === 'All' ||
                      (ageFilter === '4-7' && courseMinAge <= 7) ||
                      (ageFilter === '8-11' && courseMinAge <= 11 && courseMaxAge >= 8) ||
                      (ageFilter === '12-16' && courseMaxAge >= 12);
    
    return matchesSearch && matchesSubject && matchesDifficulty && matchesTime && matchesAge;
  });

  const subjects = ['All', ...new Set(courses.map(c => c.subject))];

  const NavIcon = ({ icon: Icon, label, active, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1 flex-1 py-2">
      <Icon size={24} className={active ? 'text-teal-700' : 'text-gray-600'} />
      <span className={'text-xs font-medium ' + (active ? 'text-teal-700' : 'text-gray-600')}>{label}</span>
    </button>
  );

  // Separate component for child card to properly use hooks
  const ChildCard = ({ child, assigns, editingChild, setEditingChild, updateChildInfo, deleteChild, toggleChildLock, clearChildTime, toggleExtraCredit }) => {
    const [isLocked, setIsLocked] = useState(false);
    const [actualTimeEarned, setActualTimeEarned] = useState(0);
    const [extraCreditEnabled, setExtraCreditEnabled] = useState(false);
    
    useEffect(() => {
      // Check lock status, time earned, AND extra credit status from database
      const checkStatusAndTime = async () => {
        const settings = await db.getChildSettings(child.id);
        const newLockStatus = settings?.isLocked || settings?.is_locked || false;
        const newTimeEarned = settings?.timeEarned || settings?.time_earned || 0;
        const newExtraCreditStatus = settings?.extraCreditEnabled || settings?.extra_credit_enabled || false;
        
        // Only update state if values actually changed (prevents unnecessary re-renders)
        setIsLocked(prev => prev !== newLockStatus ? newLockStatus : prev);
        setActualTimeEarned(prev => prev !== newTimeEarned ? newTimeEarned : prev);
        setExtraCreditEnabled(prev => prev !== newExtraCreditStatus ? newExtraCreditStatus : prev);
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
                  <p className="text-orange-800 font-bold text-sm">ðŸ”’ Auto-Locked (No Time)</p>
                  <p className="text-orange-700 text-xs">Assign courses to earn time</p>
                </div>
              )}
              
              {isLocked && actualTimeEarned > 0 && (
                <div className="bg-red-100 border-2 border-red-300 rounded-lg p-2 text-center">
                  <p className="text-red-700 font-bold text-sm">ðŸ”’ Manually Locked</p>
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
              
              {/* Extra Credit Toggle Button */}
              <button
                onClick={() => toggleExtraCredit(child.id)}
                className={`w-full py-2 rounded-lg text-sm font-bold transition-all ${
                  extraCreditEnabled 
                    ? 'bg-purple-500 text-white hover:bg-purple-600' 
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                {extraCreditEnabled ? 'â­ Extra Credit: ON' : 'â­ Extra Credit: OFF'}
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
                      toggleExtraCredit={toggleExtraCredit}
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
                
                {/* Filter Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Subject</label>
                    <select
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none text-sm"
                    >
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Difficulty</label>
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none text-sm"
                    >
                      <option value="All">All Levels</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Duration</label>
                    <select
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none text-sm"
                    >
                      <option value="All">Any Length</option>
                      <option value="Quick">Quick (Ã¢â€°Â¤20 min)</option>
                      <option value="Medium">Medium (21-45 min)</option>
                      <option value="Long">Long (45+ min)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Age Range</label>
                    <select
                      value={ageFilter}
                      onChange={(e) => setAgeFilter(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none text-sm"
                    >
                      <option value="All">All Ages</option>
                      <option value="4-7">Ages 4-7</option>
                      <option value="8-11">Ages 8-11</option>
                      <option value="12-16">Ages 12-16</option>
                    </select>
                  </div>
                </div>
                
                {/* Clear Filters Button */}
                {(searchQuery || subjectFilter !== 'All' || difficultyFilter !== 'All' || timeFilter !== 'All' || ageFilter !== 'All') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSubjectFilter('All');
                      setDifficultyFilter('All');
                      setTimeFilter('All');
                      setAgeFilter('All');
                    }}
                    className="text-sm text-teal-600 hover:text-teal-700 font-semibold"
                  >
                    âœ• Clear all filters
                  </button>
                )}
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
                      
                      <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                      
                      {/* Course Metadata */}
                      <div className="flex flex-wrap gap-2 mb-4 text-xs">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                          ðŸ“Š {(course.difficulty || 'beginner').charAt(0).toUpperCase() + (course.difficulty || 'beginner').slice(1)}
                        </span>
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                          â±ï¸ {course.estimatedTime || course.estimated_time || 30} min
                        </span>
                        <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full">
                          ðŸ‘¶ Ages {course.ageRangeMin || course.age_range_min || 6}-{course.ageRangeMax || course.age_range_max || 16}
                        </span>
                      </div>
                      
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
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Assignment Calendar</h2>

              {/* Child Selector */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Child</label>
                <select
                  value={calendarChild}
                  onChange={(e) => {
                    setCalendarChild(e.target.value);
                    setSelectedDate(null);
                  }}
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
                  
                  // Calendar logic
                  const year = calendarDate.getFullYear();
                  const month = calendarDate.getMonth();
                  const firstDay = new Date(year, month, 1);
                  const lastDay = new Date(year, month + 1, 0);
                  const startingDayOfWeek = firstDay.getDay();
                  const daysInMonth = lastDay.getDate();
                  
                  // Get assignments by date
                  const assignmentsByDate = {};
                  childAssigns.forEach(a => {
                    const date = (a.available_date || a.availableDate || new Date().toISOString()).split('T')[0];
                    if (!assignmentsByDate[date]) assignmentsByDate[date] = [];
                    assignmentsByDate[date].push(a);
                  });
                  
                  return (
                    <div>
                      {/* Month Navigation */}
                      <div className="flex items-center justify-between mb-6">
                        <button
                          onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Previous month"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                          </svg>
                        </button>
                        
                        <h3 className="text-xl font-bold text-gray-800">
                          {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        
                        <button
                          onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Next month"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </button>
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-2 mb-6">
                        {/* Day Headers */}
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center font-bold text-sm text-gray-600 py-2">
                            {day}
                          </div>
                        ))}
                        
                        {/* Calendar Days */}
                        {Array.from({ length: 42 }, (_, i) => {
                          const dayNumber = i - startingDayOfWeek + 1;
                          const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;
                          const date = isValidDay ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}` : null;
                          const dateAssignments = date ? assignmentsByDate[date] || [] : [];
                          const isToday = date === new Date().toISOString().split('T')[0];
                          const isSelected = selectedDate === date;
                          
                          return (
                            <button
                              key={i}
                              onClick={() => isValidDay && setSelectedDate(date)}
                              disabled={!isValidDay}
                              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all ${
                                !isValidDay ? 'invisible' :
                                isSelected ? 'bg-teal-600 text-white font-bold ring-2 ring-teal-400' :
                                isToday ? 'bg-blue-100 text-blue-700 font-bold' :
                                dateAssignments.length > 0 ? 'bg-teal-50 text-teal-700 font-semibold hover:bg-teal-100' :
                                'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <span>{isValidDay ? dayNumber : ''}</span>
                              {dateAssignments.length > 0 && (
                                <div className="flex gap-0.5 mt-1">
                                  {dateAssignments.slice(0, 3).map((_, idx) => (
                                    <div key={idx} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-teal-600'}`} />
                                  ))}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Selected Date Details */}
                      {selectedDate && (
                        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-6 mb-6">
                          <h4 className="text-lg font-bold text-gray-800 mb-4">
                            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </h4>
                          
                          {assignmentsByDate[selectedDate] && assignmentsByDate[selectedDate].length > 0 ? (
                            <div className="space-y-3">
                              {assignmentsByDate[selectedDate].map(a => {
                                const course = courses.find(c => c.id === a.courseId);
                                return (
                                  <div key={a.id} className="bg-white rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="font-bold text-gray-800">{course?.title}</p>
                                      <p className="text-sm text-gray-600">
                                        {a.mins} min reward â€¢ {a.passScore || a.pass_score}% to pass
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        a.status === 'completed' 
                                          ? 'bg-green-200 text-green-800' 
                                          : 'bg-orange-200 text-orange-800'
                                      }`}>
                                        {a.status === 'completed' ? `âœ“ ${a.score}%` : 'Pending'}
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
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-center py-4">No assignments on this date</p>
                          )}
                        </div>
                      )}

                      {/* Legend */}
                      <div className="flex flex-wrap gap-4 text-sm mb-6">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-100 rounded"></div>
                          <span className="text-gray-600">Today</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-teal-50 rounded"></div>
                          <span className="text-gray-600">Has Assignments</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-teal-600 rounded"></div>
                          <span className="text-gray-600">Selected</span>
                        </div>
                      </div>

                      {/* Quick Assign Button */}
                      <button
                        onClick={() => {
                          setSelKid(calendarChild);
                          setTab('schedule');
                        }}
                        className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
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

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Available Date
                    <span className="text-xs font-normal text-gray-500 ml-2">(When child can start this course)</span>
                  </label>
                  <input 
                    type="date" 
                    value={availableDate} 
                    onChange={(e) => setAvailableDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
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
                      const availDate = a.availableDate || a.available_date;
                      const today = new Date().toISOString().split('T')[0];
                      const isFuture = availDate && availDate > today;
                      
                      return (
                        <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-800">{course?.title}</p>
                            <p className="text-sm text-gray-600">
                              {child?.name} â€¢ {a.mins}min reward
                              {isFuture && (
                                <span className="ml-2 text-orange-600 font-semibold">
                                  ðŸ“… {new Date(availDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </p>
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
                    <p className="text-xs text-gray-500">Â© 2025 EduBarrier. All rights reserved.</p>
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
                              {opt} {optIdx === q.ans && 'âœ“'}
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
  const [hasAutoLockedOnLoad, setHasAutoLockedOnLoad] = useState(false);  // NEW: Track if we already auto-locked
  const [childTab, setChildTab] = useState('home');  // Child navigation tabs
  const [extraCreditEnabled, setExtraCreditEnabled] = useState(false);  // Extra credit status
  const [searchQuery, setSearchQuery] = useState('');  // For Extra Credit tab
  const [subjectFilter, setSubjectFilter] = useState('All');  // For Extra Credit tab

  // Helper function to format video URLs for embedding
  const formatVideoUrl = (url, platform) => {
    if (!url) return '';
    
    if (platform === 'youtube') {
      // Convert various YouTube URL formats to embed format
      const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/;
      const match = url.match(youtubeRegex);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
      return url;
    } else if (platform === 'vimeo') {
      // Convert Vimeo URLs to embed format
      const vimeoRegex = /vimeo\.com\/(\d+)/;
      const match = url.match(vimeoRegex);
      if (match && match[1]) {
        return `https://player.vimeo.com/video/${match[1]}`;
      }
      return url;
    }
    
    return url;
  };

  useEffect(() => {
    loadData();
    
    // Poll for lock status every 3 seconds (for real-time sync with parent)
    const checkLockStatus = async () => {
      const settings = await db.getChildSettings(user.id);
      const lockStatus = settings?.is_locked || settings?.isLocked || false;
      
      // Smart state update: Only update if value actually changed (reduces flicker)
      setIsLocked(prev => {
        if (prev !== lockStatus) {
          console.log('Child lock status changed:', prev, 'Ã¢â€ â€™', lockStatus);
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
    const today = new Date().toISOString().split('T')[0];
    
    const myAssignments = allAssignments
      .filter(a => (a.child_id || a.childId) === user.id)
      .filter(a => {
        // NEW: Only show assignments that are available today or earlier
        const availableDate = a.available_date || a.availableDate;
        if (!availableDate) return true; // No date = available now
        return availableDate <= today;
      })
      .map(a => ({
        ...a,
        childId: a.child_id || a.childId,
        familyId: a.family_id || a.familyId,
        courseId: a.course_id || a.courseId,
        passScore: a.pass_score || a.passScore,
        availableDate: a.available_date || a.availableDate
      }));
    setAssigns(myAssignments);
    
    // Load time data from database (child_settings table)
    const childSettings = await db.getChildSettings(user.id);
    const t = childSettings ? {
      total: childSettings.timeEarned || childSettings.time_earned || 0,
      used: childSettings.timeUsed || childSettings.time_used || 0
    } : { total: 0, used: 0 };
    setTimeData(t);
    
    // Load extra credit status from child_settings
    setExtraCreditEnabled(childSettings?.extra_credit_enabled || childSettings?.extraCreditEnabled || false);
    
    console.log('=== LOAD DATA CHECK ===');
    console.log('Time data:', t);
    console.log('Time remaining:', t.total - t.used);
    console.log('Current lock state:', childSettings?.is_locked || childSettings?.isLocked || false);
    console.log('NOTE: Auto-lock ONLY happens when timer expires to 0');
    console.log('Parent can manually unlock child at 0 time if desired');
    console.log('Child stays unlocked at 0 time until parent locks or they earn time');
    console.log('=== END LOAD DATA CHECK ===');
    
    // Load courses from database
    const c = await db.getAllCourses() || defaultCourses;
    setCourses(c);
    
    // Check lock status from database (for real-time sync)
    const checkLockStatus = async () => {
      const settings = await db.getChildSettings(user.id);
      if (settings) {
        const isLocked = settings.is_locked || settings.isLocked || false;
        
        // Update lock state in UI
        setIsLocked(isLocked);
        
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
    await db.updateChildSettings(user.id, {
      is_locked: settings?.isLocked || settings?.is_locked || false,
      timer_running: true,
      time_earned: settings?.timeEarned || settings?.time_earned || 0,
      time_used: settings?.timeUsed || settings?.time_used || 0
    });
    
    const interval = setInterval(async () => {
      // Check if locked during timer from database
      const currentSettings = await db.getChildSettings(user.id);
      if (currentSettings && currentSettings.isLocked) {
        clearInterval(interval);
        setIsTimerRunning(false);
        setTimerInterval(null);
        await db.updateChildSettings(user.id, {
          timer_running: false
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
      await db.updateChildSettings(user.id, {
        is_locked: currentSettings?.isLocked || currentSettings?.is_locked || false,
        timer_running: true,
        time_earned: timeEarned,
        time_used: newTimeUsed
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
      await db.updateChildSettings(user.id, {
        timer_running: false
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
    setAnswers([]); // Initialize empty answers array
    setQNum(0);
  };

  const submitQuiz = () => {
    const course = courses.find(c => c.id === active.courseId);
    calcResults(answers, course);
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
    
    // UPDATED: Use checkAnswer helper for all question types
    const correct = ans.filter((a, i) => checkAnswer(course.questions[i], a)).length;
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
      console.log('âœ“ Database update successful!', updated);
    } else {
      console.error('âœ— Database update failed - but continuing with state update');
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
      
      // CRITICAL: Unlock child when they earn time
      // If child was locked (auto-lock or parent lock) and now has time, unlock them
      const currentlyLocked = settings?.isLocked || settings?.is_locked || false;
      const willHaveTime = (newTimeEarned - currentTimeUsed) > 0;
      const shouldUnlock = currentlyLocked && willHaveTime;
      
      console.log('Lock decision:', {
        currentlyLocked,
        willHaveTime,
        shouldUnlock: shouldUnlock ? 'YES - unlocking child' : 'NO - keeping current state'
      });
      
      // Call with (childId, settings) format to match supabase.js
      await db.updateChildSettings(user.id, {
        is_locked: shouldUnlock ? false : (settings?.isLocked || settings?.is_locked || false),
        timer_running: settings?.timerRunning || settings?.timer_running || false,
        time_earned: newTimeEarned,
        time_used: currentTimeUsed
      });
      
      // Update local lock state immediately
      if (shouldUnlock) {
        setIsLocked(false);
        console.log('Child unlocked - they now have time to use!');
      }
      
      console.log('Time updated in database');
      setTimeData({ total: newTimeEarned, used: currentTimeUsed });
      console.log('Time data state updated');
    }
    
    // UPDATED: Store detailed results with answers and questions for review
    setResults({ 
      score, 
      passed, 
      correct, 
      total: course.questions.length,
      answers: ans,
      questions: course.questions
    });
    console.log('Results state set - showing detailed results screen');
    console.log('===== CALC RESULTS END =====');
  };

  const closeAll = () => {
    setActive(null);
    setViewing(false);
    setResults(null);
    // DON'T reload from database - it will overwrite our state-only update
    console.log('Closing quiz - NOT reloading from database');
  };

  // Self-assign function for Extra Credit tab
  const doSelfAssign = async (courseId, mins, passScore) => {
    if (!extraCreditEnabled) {
      alert('Extra Credit is not enabled. Please ask your parent to enable it.');
      return;
    }
    
    try {
      const familyId = user.family_id || user.familyId;
      const assignment = {
        id: 'a' + Date.now() + Math.random().toString(36).substr(2, 9),
        child_id: user.id,
        family_id: familyId,
        course_id: courseId,
        mins: mins,
        pass_score: passScore,
        status: 'pending',
        score: null,
        completed_at: null
      };
      
      await db.createAssignment(assignment);
      
      // Reload assignments
      await loadData();
      
      alert(`Course assigned! Complete it to earn ${mins} minutes of screen time.`);
    } catch (error) {
      console.error('Error self-assigning course:', error);
      alert('Failed to assign course. Please try again.');
    }
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
                <p className="mb-4">{course.sections[sec - 1].text}</p>
                
                {/* Display Images */}
                {course.sections[sec - 1].images && course.sections[sec - 1].images.length > 0 && (
                  <div className="space-y-4 mb-4">
                    {course.sections[sec - 1].images.map((img, imgIdx) => (
                      <div key={imgIdx} className="rounded-lg overflow-hidden">
                        <img 
                          src={img.url} 
                          alt={img.alt || img.caption || 'Course image'} 
                          className="w-full h-auto"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                        {img.caption && (
                          <p className="text-sm text-gray-600 mt-2 italic">{img.caption}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Display Videos */}
                {course.sections[sec - 1].videos && course.sections[sec - 1].videos.length > 0 && (
                  <div className="space-y-4 mb-4">
                    {course.sections[sec - 1].videos.map((vid, vidIdx) => (
                      <div key={vidIdx} className="rounded-lg overflow-hidden">
                        {vid.title && (
                          <p className="text-sm font-semibold text-gray-700 mb-2">{vid.title}</p>
                        )}
                        <div className="aspect-video">
                          {vid.platform === 'upload' ? (
                            // Direct video file upload
                            <video 
                              src={vid.url}
                              controls
                              className="w-full h-full rounded"
                            >
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            // YouTube/Vimeo embed
                            <iframe
                              src={formatVideoUrl(vid.url, vid.platform)}
                              title={vid.title || `Video ${vidIdx + 1}`}
                              className="w-full h-full rounded"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Practice Questions */}
                {course.sections[sec - 1].practiceQuestions && course.sections[sec - 1].practiceQuestions.length > 0 && (
                  <div className="space-y-4 mb-6">
                    <h4 className="font-semibold text-lg text-purple-900">Practice Problems:</h4>
                    {course.sections[sec - 1].practiceQuestions.map((practice, practiceIdx) => {
                      // Use React.useState for each practice question
                      const [practiceAnswer, setPracticeAnswer] = React.useState('');
                      const [showHint, setShowHint] = React.useState(false);
                      const [showAnswer, setShowAnswer] = React.useState(false);
                      const [isCorrect, setIsCorrect] = React.useState(null);
                      
                      const checkPractice = () => {
                        const correct = practiceAnswer.toLowerCase().trim() === 
                                       practice.answer.toLowerCase().trim();
                        setIsCorrect(correct);
                        if (!correct) {
                          // Reset after 2 seconds if wrong
                          setTimeout(() => setIsCorrect(null), 2000);
                        }
                      };
                      
                      return (
                        <div key={practiceIdx} className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                          <p className="font-semibold text-gray-800 mb-3">
                            {practice.question}
                          </p>
                          
                          <div className="flex gap-2 mb-3">
                            <input
                              type="text"
                              placeholder="Your answer..."
                              value={practiceAnswer}
                              onChange={(e) => setPracticeAnswer(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && checkPractice()}
                              className="flex-1 px-3 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none"
                            />
                            <button
                              onClick={checkPractice}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                            >
                              Check
                            </button>
                          </div>
                          
                          {isCorrect !== null && (
                            <div className={'p-2 rounded-lg mb-2 ' + 
                              (isCorrect ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800')}
                            >
                              {isCorrect ? 'âœ“ Correct! Great job!' : 'âœ— Not quite. Try again!'}
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            {practice.hint && (
                              <button
                                onClick={() => setShowHint(!showHint)}
                                className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
                              >
                                {showHint ? 'â–¼ Hide Hint' : 'â–¶ Show Hint'}
                              </button>
                            )}
                            <button
                              onClick={() => setShowAnswer(!showAnswer)}
                              className="text-sm text-gray-600 hover:text-gray-700 font-semibold"
                            >
                              {showAnswer ? 'â–¼ Hide Answer' : 'â–¶ Show Answer'}
                            </button>
                          </div>
                          
                          {showHint && practice.hint && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-gray-700 italic">
                              ðŸ’¡ Hint: {practice.hint}
                            </div>
                          )}
                          
                          {showAnswer && (
                            <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-700">
                              Answer: <span className="font-semibold">{practice.answer}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex justify-between mb-6">
            <h2 className="text-2xl font-bold">{course.title} - Final Quiz</h2>
            <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm">
              {course.questions.length} Questions
            </span>
          </div>
          
          <div className="space-y-6 mb-8">
            {course.questions.map((q, idx) => {
              const question = normalizeQuestion(q);
              
              return (
                <div key={idx} className="p-6 bg-gray-50 rounded-2xl">
                  <p className="font-semibold text-lg mb-4">
                    {idx + 1}. {question.q}
                  </p>
                  
                  {/* Multiple Choice */}
                  {question.type === 'multiple-choice' && (
                    <div className="space-y-3">
                      {question.opts.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const newAns = [...answers];
                            newAns[idx] = i;
                            setAnswers(newAns);
                          }}
                          className={'w-full text-left px-4 py-3 rounded-xl transition-all ' + 
                            (answers[idx] === i 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-white border-2 hover:border-purple-400')}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* True/False */}
                  {question.type === 'true-false' && (
                    <div className="space-y-3">
                      {[true, false].map((value, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const newAns = [...answers];
                            newAns[idx] = value;
                            setAnswers(newAns);
                          }}
                          className={'w-full text-left px-4 py-3 rounded-xl transition-all font-semibold ' + 
                            (answers[idx] === value 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-white border-2 hover:border-purple-400')}
                        >
                          {value ? 'âœ“ True' : 'âœ— False'}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Fill in Blank */}
                  {question.type === 'fill-blank' && (
                    <input
                      type="text"
                      placeholder="Type your answer here..."
                      value={answers[idx] || ''}
                      onChange={(e) => {
                        const newAns = [...answers];
                        newAns[idx] = e.target.value;
                        setAnswers(newAns);
                      }}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                    />
                  )}
                  
                  {/* Matching */}
                  {question.type === 'matching' && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 mb-3">
                        Match the items by selecting the correct right-side option for each left-side item:
                      </p>
                      {question.pairs.map((pair, pairIdx) => (
                        <div key={pairIdx} className="flex items-center gap-3 bg-white p-3 rounded-xl">
                          <div className="flex-1 font-semibold text-gray-800">
                            {pair.left}
                          </div>
                          <div className="text-gray-400">Ã¢â€ â€™</div>
                          <select
                            value={answers[idx]?.[pairIdx] ?? ''}
                            onChange={(e) => {
                              const newAns = [...answers];
                              if (!newAns[idx]) newAns[idx] = [];
                              newAns[idx][pairIdx] = parseInt(e.target.value);
                              setAnswers(newAns);
                            }}
                            className="flex-1 px-3 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none"
                          >
                            <option value="">Select...</option>
                            {question.pairs.map((p, i) => (
                              <option key={i} value={i}>{p.right}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <button 
            onClick={submitQuiz} 
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all"
          >
            Submit Quiz
          </button>
          
          <button onClick={closeAll} className="w-full mt-4 text-gray-600 py-2 text-sm">Exit</button>
        </div>
      </div>
    );
  }

if (results) {
    const [showingReview, setShowingReview] = React.useState(false);
    
    if (showingReview && results.questions) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-center">Quiz Review</h2>
            <div className="mb-6 text-center">
              <p className="text-xl">Score: <span className={results.passed ? 'text-green-600 font-bold' : 'text-orange-600 font-bold'}>{results.score}%</span></p>
              <p className="text-gray-600">{results.correct} of {results.total} correct</p>
            </div>
            
            <div className="space-y-6">
              {results.questions.map((q, idx) => {
                const question = normalizeQuestion(q);
                const userAnswer = results.answers[idx];
                const isCorrect = checkAnswer(question, userAnswer);
                
                return (
                  <div key={idx} className={`p-6 rounded-2xl border-2 ${isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-semibold text-lg">
                        {idx + 1}. {question.q}
                      </p>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                        {isCorrect ? 'âœ“ Correct' : 'âœ— Wrong'}
                      </span>
                    </div>
                    
                    {/* Show user's answer */}
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Your Answer:</p>
                      <div className="pl-4">
                        {question.type === 'multiple-choice' && (
                          <p className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                            {question.opts[userAnswer] || '(Not answered)'}
                          </p>
                        )}
                        {question.type === 'true-false' && (
                          <p className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                            {userAnswer === true ? 'True' : userAnswer === false ? 'False' : '(Not answered)'}
                          </p>
                        )}
                        {question.type === 'fill-blank' && (
                          <p className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                            {userAnswer || '(Not answered)'}
                          </p>
                        )}
                        {question.type === 'matching' && (
                          <div className="space-y-1">
                            {question.pairs.map((pair, pairIdx) => (
                              <p key={pairIdx} className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                                {pair.left} Ã¢â€ â€™ {question.pairs[userAnswer?.[pairIdx]]?.right || '(Not matched)'}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Show correct answer if wrong */}
                    {!isCorrect && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Correct Answer:</p>
                        <div className="pl-4">
                          {question.type === 'multiple-choice' && (
                            <p className="text-green-700 font-semibold">{question.opts[question.ans]}</p>
                          )}
                          {question.type === 'true-false' && (
                            <p className="text-green-700 font-semibold">{question.ans ? 'True' : 'False'}</p>
                          )}
                          {question.type === 'fill-blank' && (
                            <p className="text-green-700 font-semibold">{question.ans}</p>
                          )}
                          {question.type === 'matching' && (
                            <div className="space-y-1">
                              {question.pairs.map((pair, pairIdx) => (
                                <p key={pairIdx} className="text-green-700 font-semibold">
                                  {pair.left} Ã¢â€ â€™ {pair.right}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Show explanation */}
                    {question.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-900 mb-1">Explanation:</p>
                        <p className="text-sm text-blue-800">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <button 
              onClick={() => setShowingReview(false)} 
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold"
            >
              Back to Results
            </button>
          </div>
        </div>
      );
    }
    
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
          
          {/* Review button */}
          {results.questions && (
            <button 
              onClick={() => setShowingReview(true)} 
              className="w-full mb-3 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600"
            >
              Review Answers
            </button>
          )}
          
          <button onClick={closeAll} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold">
            {results.passed ? 'Continue' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  const timePct = timeData.total > 0 ? ((timeData.total - timeData.used) / timeData.total) * 100 : 0;

  // For Extra Credit tab - course filtering
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (course.description || course.desc || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === 'All' || course.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });
  const subjects = ['All', ...new Set(courses.map(c => c.subject))];
  const completed = assigns.filter(a => a.status === 'completed');
  
  // Navigation component (same pattern as parent's)
  const NavIcon = ({ icon: Icon, label, active, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1 flex-1 py-2">
      <Icon size={24} className={active ? 'text-purple-700' : 'text-gray-600'} />
      <span className={'text-xs font-medium ' + (active ? 'text-purple-700' : 'text-gray-600')}>{label}</span>
    </button>
  );

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
              {isLocked ? 'ðŸ”’ Locked' : 'âœ“ Unlocked'}
            </div>
            <button onClick={onLogout} className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* HOME TAB - Existing Child Interface */}
        {childTab === 'home' && (
          <>
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Screen Time</h2>
          
          {/* Lock Status Warning - Different messages for auto vs manual lock */}
          {isLocked && remaining === 0 && (
            <div className="bg-orange-100 border-2 border-orange-300 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl text-orange-600 font-bold">â¸</div>
                <div className="flex-1">
                  <p className="text-orange-800 font-bold">Out of Screen Time</p>
                  <p className="text-orange-700 text-sm">You've used all your earned time. Complete more courses to earn time!</p>
                  <p className="text-orange-600 text-xs mt-1">
                    Note: In the future, this will use OS-level controls to block apps.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {isLocked && remaining > 0 && (
            <div className="bg-red-100 border-2 border-red-300 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl text-red-600 font-bold">ðŸ”’</div>
                <div className="flex-1">
                  <p className="text-red-800 font-bold">Manually Locked by Parent</p>
                  <p className="text-red-700 text-sm">Your parent has locked your screen access. Ask them to unlock it.</p>
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
              {isTimerRunning ? 'â¸ Pause Timer' : 'â–¶ Start Timer'}
            </button>
          )}
          
          {isLocked && (
            <div className="bg-gray-200 text-gray-500 w-full py-4 rounded-xl font-bold mb-4 text-center cursor-not-allowed">
              ðŸ”’ Timer Controls Disabled (Locked)
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
            {timeData.used}m used â€¢ {timeData.total}m earned
          </p>
          
          <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-3">
            <p className="text-xs text-purple-800 text-center">
              ðŸ’¡ Tip: Pause your timer when stepping away to save your screen time!
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
            <h2 className="text-xl font-bold mb-4 text-green-600">âœ“ Completed Courses</h2>
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
                      <span className="bg-green-100 px-3 py-1 rounded-full">âœ“ Completed</span>
                      <span className="bg-purple-100 px-3 py-1 rounded-full">+{a.mins}m earned</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
          </>
        )}

        {/* EXTRA CREDIT TAB - Self-Assign Courses */}
        {childTab === 'extraCredit' && (
          <>
            {!extraCreditEnabled ? (
              <div className="bg-orange-100 border-2 border-orange-300 rounded-3xl p-8 text-center">
                <div className="text-5xl mb-4">ðŸ”’</div>
                <h3 className="text-2xl font-bold text-orange-800 mb-2">Extra Credit Not Enabled</h3>
                <p className="text-orange-700">
                  Your parent hasn't enabled Extra Credit yet. Ask them to turn it on in their Manage tab!
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">ðŸ“š Course Library - Extra Credit</h2>
                <p className="text-gray-600 mb-6">
                  Choose courses to complete for extra screen time! You can assign courses to yourself.
                </p>
                
                {/* Search and Filter */}
                <div className="mb-6 space-y-3">
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-bold text-gray-700">Subject:</label>
                    <select
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    >
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Course Grid */}
                {filteredCourses.length === 0 ? (
                  <div className="text-center py-12">
                    <Book className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-600">No courses found</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredCourses.map(course => {
                      // Check if already assigned
                      const alreadyAssigned = assigns.some(a => (a.courseId || a.course_id) === course.id);
                      
                      return (
                        <div key={course.id} className="border-2 border-purple-200 rounded-2xl p-4 hover:border-purple-400 transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-lg font-bold text-gray-800">{course.title}</h3>
                              <span className="text-sm text-purple-600 font-medium">{course.subject}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">{course.description || course.desc}</p>
                          
                          {alreadyAssigned ? (
                            <div className="bg-green-100 text-green-700 py-2 px-4 rounded-xl text-center font-semibold text-sm">
                              âœ“ Already Assigned
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                const mins = parseInt(prompt('How many minutes do you want to earn? (5-60)', '15'));
                                if (mins && mins >= 5 && mins <= 60) {
                                  const passScore = parseInt(prompt('What passing score? (50-100%)', '70'));
                                  if (passScore && passScore >= 50 && passScore <= 100) {
                                    doSelfAssign(course.id, mins, passScore);
                                  }
                                }
                              }}
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                            >
                              Assign to Myself
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* REPORT CARD TAB - View Own Progress */}
        {childTab === 'reportCard' && (
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">ðŸ“Š My Report Card</h2>
            
            {/* Overall Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{assigns.length}</p>
                <p className="text-xs text-gray-600 mt-1">Total Assigned</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{completed.length}</p>
                <p className="text-xs text-gray-600 mt-1">Completed</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {completed.length > 0 ? Math.round(completed.reduce((sum, a) => sum + (a.score || 0), 0) / completed.length) : 0}%
                </p>
                <p className="text-xs text-gray-600 mt-1">Avg Score</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-orange-600">{completed.reduce((sum, a) => sum + a.mins, 0)}m</p>
                <p className="text-xs text-gray-600 mt-1">Time Earned</p>
              </div>
            </div>

            {/* Course History */}
            <h3 className="font-bold text-gray-800 mb-3 text-lg">My Course History</h3>
            {assigns.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-600">No courses assigned yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {assigns.slice().reverse().map(a => {
                  const course = courses.find(c => c.id === (a.courseId || a.course_id));
                  return (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{course?.title || 'Unknown Course'}</p>
                        <p className="text-xs text-gray-500">{course?.category}</p>
                      </div>
                      <div className="text-right">
                        {a.status === 'completed' ? (
                          <div>
                            <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                              {a.score}%
                            </span>
                            <p className="text-xs text-gray-500 mt-1">+{a.mins}m earned</p>
                          </div>
                        ) : (
                          <span className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg pb-safe">
        <div className="max-w-4xl mx-auto flex justify-around">
          <NavIcon
            icon={Book}
            label="Home"
            active={childTab === 'home'}
            onClick={() => setChildTab('home')}
          />
          <NavIcon
            icon={Trophy}
            label="Extra Credit"
            active={childTab === 'extraCredit'}
            onClick={() => setChildTab('extraCredit')}
          />
          <NavIcon
            icon={Users}
            label="Report Card"
            active={childTab === 'reportCard'}
            onClick={() => setChildTab('reportCard')}
          />
        </div>
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
  
  // System status monitoring
  const [systemStatus, setSystemStatus] = useState({
    storage: { status: 'checking', message: 'Checking...' },
    courses: { status: 'checking', message: 'Checking...' },
    users: { status: 'checking', message: 'Checking...' }
  });
  
  // Course management
  const [editingCourse, setEditingCourse] = useState(null);
  const [newCourse, setNewCourse] = useState({
    title: '',
    category: '',
    subject: '',
    description: '',
    intro: '',
    summary: '',
    difficulty: 'beginner',  // NEW
    estimatedTime: 30,        // NEW (minutes)
    ageRangeMin: 6,          // NEW
    ageRangeMax: 16,         // NEW
    sections: [{ 
      title: '', 
      text: '',
      images: [],
      videos: [],
      bulletPoints: [],
      practiceQuestions: []
    }],
    questions: [{ 
      type: 'multiple-choice',
      q: '', 
      opts: ['', '', '', ''], 
      ans: 0,
      explanation: ''
    }]
  });
  
  // Subject management
  const [newSubject, setNewSubject] = useState('');
  
  // Course editor tab state (for Phase 4 tabbed interface)
  const [courseEditorTab, setCourseEditorTab] = useState('basic');
  
  // User management
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // File upload state
  const [uploadingImage, setUploadingImage] = useState(null); // {sectionIdx, imageIdx}
  const [uploadingVideo, setUploadingVideo] = useState(null); // {sectionIdx, videoIdx}
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingCourse, setLoadingCourse] = useState(false); // NEW: Track course loading

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

  // System status checking function
  const checkSystemStatus = async () => {
    console.log('ðŸ” Starting system status check...');
    
    const newStatus = {
      storage: { status: 'checking', message: 'Checking...' },
      courses: { status: 'checking', message: 'Checking...' },
      users: { status: 'checking', message: 'Checking...' }
    };
    
    setSystemStatus({ ...newStatus });
    
    // Check Storage System (Supabase Storage)
    try {
      console.log('Checking storage system...');
      const startTime = Date.now();
      const { data, error } = await supabase.storage.listBuckets();
      const responseTime = Date.now() - startTime;
      
      if (error) {
        console.error('Storage error:', error);
        newStatus.storage = { 
          status: 'offline', 
          message: `Error: ${error.message}` 
        };
      } else if (responseTime > 3000) {
        console.warn('Storage slow:', responseTime);
        newStatus.storage = { 
          status: 'warning', 
          message: `Slow response (${responseTime}ms)` 
        };
      } else {
        console.log('Storage OK:', data.length, 'buckets in', responseTime, 'ms');
        newStatus.storage = { 
          status: 'online', 
          message: `${data.length} bucket(s) â€¢ ${responseTime}ms` 
        };
      }
    } catch (err) {
      console.error('Storage exception:', err);
      newStatus.storage = { 
        status: 'offline', 
        message: `Connection failed: ${err.message}` 
      };
    }
    
    // Update after storage check
    setSystemStatus({ ...newStatus });
    
    // Check Course System (Database query)
    try {
      console.log('Checking course system...');
      const startTime = Date.now();
      const courses = await db.getAllCourses();
      const responseTime = Date.now() - startTime;
      
      if (!courses) {
        console.warn('No courses found');
        newStatus.courses = { 
          status: 'warning', 
          message: 'No courses found' 
        };
      } else if (responseTime > 2000) {
        console.warn('Courses slow:', responseTime);
        newStatus.courses = { 
          status: 'warning', 
          message: `${courses.length} courses â€¢ Slow (${responseTime}ms)` 
        };
      } else {
        console.log('Courses OK:', courses.length, 'courses in', responseTime, 'ms');
        newStatus.courses = { 
          status: 'online', 
          message: `${courses.length} courses â€¢ ${responseTime}ms` 
        };
      }
    } catch (err) {
      console.error('Course system exception:', err);
      newStatus.courses = { 
        status: 'offline', 
        message: `Database error: ${err.message}` 
      };
    }
    
    // Update after course check
    setSystemStatus({ ...newStatus });
    
    // Check User System (Auth + Database)
    try {
      console.log('Checking user system...');
      const startTime = Date.now();
      const users = await db.getAllUsers();
      const { data: authData } = await supabase.auth.getSession();
      const responseTime = Date.now() - startTime;
      
      if (!users || !authData.session) {
        console.warn('Limited user access');
        newStatus.users = { 
          status: 'warning', 
          message: 'Limited access' 
        };
      } else if (responseTime > 2000) {
        console.warn('Users slow:', responseTime);
        newStatus.users = { 
          status: 'warning', 
          message: `${users.length} users â€¢ Slow (${responseTime}ms)` 
        };
      } else {
        console.log('Users OK:', users.length, 'users in', responseTime, 'ms');
        newStatus.users = { 
          status: 'online', 
          message: `${users.length} users â€¢ ${responseTime}ms` 
        };
      }
    } catch (err) {
      console.error('User system exception:', err);
      newStatus.users = { 
        status: 'offline', 
        message: `Auth error: ${err.message}` 
      };
    }
    
    // Final update
    setSystemStatus({ ...newStatus });
    console.log('âœ… System status check complete', newStatus);
  };

  // Check system status on mount and every 30 seconds
  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

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
      setCourseEditorTab('basic'); // Reset to basic tab
      setNewCourse({
        title: '',
        category: '',
        subject: '',
        description: '',
        intro: '',
        summary: '',
        difficulty: 'beginner',
        estimatedTime: 30,
        ageRangeMin: 6,
        ageRangeMax: 16,
        sections: [{ 
          title: '', 
          text: '',
          images: [],
          videos: [],
          bulletPoints: [],
          practiceQuestions: []
        }],
        questions: [{ 
          type: 'multiple-choice',
          q: '', 
          opts: ['', '', '', ''], 
          ans: 0,
          explanation: ''
        }]
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
        console.error('âœ— Database delete failed:', deleteError);
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
      console.error('âœ— Error deleting user:', err);
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

  // Helper function to move array items (for reordering)
  const moveArrayItem = (arr, fromIndex, toIndex) => {
    const newArr = [...arr];
    const item = newArr.splice(fromIndex, 1)[0];
    newArr.splice(toIndex, 0, item);
    return newArr;
  };

  const addSection = () => {
    setNewCourse({
      ...newCourse,
      sections: [...newCourse.sections, { 
        title: '', 
        text: '',
        images: [],
        videos: [],
        practiceQuestions: []
      }]
    });
  };

  // Image management for sections
  const addImage = (sectionIndex) => {
    const updated = newCourse.sections.map((s, i) => {
      if (i === sectionIndex) {
        return {
          ...s,
          images: [...(s.images || []), { url: '', caption: '', alt: '' }]
        };
      }
      return s;
    });
    setNewCourse({ ...newCourse, sections: updated });
  };

  const removeImage = (sectionIndex, imageIndex) => {
    const updated = newCourse.sections.map((s, i) => {
      if (i === sectionIndex) {
        return {
          ...s,
          images: s.images.filter((_, imgIdx) => imgIdx !== imageIndex)
        };
      }
      return s;
    });
    setNewCourse({ ...newCourse, sections: updated });
  };

  const updateImage = (sectionIndex, imageIndex, field, value) => {
    const updated = newCourse.sections.map((s, i) => {
      if (i === sectionIndex) {
        const updatedImages = s.images.map((img, imgIdx) => {
          if (imgIdx === imageIndex) {
            return { ...img, [field]: value };
          }
          return img;
        });
        return { ...s, images: updatedImages };
      }
      return s;
    });
    setNewCourse({ ...newCourse, sections: updated });
  };

  // Video management for sections
  const addVideo = (sectionIndex) => {
    const updated = newCourse.sections.map((s, i) => {
      if (i === sectionIndex) {
        return {
          ...s,
          videos: [...(s.videos || []), { url: '', title: '', platform: 'youtube' }]
        };
      }
      return s;
    });
    setNewCourse({ ...newCourse, sections: updated });
  };

  const removeVideo = (sectionIndex, videoIndex) => {
    const updated = newCourse.sections.map((s, i) => {
      if (i === sectionIndex) {
        return {
          ...s,
          videos: s.videos.filter((_, vidIdx) => vidIdx !== videoIndex)
        };
      }
      return s;
    });
    setNewCourse({ ...newCourse, sections: updated });
  };

  const updateVideo = (sectionIndex, videoIndex, field, value) => {
    const updated = newCourse.sections.map((s, i) => {
      if (i === sectionIndex) {
        const updatedVideos = s.videos.map((vid, vidIdx) => {
          if (vidIdx === videoIndex) {
            return { ...vid, [field]: value };
          }
          return vid;
        });
        return { ...s, videos: updatedVideos };
      }
      return s;
    });
    setNewCourse({ ...newCourse, sections: updated });
  };

  // Helper function to format video URLs for embedding
  const formatVideoUrl = (url, platform) => {
    if (!url) return '';
    
    if (platform === 'youtube') {
      // Convert various YouTube URL formats to embed format
      const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/;
      const match = url.match(youtubeRegex);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
      return url;
    } else if (platform === 'vimeo') {
      // Convert Vimeo URLs to embed format
      const vimeoRegex = /vimeo\.com\/(\d+)/;
      const match = url.match(vimeoRegex);
      if (match && match[1]) {
        return `https://player.vimeo.com/video/${match[1]}`;
      }
      return url;
    }
    
    return url;
  };

  // File upload handlers
  const handleImageUpload = async (sectionIdx, imageIdx, file) => {
    try {
      setUploadingImage({ sectionIdx, imageIdx });
      setUploadProgress(0);
      setError('');

      // Simulate progress (Supabase doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Upload to Supabase Storage
      const result = await fileUpload.uploadImage(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Update the image URL in the course
      updateImage(sectionIdx, imageIdx, 'url', result.url);

      // Success message
      setMessage('Image uploaded successfully!');
      setTimeout(() => setMessage(''), 3000);

    } catch (err) {
      setError('Image upload failed: ' + err.message);
      console.error('Upload error:', err);
    } finally {
      setUploadingImage(null);
      setUploadProgress(0);
    }
  };

  const handleVideoUpload = async (sectionIdx, videoIdx, file) => {
    try {
      setUploadingVideo({ sectionIdx, videoIdx });
      setUploadProgress(0);
      setError('');

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      // Upload to Supabase Storage
      const result = await fileUpload.uploadVideo(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Update the video URL in the course
      updateVideo(sectionIdx, videoIdx, 'url', result.url);
      updateVideo(sectionIdx, videoIdx, 'platform', 'upload'); // Mark as uploaded file

      // Success message
      setMessage('Video uploaded successfully!');
      setTimeout(() => setMessage(''), 3000);

    } catch (err) {
      setError('Video upload failed: ' + err.message);
      console.error('Upload error:', err);
    } finally {
      setUploadingVideo(null);
      setUploadProgress(0);
    }
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">System Status</h2>
                <button 
                  onClick={checkSystemStatus}
                  className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Refresh status"
                >
                  ðŸ”„ Refresh
                </button>
              </div>
              <div className="space-y-3">
                {/* Storage System Status */}
                <div className={`flex justify-between items-center p-3 rounded-lg ${
                  systemStatus.storage.status === 'online' ? 'bg-green-50' : 
                  systemStatus.storage.status === 'warning' ? 'bg-yellow-50' : 
                  systemStatus.storage.status === 'offline' ? 'bg-red-50' : 'bg-gray-50'
                }`}>
                  <div className="flex-1">
                    <span className="font-medium">Storage System</span>
                    <p className="text-xs text-gray-600 mt-1">{systemStatus.storage.message}</p>
                  </div>
                  <span className={`font-semibold ${
                    systemStatus.storage.status === 'online' ? 'text-green-600' : 
                    systemStatus.storage.status === 'warning' ? 'text-yellow-600' : 
                    systemStatus.storage.status === 'offline' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {systemStatus.storage.status === 'online' ? 'âœ“ Online' : 
                     systemStatus.storage.status === 'warning' ? 'âš ï¸ Warning' : 
                     systemStatus.storage.status === 'offline' ? 'âŒ Offline' : 'â³ Checking'}
                  </span>
                </div>

                {/* Course System Status */}
                <div className={`flex justify-between items-center p-3 rounded-lg ${
                  systemStatus.courses.status === 'online' ? 'bg-green-50' : 
                  systemStatus.courses.status === 'warning' ? 'bg-yellow-50' : 
                  systemStatus.courses.status === 'offline' ? 'bg-red-50' : 'bg-gray-50'
                }`}>
                  <div className="flex-1">
                    <span className="font-medium">Course System</span>
                    <p className="text-xs text-gray-600 mt-1">{systemStatus.courses.message}</p>
                  </div>
                  <span className={`font-semibold ${
                    systemStatus.courses.status === 'online' ? 'text-green-600' : 
                    systemStatus.courses.status === 'warning' ? 'text-yellow-600' : 
                    systemStatus.courses.status === 'offline' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {systemStatus.courses.status === 'online' ? 'âœ“ Online' : 
                     systemStatus.courses.status === 'warning' ? 'âš ï¸ Warning' : 
                     systemStatus.courses.status === 'offline' ? 'âŒ Offline' : 'â³ Checking'}
                  </span>
                </div>

                {/* User System Status */}
                <div className={`flex justify-between items-center p-3 rounded-lg ${
                  systemStatus.users.status === 'online' ? 'bg-green-50' : 
                  systemStatus.users.status === 'warning' ? 'bg-yellow-50' : 
                  systemStatus.users.status === 'offline' ? 'bg-red-50' : 'bg-gray-50'
                }`}>
                  <div className="flex-1">
                    <span className="font-medium">User System</span>
                    <p className="text-xs text-gray-600 mt-1">{systemStatus.users.message}</p>
                  </div>
                  <span className={`font-semibold ${
                    systemStatus.users.status === 'online' ? 'text-green-600' : 
                    systemStatus.users.status === 'warning' ? 'text-yellow-600' : 
                    systemStatus.users.status === 'offline' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {systemStatus.users.status === 'online' ? 'âœ“ Online' : 
                     systemStatus.users.status === 'warning' ? 'âš ï¸ Warning' : 
                     systemStatus.users.status === 'offline' ? 'âŒ Offline' : 'â³ Checking'}
                  </span>
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
                  <button onClick={() => { 
                    setCourseEditorTab('basic');
                    setEditingCourse(null); 
                    setNewCourse({ 
                      title: '', 
                      category: '', 
                      subject: '', 
                      description: '', 
                      intro: '', 
                      summary: '', 
                      difficulty: 'beginner',
                      estimatedTime: 30,
                      ageRangeMin: 6,
                      ageRangeMax: 16,
                      sections: [{ title: '', text: '', images: [], videos: [], bulletPoints: [], practiceQuestions: [] }], 
                      questions: [{ type: 'multiple-choice', q: '', opts: ['', '', '', ''], ans: 0, explanation: '' }] 
                    }); 
                  }} className="text-red-600 hover:text-red-700">
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
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Difficulty Level:
                  </label>
                  <select
                    value={newCourse.difficulty || 'beginner'}
                    onChange={(e) => setNewCourse({ ...newCourse, difficulty: e.target.value })}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:border-red-500 focus:outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estimated Time (minutes):
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    step="5"
                    value={newCourse.estimatedTime || 30}
                    onChange={(e) => setNewCourse({ ...newCourse, estimatedTime: parseInt(e.target.value) || 30 })}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:border-red-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How long will it take to complete this course?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Min Age:
                    </label>
                    <input
                      type="number"
                      min="4"
                      max="18"
                      value={newCourse.ageRangeMin || 6}
                      onChange={(e) => setNewCourse({ ...newCourse, ageRangeMin: parseInt(e.target.value) || 6 })}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Max Age:
                    </label>
                    <input
                      type="number"
                      min="4"
                      max="18"
                      value={newCourse.ageRangeMax || 16}
                      onChange={(e) => setNewCourse({ ...newCourse, ageRangeMax: parseInt(e.target.value) || 16 })}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Recommended age range for this course
                </p>

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
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Section {idx + 1}</span>
                          {idx > 0 && (
                            <button
                              onClick={() => {
                                const newSections = moveArrayItem(newCourse.sections, idx, idx - 1);
                                setNewCourse({ ...newCourse, sections: newSections });
                              }}
                              className="text-gray-500 hover:text-gray-700 text-lg px-2"
                              title="Move up"
                            >
                              Ã¢â€ â€˜
                            </button>
                          )}
                          {idx < newCourse.sections.length - 1 && (
                            <button
                              onClick={() => {
                                const newSections = moveArrayItem(newCourse.sections, idx, idx + 1);
                                setNewCourse({ ...newCourse, sections: newSections });
                              }}
                              className="text-gray-500 hover:text-gray-700 text-lg px-2"
                              title="Move down"
                            >
                              Ã¢â€ â€œ
                            </button>
                          )}
                        </div>
                        {newCourse.sections.length > 1 && (
                          <button onClick={() => removeSection(idx)} className="text-red-600 hover:text-red-700" title="Remove section">
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
                        className="w-full px-3 py-2 border rounded-lg mb-3"
                        rows={3}
                      />

                      {/* Image Management */}
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">Images</span>
                          <button 
                            onClick={() => addImage(idx)} 
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                          >
                            <Plus size={16} /> Add Image
                          </button>
                        </div>
                        {section.images && section.images.length > 0 && (
                          <div className="space-y-3">
                            {section.images.map((img, imgIdx) => (
                              <div key={imgIdx} className="p-3 bg-white rounded border">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-medium">Image {imgIdx + 1}</span>
                                  <button 
                                    onClick={() => removeImage(idx, imgIdx)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle size={16} />
                                  </button>
                                </div>
                                
                                {/* File Upload Button */}
                                <div className="mb-2">
                                  <label className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded cursor-pointer hover:bg-blue-100 transition-colors">
                                    <Upload size={16} />
                                    <span className="text-sm font-medium">
                                      {uploadingImage?.sectionIdx === idx && uploadingImage?.imageIdx === imgIdx
                                        ? `Uploading... ${uploadProgress}%`
                                        : 'Upload Image File'}
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          handleImageUpload(idx, imgIdx, e.target.files[0]);
                                        }
                                      }}
                                      className="hidden"
                                      disabled={uploadingImage !== null}
                                    />
                                  </label>
                                  {uploadingImage?.sectionIdx === idx && uploadingImage?.imageIdx === imgIdx && (
                                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                        style={{ width: `${uploadProgress}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="text-center text-xs text-gray-500 mb-2">OR</div>
                                
                                <input
                                  type="text"
                                  placeholder="Image URL (paste link)"
                                  value={img.url}
                                  onChange={(e) => updateImage(idx, imgIdx, 'url', e.target.value)}
                                  className="w-full px-2 py-1 border rounded mb-2 text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Caption"
                                  value={img.caption}
                                  onChange={(e) => updateImage(idx, imgIdx, 'caption', e.target.value)}
                                  className="w-full px-2 py-1 border rounded mb-2 text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Alt Text (for accessibility)"
                                  value={img.alt}
                                  onChange={(e) => updateImage(idx, imgIdx, 'alt', e.target.value)}
                                  className="w-full px-2 py-1 border rounded text-sm"
                                />
                                {img.url && (
                                  <div className="mt-2">
                                    <img 
                                      src={img.url} 
                                      alt={img.alt || 'Preview'} 
                                      className="max-w-full h-auto rounded"
                                      onError={(e) => e.target.style.display = 'none'}
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Video Management */}
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">Videos</span>
                          <button 
                            onClick={() => addVideo(idx)} 
                            className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
                          >
                            <Plus size={16} /> Add Video
                          </button>
                        </div>
                        {section.videos && section.videos.length > 0 && (
                          <div className="space-y-3">
                            {section.videos.map((vid, vidIdx) => (
                              <div key={vidIdx} className="p-3 bg-white rounded border">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-medium">Video {vidIdx + 1}</span>
                                  <button 
                                    onClick={() => removeVideo(idx, vidIdx)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle size={16} />
                                  </button>
                                </div>
                                
                                {/* File Upload Button */}
                                <div className="mb-2">
                                  <label className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded cursor-pointer hover:bg-purple-100 transition-colors">
                                    <Upload size={16} />
                                    <span className="text-sm font-medium">
                                      {uploadingVideo?.sectionIdx === idx && uploadingVideo?.videoIdx === vidIdx
                                        ? `Uploading... ${uploadProgress}%`
                                        : 'Upload Video File'}
                                    </span>
                                    <input
                                      type="file"
                                      accept="video/*"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          handleVideoUpload(idx, vidIdx, e.target.files[0]);
                                        }
                                      }}
                                      className="hidden"
                                      disabled={uploadingVideo !== null}
                                    />
                                  </label>
                                  {uploadingVideo?.sectionIdx === idx && uploadingVideo?.videoIdx === vidIdx && (
                                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-purple-600 h-2 rounded-full transition-all"
                                        style={{ width: `${uploadProgress}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="text-center text-xs text-gray-500 mb-2">OR paste YouTube/Vimeo link</div>
                                
                                <select
                                  value={vid.platform}
                                  onChange={(e) => updateVideo(idx, vidIdx, 'platform', e.target.value)}
                                  className="w-full px-2 py-1 border rounded mb-2 text-sm"
                                >
                                  <option value="youtube">YouTube</option>
                                  <option value="vimeo">Vimeo</option>
                                  <option value="upload">Uploaded File</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="Video URL (or use upload button above)"
                                  value={vid.url}
                                  onChange={(e) => updateVideo(idx, vidIdx, 'url', e.target.value)}
                                  className="w-full px-2 py-1 border rounded mb-2 text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Video Title"
                                  value={vid.title}
                                  onChange={(e) => updateVideo(idx, vidIdx, 'title', e.target.value)}
                                  className="w-full px-2 py-1 border rounded text-sm"
                                />
                                {vid.url && (
                                  <div className="mt-2">
                                    <iframe
                                      src={formatVideoUrl(vid.url, vid.platform)}
                                      title={vid.title || 'Video Preview'}
                                      className="w-full aspect-video rounded"
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Practice Questions */}
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Practice Questions:
                          </label>
                          <button
                            onClick={() => {
                              const practiceQuestions = section.practiceQuestions || [];
                              const updated = newCourse.sections.map((s, i) => {
                                if (i === idx) {
                                  return {
                                    ...s,
                                    practiceQuestions: [
                                      ...practiceQuestions, 
                                      { question: '', answer: '', hint: '' }
                                    ]
                                  };
                                }
                                return s;
                              });
                              setNewCourse({ ...newCourse, sections: updated });
                            }}
                            className="text-teal-600 hover:text-teal-700 text-sm font-semibold"
                          >
                            + Add Practice Question
                          </button>
                        </div>
                        
                        {section.practiceQuestions && section.practiceQuestions.length > 0 && (
                          <div className="space-y-2">
                            {section.practiceQuestions.map((practice, practiceIdx) => (
                              <div key={practiceIdx} className="bg-white p-3 rounded-lg border">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-semibold text-gray-600">
                                    Practice {practiceIdx + 1}
                                  </span>
                                  <button
                                    onClick={() => {
                                      const practiceQuestions = [...section.practiceQuestions];
                                      practiceQuestions.splice(practiceIdx, 1);
                                      const updated = newCourse.sections.map((s, i) => {
                                        if (i === idx) {
                                          return { ...s, practiceQuestions };
                                        }
                                        return s;
                                      });
                                      setNewCourse({ ...newCourse, sections: updated });
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle size={16} />
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Practice question (e.g., What is 5 + 3?)"
                                  value={practice.question}
                                  onChange={(e) => {
                                    const practiceQuestions = [...section.practiceQuestions];
                                    practiceQuestions[practiceIdx].question = e.target.value;
                                    const updated = newCourse.sections.map((s, i) => {
                                      if (i === idx) {
                                        return { ...s, practiceQuestions };
                                      }
                                      return s;
                                    });
                                    setNewCourse({ ...newCourse, sections: updated });
                                  }}
                                  className="w-full px-2 py-1 border rounded mb-2 text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Correct answer (e.g., 8)"
                                  value={practice.answer}
                                  onChange={(e) => {
                                    const practiceQuestions = [...section.practiceQuestions];
                                    practiceQuestions[practiceIdx].answer = e.target.value;
                                    const updated = newCourse.sections.map((s, i) => {
                                      if (i === idx) {
                                        return { ...s, practiceQuestions };
                                      }
                                      return s;
                                    });
                                    setNewCourse({ ...newCourse, sections: updated });
                                  }}
                                  className="w-full px-2 py-1 border rounded mb-2 text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Hint (optional)"
                                  value={practice.hint}
                                  onChange={(e) => {
                                    const practiceQuestions = [...section.practiceQuestions];
                                    practiceQuestions[practiceIdx].hint = e.target.value;
                                    const updated = newCourse.sections.map((s, i) => {
                                      if (i === idx) {
                                        return { ...s, practiceQuestions };
                                      }
                                      return s;
                                    });
                                    setNewCourse({ ...newCourse, sections: updated });
                                  }}
                                  className="w-full px-2 py-1 border rounded text-sm"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Non-graded practice for better learning
                        </p>
                      </div>
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
                  {newCourse.questions.map((question, qIdx) => {
                    const qType = question.type || 'multiple-choice';
                    
                    return (
                      <div key={qIdx} className="mb-4 p-4 border-2 rounded-xl bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">Question {qIdx + 1}</span>
                            {qIdx > 0 && (
                              <button
                                onClick={() => {
                                  const newQuestions = moveArrayItem(newCourse.questions, qIdx, qIdx - 1);
                                  setNewCourse({ ...newCourse, questions: newQuestions });
                                }}
                                className="text-gray-500 hover:text-gray-700 text-lg px-2"
                                title="Move up"
                              >
                                Ã¢â€ â€˜
                              </button>
                            )}
                            {qIdx < newCourse.questions.length - 1 && (
                              <button
                                onClick={() => {
                                  const newQuestions = moveArrayItem(newCourse.questions, qIdx, qIdx + 1);
                                  setNewCourse({ ...newCourse, questions: newQuestions });
                                }}
                                className="text-gray-500 hover:text-gray-700 text-lg px-2"
                                title="Move down"
                              >
                                Ã¢â€ â€œ
                              </button>
                            )}
                          </div>
                          {newCourse.questions.length > 1 && (
                            <button onClick={() => removeQuestion(qIdx)} className="text-red-600 hover:text-red-700" title="Remove question">
                              <XCircle size={20} />
                            </button>
                          )}
                        </div>
                        
                        {/* Question Type Selector */}
                        <div className="mb-3">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Question Type:
                          </label>
                          <select
                            value={qType}
                            onChange={(e) => {
                              const questions = [...newCourse.questions];
                              const newType = e.target.value;
                              
                              // Initialize question based on type
                              if (newType === 'multiple-choice') {
                                questions[qIdx] = { type: 'multiple-choice', q: questions[qIdx].q || '', opts: ['', '', '', ''], ans: 0, explanation: questions[qIdx].explanation || '' };
                              } else if (newType === 'true-false') {
                                questions[qIdx] = { type: 'true-false', q: questions[qIdx].q || '', ans: true, explanation: questions[qIdx].explanation || '' };
                              } else if (newType === 'fill-blank') {
                                questions[qIdx] = { type: 'fill-blank', q: questions[qIdx].q || '', ans: '', acceptedAnswers: [], explanation: questions[qIdx].explanation || '' };
                              } else if (newType === 'matching') {
                                questions[qIdx] = { type: 'matching', q: questions[qIdx].q || '', pairs: [{ left: '', right: '' }, { left: '', right: '' }], explanation: questions[qIdx].explanation || '' };
                              }
                              
                              setNewCourse({ ...newCourse, questions });
                            }}
                            className="w-full px-3 py-2 border-2 rounded-lg focus:border-teal-500 focus:outline-none"
                          >
                            <option value="multiple-choice">Multiple Choice</option>
                            <option value="true-false">True/False</option>
                            <option value="fill-blank">Fill in the Blank</option>
                            <option value="matching">Matching</option>
                          </select>
                        </div>
                        
                        {/* Question Text */}
                        <input
                          type="text"
                          placeholder="Question"
                          value={question.q}
                          onChange={(e) => updateQuestion(qIdx, 'q', e.target.value)}
                          className="w-full px-3 py-2 border-2 rounded-lg mb-3 focus:border-teal-500 focus:outline-none"
                        />
                        
                        {/* Multiple Choice Options */}
                        {qType === 'multiple-choice' && (
                          <div className="space-y-2 mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Select the correct answer by clicking the radio button:
                            </p>
                            {question.opts && question.opts.map((opt, optIdx) => (
                              <div key={optIdx} className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${question.ans === optIdx ? 'bg-green-50 border-2 border-green-500' : 'border-2 border-gray-200'}`}>
                                <input
                                  type="radio"
                                  name={`question-${qIdx}`}
                                  checked={question.ans === optIdx}
                                  onChange={() => updateQuestion(qIdx, 'ans', optIdx)}
                                  className="w-5 h-5 text-green-600 cursor-pointer"
                                />
                                <input
                                  type="text"
                                  placeholder={`Option ${optIdx + 1}`}
                                  value={opt}
                                  onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                                  className="flex-1 px-3 py-2 border rounded-lg"
                                />
                                <span className={`text-sm font-bold ${question.ans === optIdx ? 'text-green-600' : 'text-gray-400'}`}>
                                  {question.ans === optIdx ? 'âœ“ CORRECT' : 'Wrong'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* True/False Answer */}
                        {qType === 'true-false' && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Correct Answer:</p>
                            <div className="flex gap-3">
                              <label className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-colors ${question.ans === true ? 'bg-green-50 border-green-500' : 'border-gray-200 hover:border-gray-300'}`}>
                                <input
                                  type="radio"
                                  name={`tf-${qIdx}`}
                                  checked={question.ans === true}
                                  onChange={() => updateQuestion(qIdx, 'ans', true)}
                                  className="mr-2"
                                />
                                <span className="font-semibold">True</span>
                              </label>
                              <label className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-colors ${question.ans === false ? 'bg-green-50 border-green-500' : 'border-gray-200 hover:border-gray-300'}`}>
                                <input
                                  type="radio"
                                  name={`tf-${qIdx}`}
                                  checked={question.ans === false}
                                  onChange={() => updateQuestion(qIdx, 'ans', false)}
                                  className="mr-2"
                                />
                                <span className="font-semibold">False</span>
                              </label>
                            </div>
                          </div>
                        )}
                        
                        {/* Fill in Blank Answer */}
                        {qType === 'fill-blank' && (
                          <>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Correct Answer:
                            </label>
                            <input
                              type="text"
                              placeholder="The correct answer"
                              value={question.ans}
                              onChange={(e) => updateQuestion(qIdx, 'ans', e.target.value)}
                              className="w-full px-3 py-2 border-2 rounded-lg mb-3 focus:border-teal-500 focus:outline-none"
                            />
                            
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Accepted Variations (one per line, optional):
                            </label>
                            <textarea
                              placeholder="Example: paris&#10;PARIS&#10;Paris, France"
                              value={(question.acceptedAnswers || []).join('\n')}
                              onChange={(e) => {
                                const variations = e.target.value.split('\n').filter(v => v.trim());
                                updateQuestion(qIdx, 'acceptedAnswers', variations);
                              }}
                              className="w-full px-3 py-2 border-2 rounded-lg mb-3 focus:border-teal-500 focus:outline-none"
                              rows={3}
                            />
                            <p className="text-xs text-gray-500 mb-3">
                              Add different ways to spell or format the answer
                            </p>
                          </>
                        )}
                        
                        {/* Matching Pairs */}
                        {qType === 'matching' && (
                          <>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Matching Pairs:
                            </label>
                            <div className="space-y-2 mb-3">
                              {(question.pairs || []).map((pair, pairIdx) => (
                                <div key={pairIdx} className="flex gap-2 items-center bg-white p-2 rounded-lg">
                                  <input
                                    type="text"
                                    placeholder="Left side"
                                    value={pair.left}
                                    onChange={(e) => {
                                      const questions = [...newCourse.questions];
                                      questions[qIdx].pairs[pairIdx].left = e.target.value;
                                      setNewCourse({ ...newCourse, questions });
                                    }}
                                    className="flex-1 px-2 py-1 border rounded"
                                  />
                                  <span className="text-gray-400">Ã¢â€ â€™</span>
                                  <input
                                    type="text"
                                    placeholder="Right side"
                                    value={pair.right}
                                    onChange={(e) => {
                                      const questions = [...newCourse.questions];
                                      questions[qIdx].pairs[pairIdx].right = e.target.value;
                                      setNewCourse({ ...newCourse, questions });
                                    }}
                                    className="flex-1 px-2 py-1 border rounded"
                                  />
                                  {question.pairs.length > 2 && (
                                    <button
                                      onClick={() => {
                                        const questions = [...newCourse.questions];
                                        questions[qIdx].pairs.splice(pairIdx, 1);
                                        setNewCourse({ ...newCourse, questions });
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <XCircle size={16} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => {
                                const questions = [...newCourse.questions];
                                if (!questions[qIdx].pairs) questions[qIdx].pairs = [];
                                questions[qIdx].pairs.push({ left: '', right: '' });
                                setNewCourse({ ...newCourse, questions });
                              }}
                              className="text-teal-600 hover:text-teal-700 text-sm font-semibold mb-3"
                            >
                              + Add Pair
                            </button>
                          </>
                        )}
                        
                        {/* Explanation (for all types) */}
                        <div className="mt-3">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Explanation (shown after quiz):
                          </label>
                          <textarea
                            placeholder="Explain why this is the correct answer..."
                            value={question.explanation || ''}
                            onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
                            className="w-full px-3 py-2 border-2 rounded-lg focus:border-teal-500 focus:outline-none"
                            rows={2}
                          />
                        </div>
                      </div>
                    );
                  })}
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
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{course.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{course.subject}</p>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                        <span>ðŸ“š {course.sections?.length || 0} sections</span>
                        <span>Ã¢Ââ€œ {course.questions?.length || 0} questions</span>
                        <span>â±ï¸ {course.estimatedTime || course.estimated_time || 30} min</span>
                        <span className="capitalize">ðŸ“Š {course.difficulty || 'beginner'}</span>
                        <span>ðŸ‘¶ Ages {course.ageRangeMin || course.age_range_min || 6}-{course.ageRangeMax || course.age_range_max || 16}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { 
                          setLoadingCourse(true);
                          // Use startTransition to prevent UI blocking
                          startTransition(() => {
                            setEditingCourse(course);
                            setNewCourse(course);
                            setLoadingCourse(false);
                            // Scroll to form smoothly
                            setTimeout(() => {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 100);
                          });
                        }}
                        disabled={loadingCourse}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loadingCourse ? (
                          <>
                            <span className="animate-spin">â¸</span>
                            Loading...
                          </>
                        ) : (
                          'Edit'
                        )}
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
