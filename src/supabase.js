import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage adapter - handles session persistence and data
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
  },
  
  async remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }
};

// Database helper functions for Supabase
export const db = {
  // User operations
  async getUser(email, password = null) {
    try {
      let query = supabase.from('users').select('*').eq('email', email);
      
      if (password) {
        query = query.eq('password', password);
      }
      
      const { data, error } = await query.single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  },
  
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('email');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  },
  
  async createUser(user) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(user)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create user error:', error);
      return null;
    }
  },
  
  async updateUser(user) {
    try {
      // Extract id and prepare updates
      const { id, ...updates } = user;
      
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update user error:', error);
      return null;
    }
  },
  
  async deleteUser(id) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete user error:', error);
      return false;
    }
  },
  
  // Family operations
  async getFamily(id) {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get family error:', error);
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
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get family by code error:', error);
      return null;
    }
  },
  
  async createFamily(family) {
    try {
      const { data, error } = await supabase
        .from('families')
        .insert(family)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create family error:', error);
      return null;
    }
  },
  
  async updateFamily(family) {
    try {
      // Extract id and prepare updates
      const { id, ...updates } = family;
      
      const { data, error } = await supabase
        .from('families')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update family error:', error);
      return null;
    }
  },
  
  // Course operations
  async getCourses() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('title');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get courses error:', error);
      return [];
    }
  },
  
  async getAllCourses() {
    return this.getCourses();
  },
  
  async getCourse(id) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get course error:', error);
      return null;
    }
  },
  
  async createCourse(course) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert(course)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create course error:', error);
      return null;
    }
  },
  
  async updateCourse(course) {
    try {
      // Extract id and prepare updates
      const { id, ...updates } = course;
      
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update course error:', error);
      return null;
    }
  },
  
  async deleteCourse(id) {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete course error:', error);
      return false;
    }
  },
  
  // Assignment operations
  async getAssignments(familyId) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('family_id', familyId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get assignments error:', error);
      return [];
    }
  },
  
  async getAssignmentsByFamily(familyId) {
    return this.getAssignments(familyId);
  },
  
  async createAssignment(assignment) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert(assignment)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create assignment error:', error);
      return null;
    }
  },
  
  async updateAssignment(assignment) {
    try {
      // Extract id and prepare updates
      const { id, ...updates } = assignment;
      
      const { data, error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update assignment error:', error);
      return null;
    }
  },
  
  async deleteAssignment(id) {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete assignment error:', error);
      return false;
    }
  },
  
  // Subject operations
  async getSubjects() {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data ? data.map(s => s.name) : [];
    } catch (error) {
      console.error('Get subjects error:', error);
      return [];
    }
  },
  
  async getAllSubjects() {
    return this.getSubjects();
  },
  
  async createSubject(name) {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert({ name })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create subject error:', error);
      return null;
    }
  },
  
  async deleteSubject(name) {
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('name', name);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete subject error:', error);
      return false;
    }
  },
  
  // Child settings operations
  async getChildSettings(childId) {
    try {
      const { data, error } = await supabase
        .from('child_settings')
        .select('*')
        .eq('child_id', childId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
      return data || {
        child_id: childId,
        is_locked: true,
        timer_running: false,
        time_earned: 0,
        time_used: 0
      };
    } catch (error) {
      console.error('Get child settings error:', error);
      return {
        child_id: childId,
        is_locked: true,
        timer_running: false,
        time_earned: 0,
        time_used: 0
      };
    }
  },
  
  async updateChildSettings(childId, settings) {
    try {
      const { data, error } = await supabase
        .from('child_settings')
        .upsert({ child_id: childId, ...settings })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update child settings error:', error);
      return null;
    }
  },
  
  async deleteChildSettings(childId) {
    try {
      const { error } = await supabase
        .from('child_settings')
        .delete()
        .eq('child_id', childId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete child settings error:', error);
      return false;
    }
  },
  
  // Get users by family
  async getUsersByFamily(familyId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('family_id', familyId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get users by family error:', error);
      return [];
    }
  }
};

// Helper function to ensure Supabase Auth user exists in our users table
export const ensureUserInDatabase = async (authUser) => {
  try {
    if (!authUser || !authUser.email) {
      throw new Error('Invalid auth user');
    }
    
    // Check if user already exists in our users table
    const existingUser = await db.getUser(authUser.email);
    
    if (existingUser) {
      return existingUser;
    }
    
    // Create new user record
    const newUser = {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email.split('@')[0],
      role: 'parent', // Default role for new signups
      password: '', // No password needed for Supabase Auth users
      family_id: null
    };
    
    const createdUser = await db.createUser(newUser);
    return createdUser;
  } catch (error) {
    console.error('Error ensuring user in database:', error);
    throw error;
  }
};

// ============================================
// FILE UPLOAD FUNCTIONS FOR SUPABASE STORAGE
// ============================================

export const fileUpload = {
  /**
   * Upload an image to Supabase Storage
   * @param {File} file - The image file to upload
   * @param {string} folder - Optional folder path (e.g., 'course-images')
   * @returns {Promise<{url: string, path: string}>} - Public URL and storage path
   */
  async uploadImage(file, folder = 'course-images') {
    try {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 5MB.');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('edubarrier-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('edubarrier-media')
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  },

  /**
   * Upload a video to Supabase Storage
   * @param {File} file - The video file to upload
   * @param {string} folder - Optional folder path (e.g., 'course-videos')
   * @returns {Promise<{url: string, path: string}>} - Public URL and storage path
   */
  async uploadVideo(file, folder = 'course-videos') {
    try {
      // Validate file type
      const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload MP4, WebM, OGG, or MOV video.');
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB in bytes
      if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 100MB.');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('edubarrier-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('edubarrier-media')
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Video upload error:', error);
      throw error;
    }
  },

  /**
   * Delete a file from Supabase Storage
   * @param {string} filePath - The path to the file in storage
   * @returns {Promise<boolean>} - Success status
   */
  async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from('edubarrier-media')
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('File delete error:', error);
      return false;
    }
  },

  /**
   * Get file size in human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted size (e.g., "2.5 MB")
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
};
