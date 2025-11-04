import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to ensure user exists in database after auth
export const ensureUserInDatabase = async (authUser) => {
  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (!existingUser) {
      // Create new user record
      const name = authUser.user_metadata?.name || authUser.email.split('@')[0];
      const role = authUser.user_metadata?.role || 'parent';
      
      const { error } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          name,
          role,
          password: '' // Empty for Supabase Auth users
        });

      if (error) throw error;
      
      return { id: authUser.id, email: authUser.email, name, role, password: '' };
    }
    
    return existingUser;
  } catch (error) {
    console.error('Error ensuring user in database:', error);
    throw error;
  }
};

// Storage adapter for localStorage
export const storage = {
  async get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  
  async set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }
};

// Database helper functions
export const db = {
  // User functions
  async createUser(userData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async getUser(email, password = null) {
    try {
      let query = supabase
        .from('users')
        .select('*')
        .eq('email', email);
      
      if (password !== null) {
        query = query.eq('password', password);
      }
      
      const { data, error } = await query.single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  async updateUser(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async deleteUser(userId) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  },

  // Family functions
  async createFamily(familyData) {
    try {
      const { data, error } = await supabase
        .from('families')
        .insert([familyData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating family:', error);
      throw error;
    }
  },

  async getFamily(familyId) {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting family:', error);
      return null;
    }
  },

  async getFamilyByCode(code) {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('code', code)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting family by code:', error);
      return null;
    }
  },

  async updateFamily(familyId, updates) {
    try {
      const { data, error } = await supabase
        .from('families')
        .update(updates)
        .eq('id', familyId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating family:', error);
      throw error;
    }
  },

  // Course functions
  async createCourse(courseData) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert([courseData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  },

  async getAllCourses() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('title');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting courses:', error);
      return [];
    }
  },

  async updateCourse(courseId, updates) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  },

  async deleteCourse(courseId) {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  },

  // Assignment functions
  async createAssignment(assignmentData) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert([assignmentData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  },

  async getAssignmentsByFamily(familyId) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting assignments:', error);
      return [];
    }
  },

  async getAssignmentsByChild(childId) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting child assignments:', error);
      return [];
    }
  },

  async updateAssignment(assignmentId, updates) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', assignmentId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  },

  async deleteAssignment(assignmentId) {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting assignment:', error);
      throw error;
    }
  },

  // Subject functions
  async getAllSubjects() {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting subjects:', error);
      return [];
    }
  },

  async createSubject(name) {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert([{ name }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating subject:', error);
      throw error;
    }
  },

  async deleteSubject(subjectId) {
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting subject:', error);
      throw error;
    }
  },

  // Child settings functions
  async getChildSettings(childId) {
    try {
      const { data, error } = await supabase
        .from('child_settings')
        .select('*')
        .eq('child_id', childId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default
          return await this.createChildSettings(childId);
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting child settings:', error);
      return null;
    }
  },

  async createChildSettings(childId) {
    try {
      const { data, error } = await supabase
        .from('child_settings')
        .insert([{
          child_id: childId,
          is_locked: false,
          timer_running: false,
          time_earned: 0,
          time_used: 0
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating child settings:', error);
      throw error;
    }
  },

  async updateChildSettings(childId, updates) {
    try {
      const { data, error } = await supabase
        .from('child_settings')
        .update(updates)
        .eq('child_id', childId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating child settings:', error);
      throw error;
    }
  }
};
