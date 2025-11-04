import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// STORAGE ADAPTER (Session only - uses localStorage)
// ============================================
export const storage = {
  async get(key) {
    if (key === 'session') {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
    // All other keys should use database - this is a fallback only
    console.warn(`storage.get('${key}') called - should use database instead`);
    return null;
  },
  
  async set(key, value) {
    if (key === 'session') {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
      return;
    }
    // All other keys should use database
    console.warn(`storage.set('${key}') called - should use database instead`);
  },
  
  async remove(key) {
    localStorage.removeItem(key);
  }
};

// ============================================
// USER FUNCTIONS
// ============================================
export const db = {
  // Get all users
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error getting all users:', err);
      return [];
    }
  },

  // Get user by email
  async getUser(email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Error getting user:', err);
      return null;
    }
  },

  // Get user by ID
  async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Error getting user by ID:', err);
      return null;
    }
  },

  // Create user
  async createUser(user) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: user.id,
          email: user.email,
          password: user.password,
          name: user.name,
          role: user.role,
          family_id: user.familyId || null
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  },

  // Update user
  async updateUser(user) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          email: user.email,
          password: user.password,
          name: user.name,
          role: user.role,
          family_id: user.familyId || null
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  },

  // Delete user
  async deleteUser(userId) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  },

  // ============================================
  // FAMILY FUNCTIONS
  // ============================================

  // Get family by ID
  async getFamily(familyId) {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      
      // Parse JSON fields if they're stored as strings
      if (data) {
        if (typeof data.parents === 'string') data.parents = JSON.parse(data.parents);
        if (typeof data.children === 'string') data.children = JSON.parse(data.children);
      }
      
      return data;
    } catch (err) {
      console.error('Error getting family:', err);
      return null;
    }
  },

  // Get family by code
  async getFamilyByCode(code) {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('code', code)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      
      if (data) {
        if (typeof data.parents === 'string') data.parents = JSON.parse(data.parents);
        if (typeof data.children === 'string') data.children = JSON.parse(data.children);
      }
      
      return data;
    } catch (err) {
      console.error('Error getting family by code:', err);
      return null;
    }
  },

  // Create family
  async createFamily(family) {
    try {
      const { data, error } = await supabase
        .from('families')
        .insert([{
          id: family.id,
          name: family.name,
          code: family.code,
          parents: JSON.stringify(family.parents || []),
          children: JSON.stringify(family.children || [])
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        data.parents = JSON.parse(data.parents);
        data.children = JSON.parse(data.children);
      }
      
      return data;
    } catch (err) {
      console.error('Error creating family:', err);
      throw err;
    }
  },

  // Update family
  async updateFamily(family) {
    try {
      const { data, error } = await supabase
        .from('families')
        .update({
          name: family.name,
          code: family.code,
          parents: JSON.stringify(family.parents || []),
          children: JSON.stringify(family.children || [])
        })
        .eq('id', family.id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        data.parents = JSON.parse(data.parents);
        data.children = JSON.parse(data.children);
      }
      
      return data;
    } catch (err) {
      console.error('Error updating family:', err);
      throw err;
    }
  },

  // Delete family
  async deleteFamily(familyId) {
    try {
      const { error } = await supabase
        .from('families')
        .delete()
        .eq('id', familyId);
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting family:', err);
      throw err;
    }
  },

  // ============================================
  // COURSE FUNCTIONS
  // ============================================

  // Get all courses
  async getAllCourses() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Parse JSON fields
      if (data) {
        data.forEach(course => {
          if (typeof course.sections === 'string') course.sections = JSON.parse(course.sections);
          if (typeof course.questions === 'string') course.questions = JSON.parse(course.questions);
        });
      }
      
      return data || [];
    } catch (err) {
      console.error('Error getting all courses:', err);
      return [];
    }
  },

  // Get course by ID
  async getCourse(courseId) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      
      if (data) {
        if (typeof data.sections === 'string') data.sections = JSON.parse(data.sections);
        if (typeof data.questions === 'string') data.questions = JSON.parse(data.questions);
      }
      
      return data;
    } catch (err) {
      console.error('Error getting course:', err);
      return null;
    }
  },

  // Create course
  async createCourse(course) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert([{
          id: course.id,
          title: course.title,
          category: course.category,
          subject: course.subject,
          description: course.desc || course.description,
          intro: course.intro,
          summary: course.summary,
          sections: JSON.stringify(course.sections),
          questions: JSON.stringify(course.questions)
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        data.sections = JSON.parse(data.sections);
        data.questions = JSON.parse(data.questions);
        data.desc = data.description;
      }
      
      return data;
    } catch (err) {
      console.error('Error creating course:', err);
      throw err;
    }
  },

  // Update course
  async updateCourse(course) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .update({
          title: course.title,
          category: course.category,
          subject: course.subject,
          description: course.desc || course.description,
          intro: course.intro,
          summary: course.summary,
          sections: JSON.stringify(course.sections),
          questions: JSON.stringify(course.questions)
        })
        .eq('id', course.id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        data.sections = JSON.parse(data.sections);
        data.questions = JSON.parse(data.questions);
        data.desc = data.description;
      }
      
      return data;
    } catch (err) {
      console.error('Error updating course:', err);
      throw err;
    }
  },

  // Delete course
  async deleteCourse(courseId) {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting course:', err);
      throw err;
    }
  },

  // ============================================
  // SUBJECT FUNCTIONS
  // ============================================

  // Get all subjects
  async getAllSubjects() {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('name')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data ? data.map(s => s.name) : [];
    } catch (err) {
      console.error('Error getting subjects:', err);
      return [];
    }
  },

  // Create subject
  async createSubject(subjectName) {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert([{ name: subjectName }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error creating subject:', err);
      throw err;
    }
  },

  // Delete subject
  async deleteSubject(subjectName) {
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('name', subjectName);
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting subject:', err);
      throw err;
    }
  },

  // ============================================
  // ASSIGNMENT FUNCTIONS
  // ============================================

  // Get assignments by family
  async getAssignmentsByFamily(familyId) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map database fields to app fields
      return (data || []).map(a => ({
        id: a.id,
        childId: a.child_id,
        familyId: a.family_id,
        courseId: a.course_id,
        mins: a.mins,
        pass: a.pass_score,
        passScore: a.pass_score,
        status: a.status,
        score: a.score,
        completedAt: a.completed_at
      }));
    } catch (err) {
      console.error('Error getting assignments by family:', err);
      return [];
    }
  },

  // Get assignments by child
  async getAssignmentsByChild(childId) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(a => ({
        id: a.id,
        childId: a.child_id,
        familyId: a.family_id,
        courseId: a.course_id,
        mins: a.mins,
        pass: a.pass_score,
        passScore: a.pass_score,
        status: a.status,
        score: a.score,
        completedAt: a.completed_at
      }));
    } catch (err) {
      console.error('Error getting assignments by child:', err);
      return [];
    }
  },

  // Create assignment
  async createAssignment(assignment) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert([{
          id: assignment.id,
          child_id: assignment.childId,
          family_id: assignment.familyId,
          course_id: assignment.courseId,
          mins: assignment.mins,
          pass_score: assignment.passScore || assignment.pass,
          status: assignment.status || 'pending',
          score: assignment.score || null
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        childId: data.child_id,
        familyId: data.family_id,
        courseId: data.course_id,
        mins: data.mins,
        pass: data.pass_score,
        passScore: data.pass_score,
        status: data.status,
        score: data.score
      };
    } catch (err) {
      console.error('Error creating assignment:', err);
      throw err;
    }
  },

  // Update assignment
  async updateAssignment(assignment) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update({
          status: assignment.status,
          score: assignment.score,
          completed_at: assignment.status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', assignment.id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        childId: data.child_id,
        familyId: data.family_id,
        courseId: data.course_id,
        mins: data.mins,
        pass: data.pass_score,
        passScore: data.pass_score,
        status: data.status,
        score: data.score
      };
    } catch (err) {
      console.error('Error updating assignment:', err);
      throw err;
    }
  },

  // Delete assignment
  async deleteAssignment(assignmentId) {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting assignment:', err);
      throw err;
    }
  },

  // ============================================
  // CHILD SETTINGS FUNCTIONS
  // ============================================

  // Get child settings
  async getChildSettings(childId) {
    try {
      const { data, error } = await supabase
        .from('child_settings')
        .select('*')
        .eq('child_id', childId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      
      return {
        childId: data.child_id,
        isLocked: data.is_locked,
        timerRunning: data.timer_running,
        timeEarned: data.time_earned,
        timeUsed: data.time_used
      };
    } catch (err) {
      console.error('Error getting child settings:', err);
      return null;
    }
  },

  // Update child settings (upsert)
  async updateChildSettings(settings) {
    try {
      const { data, error } = await supabase
        .from('child_settings')
        .upsert({
          child_id: settings.childId,
          is_locked: settings.isLocked,
          timer_running: settings.timerRunning,
          time_earned: settings.timeEarned,
          time_used: settings.timeUsed,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'child_id'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        childId: data.child_id,
        isLocked: data.is_locked,
        timerRunning: data.timer_running,
        timeEarned: data.time_earned,
        timeUsed: data.time_used
      };
    } catch (err) {
      console.error('Error updating child settings:', err);
      throw err;
    }
  },

  // Delete child settings
  async deleteChildSettings(childId) {
    try {
      const { error } = await supabase
        .from('child_settings')
        .delete()
        .eq('child_id', childId);
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting child settings:', err);
      throw err;
    }
  }
};

// ============================================
// ENSURE USER IN DATABASE (for Supabase Auth)
// ============================================
export async function ensureUserInDatabase(authUser) {
  try {
    // Check if user exists
    let dbUser = await db.getUser(authUser.email);
    
    if (!dbUser) {
      // Create user in database from auth metadata
      const userData = authUser.user_metadata || {};
      const newUser = {
        id: authUser.id,
        email: authUser.email,
        password: '', // No password for OAuth users
        name: userData.name || authUser.email.split('@')[0],
        role: userData.role || 'parent',
        familyId: userData.familyId || null
      };
      
      dbUser = await db.createUser(newUser);
      
      // If parent creating new household
      if (userData.householdAction === 'create' && userData.householdName) {
        const familyId = 'f' + Date.now();
        const family = {
          id: familyId,
          name: userData.householdName,
          code: generateHouseholdCode(),
          parents: [dbUser.id],
          children: []
        };
        
        await db.createFamily(family);
        
        // Update user with family ID
        dbUser.familyId = familyId;
        await db.updateUser(dbUser);
      }
      // If joining existing household
      else if (userData.householdCode) {
        const family = await db.getFamilyByCode(userData.householdCode);
        if (family) {
          dbUser.familyId = family.id;
          await db.updateUser(dbUser);
          
          // Add to family
          if (userData.role === 'parent') {
            if (!family.parents.includes(dbUser.id)) {
              family.parents.push(dbUser.id);
            }
          } else {
            if (!family.children.includes(dbUser.id)) {
              family.children.push(dbUser.id);
            }
          }
          await db.updateFamily(family);
          
          // Initialize child settings if child
          if (userData.role === 'child') {
            await db.updateChildSettings({
              childId: dbUser.id,
              isLocked: false,
              timerRunning: false,
              timeEarned: 0,
              timeUsed: 0
            });
          }
        }
      }
    }
    
    return dbUser;
  } catch (err) {
    console.error('Error ensuring user in database:', err);
    throw err;
  }
}

// Helper function
function generateHouseholdCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
