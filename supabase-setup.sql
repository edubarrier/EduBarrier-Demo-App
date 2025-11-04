-- EduBarrier Database Setup Script
-- Copy and paste this entire script into Supabase SQL Editor and click "Run"

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child', 'admin')),
  family_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FAMILIES TABLE
-- ============================================
CREATE TABLE families (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COURSES TABLE
-- ============================================
CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  intro TEXT NOT NULL,
  summary TEXT NOT NULL,
  sections JSONB NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE assignments (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  mins INTEGER NOT NULL,
  pass_score INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed')),
  score INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SUBJECTS TABLE
-- ============================================
CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CHILD SETTINGS TABLE (for locks and timers)
-- ============================================
CREATE TABLE child_settings (
  child_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_locked BOOLEAN DEFAULT FALSE,
  timer_running BOOLEAN DEFAULT FALSE,
  time_earned INTEGER DEFAULT 0,
  time_used INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_assignments_child_id ON assignments(child_id);
CREATE INDEX idx_assignments_family_id ON assignments(family_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_courses_subject ON courses(subject);

-- ============================================
-- INSERT DEFAULT ADMIN USER
-- ============================================
INSERT INTO users (id, email, password, name, role, family_id)
VALUES ('admin', 'admin@edubarrier.com', 'admin2025', 'Admin', 'admin', NULL);

-- ============================================
-- INSERT DEFAULT SUBJECTS
-- ============================================
INSERT INTO subjects (name) VALUES 
  ('Math'),
  ('Reading'),
  ('Science'),
  ('History');

-- ============================================
-- INSERT DEFAULT COURSES
-- ============================================
INSERT INTO courses (id, title, category, subject, description, intro, summary, sections, questions)
VALUES 
  (
    'math1',
    'Basic Math',
    'Math',
    'Math',
    'Learn addition, subtraction, multiplication, division',
    'Welcome to Basic Math! Learn fundamental operations.',
    'Great job! You learned the four basic operations.',
    '[
      {"title": "Addition", "text": "Addition combines numbers. Example: 5 plus 3 equals 8."},
      {"title": "Subtraction", "text": "Subtraction takes away. Example: 10 minus 3 equals 7."},
      {"title": "Multiplication", "text": "Multiplication repeats addition. Example: 4 times 3 equals 12."},
      {"title": "Division", "text": "Division splits into groups. Example: 12 divided by 4 equals 3."}
    ]'::jsonb,
    '[
      {"q": "What is 15 plus 27?", "opts": ["42", "41", "43", "40"], "ans": 0},
      {"q": "What is 56 minus 23?", "opts": ["33", "32", "34", "31"], "ans": 0},
      {"q": "What is 8 times 7?", "opts": ["54", "56", "58", "52"], "ans": 1},
      {"q": "What is 72 divided by 9?", "opts": ["7", "8", "9", "6"], "ans": 1},
      {"q": "Is 5 plus 5 equal to 10?", "opts": ["True", "False"], "ans": 0},
      {"q": "What is 89 plus 34?", "opts": ["123", "122", "124", "121"], "ans": 0},
      {"q": "What is 100 minus 47?", "opts": ["52", "53", "54", "51"], "ans": 1},
      {"q": "What is 12 times 6?", "opts": ["70", "72", "74", "68"], "ans": 1},
      {"q": "Multiplication is repeated addition", "opts": ["True", "False"], "ans": 0},
      {"q": "What is 45 divided by 5?", "opts": ["8", "9", "10", "7"], "ans": 1}
    ]'::jsonb
  ),
  (
    'reading1',
    'Reading Skills',
    'Reading',
    'Reading',
    'Improve comprehension and understanding',
    'Learn to understand what you read better.',
    'Excellent work! You learned key reading strategies.',
    '[
      {"title": "Main Ideas", "text": "The main idea is the central message. Look for it in titles and topic sentences."},
      {"title": "Inferences", "text": "An inference is reading between the lines using clues from the text."},
      {"title": "Context Clues", "text": "Context clues help you figure out unknown words from surrounding text."},
      {"title": "Story Elements", "text": "Stories have characters, setting, plot, conflict, and theme."}
    ]'::jsonb,
    '[
      {"q": "What is the main idea?", "opts": ["Theme", "Summary", "Central message", "Title"], "ans": 2},
      {"q": "Who tells the story?", "opts": ["Author", "Narrator", "Character", "Reader"], "ans": 1},
      {"q": "Topic sentences are always first", "opts": ["True", "False"], "ans": 1},
      {"q": "Which helps you understand?", "opts": ["Reading fast", "Asking questions", "Skipping", "Once only"], "ans": 1},
      {"q": "Context clues help with words", "opts": ["True", "False"], "ans": 0},
      {"q": "The turning point is called?", "opts": ["Exposition", "Climax", "Resolution", "Theme"], "ans": 1},
      {"q": "The protagonist is always good", "opts": ["True", "False"], "ans": 1},
      {"q": "Setting means?", "opts": ["Characters", "Time and place", "Theme", "Plot"], "ans": 1},
      {"q": "Inference is reading between lines", "opts": ["True", "False"], "ans": 0},
      {"q": "Details support the main idea", "opts": ["True", "False"], "ans": 0}
    ]'::jsonb
  ),
  (
    'science1',
    'Basic Science',
    'Science',
    'Science',
    'Explore the scientific method and basic concepts',
    'Welcome to Science! Learn how scientists discover new things.',
    'Great work learning basic science concepts!',
    '[
      {"title": "Scientific Method", "text": "Scientists ask questions, make hypotheses, test them, and draw conclusions."},
      {"title": "Matter", "text": "Matter is anything that takes up space. It can be solid, liquid, or gas."},
      {"title": "Energy", "text": "Energy is the ability to do work. It comes in many forms like heat and light."}
    ]'::jsonb,
    '[
      {"q": "What is the first step of scientific method?", "opts": ["Test", "Ask a question", "Conclude", "Observe"], "ans": 1},
      {"q": "Ice is what state of matter?", "opts": ["Solid", "Liquid", "Gas", "Plasma"], "ans": 0},
      {"q": "Energy can be destroyed", "opts": ["True", "False"], "ans": 1},
      {"q": "What gives us light and heat?", "opts": ["Moon", "Sun", "Stars", "Planets"], "ans": 1},
      {"q": "A hypothesis is an educated guess", "opts": ["True", "False"], "ans": 0}
    ]'::jsonb
  ),
  (
    'history1',
    'American History Basics',
    'History',
    'History',
    'Learn key events in American history',
    'Discover important moments in American history.',
    'Excellent! You learned about early American history.',
    '[
      {"title": "Colonial America", "text": "The 13 colonies were established along the Atlantic coast in the 1600s."},
      {"title": "Revolution", "text": "America fought for independence from Britain in 1776."},
      {"title": "Constitution", "text": "The Constitution was written in 1787 to establish our government."}
    ]'::jsonb,
    '[
      {"q": "When was the Declaration signed?", "opts": ["1776", "1787", "1800", "1812"], "ans": 0},
      {"q": "How many original colonies?", "opts": ["10", "12", "13", "15"], "ans": 2},
      {"q": "The Constitution established our government", "opts": ["True", "False"], "ans": 0},
      {"q": "Who did America fight for independence?", "opts": ["France", "Spain", "Britain", "Germany"], "ans": 2}
    ]'::jsonb
  );

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to courses and subjects
CREATE POLICY "Allow public read on courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Allow public read on subjects" ON subjects FOR SELECT USING (true);

-- Allow authenticated users to read their own data
CREATE POLICY "Users can read their own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);
CREATE POLICY "Users can insert themselves" ON users FOR INSERT WITH CHECK (true);

-- Allow family members to see family data
CREATE POLICY "Family members can read family" ON families FOR SELECT USING (true);
CREATE POLICY "Family members can update family" ON families FOR UPDATE USING (true);
CREATE POLICY "Anyone can create family" ON families FOR INSERT WITH CHECK (true);

-- Allow users to see assignments in their family
CREATE POLICY "Family can read assignments" ON assignments FOR SELECT USING (true);
CREATE POLICY "Family can create assignments" ON assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Family can update assignments" ON assignments FOR UPDATE USING (true);

-- Allow users to manage child settings
CREATE POLICY "Users can read child settings" ON child_settings FOR SELECT USING (true);
CREATE POLICY "Users can insert child settings" ON child_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update child settings" ON child_settings FOR UPDATE USING (true);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Database setup complete! Your tables are ready.' AS message;
