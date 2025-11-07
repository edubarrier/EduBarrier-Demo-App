import React, { useState, useEffect } from 'react';
import { Book, Users, Trophy, XCircle, Plus, LogOut, Eye, EyeOff } from 'lucide-react';
import { storage, db } from './supabase';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [signup, setSignup] = useState(false);
  const [type, setType] = useState('parent');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [householdAction, setHouseholdAction] = useState('create'); // 'create' or 'join'

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    // Initialize courses if they don't exist
    const existingCourses = await storage.get('courses');
    if (!existingCourses) {
      await storage.set('courses', defaultCourses);
    }
    
    // Initialize subjects if they don't exist
    const existingSubjects = await storage.get('subjects');
    if (!existingSubjects) {
      await storage.set('subjects', ['Math', 'Reading', 'Science', 'History']);
    }
    
    // Always start at login screen - no auto-login
    // Users must manually log in each time
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
    
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    
    // Admin login
    if (email === 'admin@edubarrier.com' && password === 'admin2025') {
      const u = { id: 'admin', email, role: 'admin', name: 'Admin' };
      await storage.set('session', u);
      setUser(u);
      setView('admin');
      return;
    }
    
    if (email === 'demo@parent.com' && password === 'demo') {
      const u = { id: 'demo', email, role: 'parent', name: 'Demo Parent', familyId: 'fam1' };
      await storage.set('session', u);
      const existingFamily = await storage.get('fam-fam1');
      if (!existingFamily) {
        await storage.set('fam-fam1', {
          id: 'fam1',
          name: 'Demo Family',
          code: 'AB12',
          parents: ['demo'],
          children: []
        });
      }
      setUser(u);
      setView('parent');
      return;
    }

    const users = await storage.get('users') || [];
    const found = users.find(u => u.email === email && u.password === password);
    
    if (found) {
      await storage.set('session', found);
      setUser(found);
      setView(found.role === 'parent' ? 'parent' : 'child');
    } else {
      setError('Invalid email or password');
    }
  };

  const handleSignup = async () => {
    setError('');
    
    if (!email || !password || !name) {
      setError('Please fill in all fields');
      return;
    }
    
    const users = await storage.get('users') || [];
    
    if (users.find(u => u.email === email)) {
      setError('Email already exists');
      return;
    }

    const newUser = {
      id: 'u' + Date.now(),
      email,
      password,
      name,
      role: type
    };

    if (type === 'parent') {
      if (householdAction === 'create') {
        // Create new household with 4-digit code
        const fid = 'f' + Date.now();
        const householdCode = generateHouseholdCode();
        
        newUser.familyId = fid;
        await storage.set('fam-' + fid, {
          id: fid,
          name: name + "'s Household",
          code: householdCode,
          parents: [newUser.id],
          children: []
        });
        
        users.push(newUser);
        await storage.set('users', users);
        await storage.set('session', newUser);
        setUser(newUser);
        setView('parent');
      } else {
        // Join existing household
        if (!code) {
          setError('Please enter household code');
          return;
        }
        
        let foundFamily = null;
        let foundFamilyKey = null;
        
        // Check demo household
        const demoFam = await storage.get('fam-fam1');
        if (demoFam && demoFam.code === code) {
          foundFamily = demoFam;
          foundFamilyKey = 'fam-fam1';
        }
        
        // Check other households
        if (!foundFamily) {
          for (const u of users) {
            if (u.role === 'parent' && u.familyId) {
              const fam = await storage.get('fam-' + u.familyId);
              if (fam && fam.code === code) {
                foundFamily = fam;
                foundFamilyKey = 'fam-' + u.familyId;
                break;
              }
            }
          }
        }
        
        if (!foundFamily) {
          setError('Invalid household code. Please check and try again.');
          return;
        }
        
        newUser.familyId = foundFamily.id;
        
        if (!foundFamily.parents) {
          foundFamily.parents = [];
        }
        foundFamily.parents.push(newUser.id);
        
        await storage.set(foundFamilyKey, foundFamily);
        
        users.push(newUser);
        await storage.set('users', users);
        await storage.set('session', newUser);
        
        setUser(newUser);
        setView('parent');
      }
    } else {
      // Child signup - join household
      if (!code) {
        setError('Please enter household code');
        return;
      }
      
      let foundFamily = null;
      let foundFamilyKey = null;
      
      const demoFam = await storage.get('fam-fam1');
      if (demoFam && demoFam.code === code) {
        foundFamily = demoFam;
        foundFamilyKey = 'fam-fam1';
      }
      
      if (!foundFamily) {
        for (const u of users) {
          if (u.role === 'parent' && u.familyId) {
            const fam = await storage.get('fam-' + u.familyId);
            if (fam && fam.code === code) {
              foundFamily = fam;
              foundFamilyKey = 'fam-' + u.familyId;
              break;
            }
          }
        }
      }
      
      if (!foundFamily) {
        setError('Invalid household code. Please check and try again.');
        return;
      }
      
      newUser.familyId = foundFamily.id;
      
      if (!foundFamily.children) {
        foundFamily.children = [];
      }
      
      foundFamily.children.push(newUser.id);
      
      await storage.set(foundFamilyKey, foundFamily);
      
      users.push(newUser);
      await storage.set('users', users);
      await storage.set('session', newUser);
      
      setUser(newUser);
      setView('child');
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

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-24 h-24 flex items-center justify-center mx-auto mb-4">
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
            
            {signup && <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500" />}
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500" />
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500" />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-gray-400">
                {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {signup && (type === 'child' || (type === 'parent' && householdAction === 'join')) && (
              <input
                type="text"
                placeholder="Household Code (4 digits)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength="4"
                className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500"
              />
            )}
            <button onClick={signup ? handleSignup : handleLogin} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold">
              {signup ? 'Sign Up' : 'Login'}
            </button>
            <button onClick={() => setSignup(!signup)} className="w-full text-indigo-600 py-2 text-sm">
              {signup ? 'Have account? Login' : 'Need account? Sign Up'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm font-semibold text-gray-700 mb-2">Demo Accounts:</p>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Parent:</span> demo@parent.com / demo</p>
              <p><span className="font-medium">Admin:</span> admin@edubarrier.com / admin2025</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">Admin can manage courses, users & system</p>
          </div>
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
    // Only set up interval if not editing
    if (!editingHousehold && !editingChild) {
      const interval = setInterval(load, 3000);
      return () => clearInterval(interval);
    }
  }, [user.familyId, editingHousehold, editingChild]);

  const load = async () => {
    try {
      const f = await storage.get('fam-' + user.familyId);
      console.log('Loaded family data:', f); // Debug log
      console.log('Storage key:', 'fam-' + user.familyId); // Debug log
      setFam(f);
      if (f) {
        // Only update householdName state if not currently editing
        if (!editingHousehold) {
          setHouseholdName(f.name || '');
        }
        const users = await storage.get('users') || [];
        const childUsers = users.filter(u => f.children.includes(u.id));
        setKids(childUsers);
      } else {
        console.warn('No family data found for:', 'fam-' + user.familyId);
      }
      const a = await storage.get('assigns-' + user.familyId) || [];
      setAssigns(a);
      
      // Load courses
      const c = await storage.get('courses') || defaultCourses;
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
    
    const a = {
      id: 'a' + Date.now(),
      childId: selKid,
      courseId: selCourse,
      mins: parseInt(mins),
      pass: parseInt(passScore),
      status: 'pending'
    };
    const updated = [...assigns, a];
    await storage.set('assigns-' + user.familyId, updated);
    setAssigns(updated);
    setSelKid('');
    setSelCourse('');
    setMessage('Course assigned successfully!');
  };

  const updateHouseholdName = async () => {
    if (!householdName.trim()) {
      setMessage('Please enter a household name');
      return;
    }
    
    try {
      const f = await storage.get('fam-' + user.familyId);
      if (f) {
        f.name = householdName.trim();
        await storage.set('fam-' + user.familyId, f);
        setFam(f); // Update local state immediately
        setEditingHousehold(false);
        setMessage('Household name updated successfully!');
        // Auto-dismiss message after 3 seconds
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
    const users = await storage.get('users') || [];
    const childIdx = users.findIndex(u => u.id === childId);
    
    if (childIdx !== -1) {
      // Check if email is being changed and if it already exists
      if (updates.email && updates.email !== users[childIdx].email) {
        if (users.find(u => u.email === updates.email && u.id !== childId)) {
          setMessage('Email already exists');
          return;
        }
      }
      
      users[childIdx] = { ...users[childIdx], ...updates };
      await storage.set('users', users);
      setEditingChild(null);
      setMessage('Child information updated successfully!');
      load();
    }
  };

  const deleteChild = async (childId) => {
    if (!confirm('Are you sure you want to remove this child from your household?')) {
      return;
    }
    
    // Remove from family
    const f = await storage.get('fam-' + user.familyId);
    if (f) {
      f.children = f.children.filter(id => id !== childId);
      await storage.set('fam-' + user.familyId, f);
    }
    
    // Remove child's assignments
    const assignsList = await storage.get('assigns-' + user.familyId) || [];
    const filtered = assignsList.filter(a => a.childId !== childId);
    await storage.set('assigns-' + user.familyId, filtered);
    
    // Remove from users list
    const users = await storage.get('users') || [];
    const updatedUsers = users.filter(u => u.id !== childId);
    await storage.set('users', updatedUsers);
    
    setMessage('Child removed successfully');
    load();
  };

  const toggleChildLock = async (childId) => {
    const currentLock = await storage.get('child-locked-' + childId);
    const newLockState = !currentLock;
    
    await storage.set('child-locked-' + childId, newLockState);
    
    // If locking, also pause their timer
    if (newLockState) {
      await storage.set('timer-running-' + childId, false);
    }
    
    setMessage(newLockState ? 'Child screen access LOCKED' : 'Child screen access UNLOCKED');
    setTimeout(() => setMessage(''), 3000);
    load();
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
  const ChildCard = ({ child, assigns, editingChild, setEditingChild, updateChildInfo, deleteChild, toggleChildLock }) => {
    const [isLocked, setIsLocked] = useState(false);
    
    useEffect(() => {
      storage.get('child-locked-' + child.id).then(locked => setIsLocked(locked || false));
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
                <p className="text-2xl font-bold text-purple-600">{totalTime}m</p>
                <p className="text-xs text-gray-600">Earned</p>
              </div>
            </div>

            <div className="space-y-2">
              {/* Lock Status Banner */}
              {isLocked && (
                <div className="bg-red-100 border-2 border-red-300 rounded-lg p-2 text-center">
                  <p className="text-red-700 font-bold text-sm">ðŸ”’ Screen Access LOCKED</p>
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
                {isLocked ? 'ðŸ”“ Unlock Screen Access' : 'ðŸ”’ Lock Screen Access'}
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
                      <div>
                        <p className="font-medium text-gray-800">{child?.name}</p>
                        <p className="text-sm text-gray-600">{course?.title}</p>
                      </div>
                      <span className={'px-3 py-1 rounded-full text-xs font-medium ' + (a.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700')}>
                        {a.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
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
                  onClick={() => {
                    const users_promise = storage.get('users');
                    const fam_promise = storage.get('fam-' + user.familyId);
                    Promise.all([users_promise, fam_promise]).then(([users, f]) => {
                      if (!f) return;
                      const childrenWithFamily = (users || []).filter(u => u.role === 'child' && u.familyId === user.familyId);
                      let updated = false;
                      for (const child of childrenWithFamily) {
                        if (!f.children.includes(child.id)) {
                          f.children.push(child.id);
                          updated = true;
                        }
                      }
                      if (updated) {
                        storage.set('fam-' + user.familyId, f).then(() => {
                          setMessage('Fixed! Children now showing.');
                          load();
                        });
                      } else {
                        setMessage('No issues found.');
                      }
                    });
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
                                    <div>
                                      <h5 className="font-bold text-gray-800">{course?.title}</h5>
                                      <p className="text-sm text-gray-600">{course?.category}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Reward: {a.mins} minutes | Passing: {a.pass}%
                                      </p>
                                    </div>
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        a.status === 'completed'
                                          ? 'bg-green-200 text-green-800'
                                          : 'bg-orange-200 text-orange-800'
                                      }`}
                                    >
                                      {a.status === 'completed' ? `âœ“ ${a.score}%` : 'Pending'}
                                    </span>
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
                            <p className="text-sm text-gray-600">{child?.name} â€¢ {a.mins}min reward</p>
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

  useEffect(() => {
    loadData();
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, []);

  const loadData = async () => {
    const users = await storage.get('users') || [];
    const parent = users.find(u => u.role === 'parent' && u.familyId === user.familyId);
    if (parent) {
      const a = await storage.get('assigns-' + parent.familyId) || [];
      setAssigns(a.filter(x => x.childId === user.id));
    }
    const t = await storage.get('time-' + user.id) || { total: 0, used: 0 };
    setTimeData(t);
    
    // Load courses
    const c = await storage.get('courses') || defaultCourses;
    setCourses(c);
    
    // Check if timer was running
    const wasRunning = await storage.get('timer-running-' + user.id);
    const isLocked = await storage.get('child-locked-' + user.id);
    
    // If locked, force timer to pause
    if (isLocked && wasRunning) {
      await storage.set('timer-running-' + user.id, false);
      setIsTimerRunning(false);
    } else if (wasRunning && !isLocked) {
      setIsTimerRunning(true);
    }
  };

  const startTimer = async () => {
    // Check if locked
    const isLocked = await storage.get('child-locked-' + user.id);
    if (isLocked) {
      alert('Screen access is locked by your parent. Please ask them to unlock it.');
      return;
    }
    
    if (timerInterval) return; // Already running
    
    setIsTimerRunning(true);
    storage.set('timer-running-' + user.id, true);
    
    const interval = setInterval(async () => {
      // Check if locked during timer
      const isLocked = await storage.get('child-locked-' + user.id);
      if (isLocked) {
        clearInterval(interval);
        setIsTimerRunning(false);
        setTimerInterval(null);
        await storage.set('timer-running-' + user.id, false);
        alert('Screen access has been locked by your parent.');
        return;
      }
      
      const currentTime = await storage.get('time-' + user.id) || { total: 0, used: 0 };
      const remaining = currentTime.total - currentTime.used;
      
      if (remaining <= 0) {
        // Time's up!
        clearInterval(interval);
        setIsTimerRunning(false);
        setTimerInterval(null);
        await storage.set('timer-running-' + user.id, false);
        alert('Screen time is up! Complete more courses to earn more time.');
        return;
      }
      
      // Increment used time by 1 minute
      const updated = { ...currentTime, used: currentTime.used + 1 };
      await storage.set('time-' + user.id, updated);
      setTimeData(updated);
    }, 60000); // Every 1 minute
    
    setTimerInterval(interval);
  };

  const pauseTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setIsTimerRunning(false);
    storage.set('timer-running-' + user.id, false);
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const [isLocked, setIsLocked] = React.useState(false);
  
  // Check lock status periodically
  React.useEffect(() => {
    const checkLock = async () => {
      const locked = await storage.get('child-locked-' + user.id);
      setIsLocked(locked || false);
      
      // If locked, pause timer
      if (locked && isTimerRunning) {
        pauseTimer();
      }
    };
    
    checkLock();
    const interval = setInterval(checkLock, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [user.id, isTimerRunning]);

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
    const correct = ans.filter((a, i) => a === course.questions[i].ans).length;
    const score = Math.round((correct / course.questions.length) * 100);
    const passed = score >= active.pass;

    const users = await storage.get('users') || [];
    const parent = users.find(u => u.role === 'parent' && u.familyId === user.familyId);
    if (parent) {
      const assignsList = await storage.get('assigns-' + parent.familyId) || [];
      const idx = assignsList.findIndex(a => a.id === active.id);
      if (idx !== -1) {
        assignsList[idx].status = passed ? 'completed' : 'pending';
        assignsList[idx].score = score;
        await storage.set('assigns-' + parent.familyId, assignsList);
        if (passed) {
          const t = await storage.get('time-' + user.id) || { total: 0, used: 0 };
          t.total += active.mins;
          await storage.set('time-' + user.id, t);
          setTimeData(t);
        }
      }
    }
    setResults({ score, passed, correct, total: course.questions.length });
  };

  const closeAll = () => {
    setActive(null);
    setViewing(false);
    setResults(null);
    loadData();
  };

  const pending = assigns.filter(a => a.status === 'pending');
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
          <button onClick={onLogout} className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Screen Time</h2>
          
          {/* Lock Status Warning */}
          {isLocked && (
            <div className="bg-red-100 border-2 border-red-300 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">ðŸ”’</div>
                <div>
                  <p className="text-red-800 font-bold">Screen Access Locked</p>
                  <p className="text-red-700 text-sm">Your parent has locked your screen access. Please ask them to unlock it.</p>
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
          
          {/* Pause/Play Button */}
          {remaining > 0 && !isLocked && (
            <button
              onClick={toggleTimer}
              className={`w-full py-4 rounded-xl font-bold text-white mb-4 transition-all ${
                isTimerRunning 
                  ? 'bg-orange-500 hover:bg-orange-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isTimerRunning ? 'â¸ï¸ Pause Timer' : 'â–¶ï¸ Start Timer'}
            </button>
          )}
          
          {isLocked && (
            <div className="bg-gray-200 text-gray-500 w-full py-4 rounded-xl font-bold mb-4 text-center cursor-not-allowed">
              ðŸ”’ Timer Controls Disabled
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
    const c = await storage.get('courses') || defaultCourses;
    setCourses(c);
    
    const s = await storage.get('subjects') || ['Math', 'Reading', 'Science', 'History'];
    setSubjects(s);
    
    const u = await storage.get('users') || [];
    setUsers(u);
    
    // Load all families
    const famList = [];
    for (const u of users) {
      if (u.familyId) {
        const fam = await storage.get('fam-' + u.familyId);
        if (fam && !famList.find(f => f.id === fam.id)) {
          famList.push(fam);
        }
      }
    }
    setFamilies(famList);
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
      
      let updatedCourses;
      if (editingCourse) {
        updatedCourses = courses.map(c => c.id === editingCourse.id ? courseToSave : c);
      } else {
        updatedCourses = [...courses, courseToSave];
      }
      
      await storage.set('courses', updatedCourses);
      setCourses(updatedCourses);
      setMessage(editingCourse ? 'Course updated successfully!' : 'Course created successfully!');
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
      setError('Error saving course: ' + err.message);
    }
  };

  const deleteCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    
    const updated = courses.filter(c => c.id !== courseId);
    await storage.set('courses', updated);
    setCourses(updated);
    setMessage('Course deleted successfully!');
    setTimeout(() => setMessage(''), 3000);
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
    
    const updated = [...subjects, newSubject.trim()];
    await storage.set('subjects', updated);
    setSubjects(updated);
    setNewSubject('');
    setMessage('Subject added successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const deleteSubject = async (subject) => {
    if (!confirm(`Are you sure you want to delete the subject "${subject}"?`)) return;
    
    const updated = subjects.filter(s => s !== subject);
    await storage.set('subjects', updated);
    setSubjects(updated);
    setMessage('Subject deleted successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const resetUserPassword = async () => {
    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }
    
    const updated = users.map(u => 
      u.id === selectedUser.id ? { ...u, password: newPassword.trim() } : u
    );
    
    await storage.set('users', updated);
    setUsers(updated);
    setSelectedUser(null);
    setNewPassword('');
    setMessage('Password reset successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    const updated = users.filter(u => u.id !== userId);
    await storage.set('users', updated);
    setUsers(updated);
    setMessage('User deleted successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const fixUserIssue = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // Fix family link
    if (user.familyId) {
      const fam = await storage.get('fam-' + user.familyId);
      if (fam) {
        if (user.role === 'parent' && !fam.parents.includes(userId)) {
          fam.parents.push(userId);
          await storage.set('fam-' + user.familyId, fam);
        } else if (user.role === 'child' && !fam.children.includes(userId)) {
          fam.children.push(userId);
          await storage.set('fam-' + user.familyId, fam);
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
                  <span className="text-green-600 font-semibold">âœ“ Online</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Course System</span>
                  <span className="text-green-600 font-semibold">âœ“ Online</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">User System</span>
                  <span className="text-green-600 font-semibold">âœ“ Online</span>
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
                            <span className="text-xs text-gray-500">{question.ans === optIdx ? 'âœ“ Correct' : ''}</span>
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
                      <p className="text-sm text-gray-600">{course.subject} â€¢ {course.sections.length} sections â€¢ {course.questions.length} questions</p>
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
                          Role: {u.role} {u.familyId && `â€¢ Family ID: ${u.familyId}`}
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
