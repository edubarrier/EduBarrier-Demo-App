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
  
  async getAllFamilies() {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get all families error:', error);
      return [];
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
  },

  // ========================================
  // BARRIER SYSTEM FUNCTIONS
  // ========================================

  /**
   * Get or create barrier status for a family
   * @param {string} familyId - The family ID
   * @returns {Promise<Object|null>} - Barrier status object
   */
  async getBarrierStatus(familyId) {
    try {
      const { data, error } = await supabase
        .from('barrier_status')
        .select('*')
        .eq('family_id', familyId)
        .limit(1);
      
      if (error) throw error;
      
      // If no status exists, create one
      if (!data || data.length === 0) {
        return await this.createBarrierStatus(familyId);
      }
      
      // Return first record (in case of duplicates)
      return data[0];
    } catch (error) {
      console.error('Get barrier status error:', error);
      return null;
    }
  },

  /**
   * Create barrier status for a family
   * @param {string} familyId - The family ID
   * @returns {Promise<Object|null>} - Created barrier status
   */
  async createBarrierStatus(familyId) {
    try {
      const { data, error } = await supabase
        .from('barrier_status')
        .insert({
          family_id: familyId,
          is_active: false,
          check_interval_seconds: 30
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create barrier status error:', error);
      return null;
    }
  },

  /**
   * Toggle barrier on/off for a family
   * @param {string} familyId - The family ID
   * @param {boolean} isActive - New active state
   * @param {string} userId - User who toggled (optional)
   * @returns {Promise<Object|null>} - Updated barrier status
   */
  async toggleBarrier(familyId, isActive, userId = null) {
    try {
      const updates = {
        family_id: familyId,
        is_active: isActive,
        updated_at: new Date().toISOString(),
        check_interval_seconds: 30
      };
      
      if (isActive) {
        updates.activated_at = new Date().toISOString();
        if (userId) updates.activated_by = userId;
      }
      
      // Use upsert to handle both insert and update
      const { data, error } = await supabase
        .from('barrier_status')
        .upsert(updates, { 
          onConflict: 'family_id',
          ignoreDuplicates: false 
        })
        .select()
        .limit(1);
      
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Toggle barrier error:', error);
      return null;
    }
  },

  /**
   * Send heartbeat from child
   * @param {string} childId - The child's user ID
   * @param {string} familyId - The family ID
   * @returns {Promise<Object|null>} - Created heartbeat record
   */
  async sendHeartbeat(childId, familyId) {
    try {
      const { data, error } = await supabase
        .from('heartbeat_log')
        .insert({
          child_id: childId,
          family_id: familyId,
          heartbeat_at: new Date().toISOString(),
          status: 'alive'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Send heartbeat error:', error);
      return null;
    }
  },

  /**
   * Get all heartbeats for a family (latest per child)
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} - Array of latest heartbeats per child
   */
  async getFamilyHeartbeats(familyId) {
    try {
      // Get all children in the family
      const { data: children, error: childError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('family_id', familyId)
        .eq('role', 'child');
      
      if (childError) throw childError;
      
      if (!children || children.length === 0) {
        return [];
      }
      
      // Get latest heartbeat for each child
      const heartbeats = await Promise.all(
        children.map(async (child) => {
          const { data, error } = await supabase
            .from('heartbeat_log')
            .select('*')
            .eq('child_id', child.id)
            .order('heartbeat_at', { ascending: false })
            .limit(1);
          
          if (error) {
            console.error(`Error getting heartbeat for child ${child.id}:`, error);
            return {
              childId: child.id,
              childName: child.name,
              childEmail: child.email,
              lastHeartbeat: null,
              status: 'unknown'
            };
          }
          
          return {
            childId: child.id,
            childName: child.name,
            childEmail: child.email,
            lastHeartbeat: data && data.length > 0 ? data[0].heartbeat_at : null,
            status: data && data.length > 0 ? data[0].status : 'never'
          };
        })
      );
      
      return heartbeats;
    } catch (error) {
      console.error('Get family heartbeats error:', error);
      return [];
    }
  },

  /**
   * Get heartbeat history for a child
   * @param {string} childId - The child's user ID
   * @param {number} limit - Number of records to return (default: 100)
   * @returns {Promise<Array>} - Array of heartbeat records
   */
  async getChildHeartbeatHistory(childId, limit = 100) {
    try {
      const { data, error } = await supabase
        .from('heartbeat_log')
        .select('*')
        .eq('child_id', childId)
        .order('heartbeat_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get child heartbeat history error:', error);
      return [];
    }
  },

  /**
   * Create a barrier alert
   * @param {string} childId - The child's user ID
   * @param {string} familyId - The family ID
   * @param {string} alertType - Type of alert (default: 'app_closed')
   * @param {string} message - Alert message
   * @returns {Promise<Object|null>} - Created alert
   */
  async createBarrierAlert(childId, familyId, alertType = 'app_closed', message = '') {
    try {
      const { data, error } = await supabase
        .from('barrier_alerts')
        .insert({
          child_id: childId,
          family_id: familyId,
          alert_type: alertType,
          alert_message: message,
          triggered_at: new Date().toISOString(),
          acknowledged: false
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create barrier alert error:', error);
      return null;
    }
  },

  /**
   * Get all alerts for a family
   * @param {string} familyId - The family ID
   * @param {boolean} unacknowledgedOnly - Only get unacknowledged alerts (default: false)
   * @returns {Promise<Array>} - Array of alerts
   */
  async getFamilyAlerts(familyId, unacknowledgedOnly = false) {
    try {
      let query = supabase
        .from('barrier_alerts')
        .select('*')
        .eq('family_id', familyId)
        .order('triggered_at', { ascending: false });
      
      if (unacknowledgedOnly) {
        query = query.eq('acknowledged', false);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get family alerts error:', error);
      return [];
    }
  },

  /**
   * Clean up old heartbeat logs (older than specified days)
   * @param {number} daysToKeep - Number of days to keep (default: 7)
   * @returns {Promise<boolean>} - Success status
   */
  async cleanupOldHeartbeats(daysToKeep = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const { error } = await supabase
        .from('heartbeat_log')
        .delete()
        .lt('created_at', cutoffDate.toISOString());
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Cleanup old heartbeats error:', error);
      return false;
    }
  }
};

// Helper function to generate household code
const generateHouseholdCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Helper function to ensure Supabase Auth user exists in our users table
export const ensureUserInDatabase = async (authUser) => {
  try {
    if (!authUser || !authUser.email) {
      throw new Error('Invalid auth user');
    }
    
    console.log('Checking user in database...', authUser.email);
    
    // Check if user already exists in our users table
    const existingUser = await db.getUser(authUser.email);
    
    if (existingUser) {
      console.log('User already exists in database:', existingUser);
      return existingUser;
    }
    
    console.log('User not found, creating new user with metadata:', authUser.user_metadata);
    
    // Extract metadata from signup
    const metadata = authUser.user_metadata || {};
    const role = metadata.role || 'parent';
    const name = metadata.name || authUser.email.split('@')[0];
    const householdAction = metadata.householdAction; // 'create' or 'join'
    const householdName = metadata.householdName;
    const householdCode = metadata.householdCode;
    
    let familyId = null;
    
    // Handle family creation/joining based on role and action
    if (role === 'parent') {
      if (householdAction === 'create') {
        // Parent creating new household
        console.log('Parent creating new household:', householdName);
        
        const newFamilyId = `family_${authUser.id}_${Date.now()}`;
        const newCode = generateHouseholdCode();
        
        const family = {
          id: newFamilyId,
          name: householdName || `${name}'s Family`,
          code: newCode
        };
        
        const createdFamily = await db.createFamily(family);
        if (createdFamily) {
          familyId = createdFamily.id;
          console.log('Created new family:', familyId, 'with code:', newCode);
        } else {
          throw new Error('Failed to create family');
        }
        
      } else if (householdAction === 'join' && householdCode) {
        // Parent joining existing household
        console.log('Parent joining existing household with code:', householdCode);
        
        const existingFamily = await db.getFamilyByCode(householdCode);
        if (existingFamily) {
          familyId = existingFamily.id;
          console.log('Found existing family:', familyId);
        } else {
          throw new Error('Household code not found');
        }
      }
      
    } else if (role === 'child' && householdCode) {
      // Child joining existing household
      console.log('Child joining existing household with code:', householdCode);
      
      const existingFamily = await db.getFamilyByCode(householdCode);
      if (existingFamily) {
        familyId = existingFamily.id;
        console.log('Found existing family:', familyId);
        
        // Initialize child settings with locked state
        await db.updateChildSettings(authUser.id, {
          is_locked: true,
          timer_running: false,
          time_earned: 0,
          time_used: 0
        });
        console.log('Initialized child settings for:', authUser.id);
        
      } else {
        throw new Error('Household code not found');
      }
    }
    
    // Create new user record
    const newUser = {
      id: authUser.id,
      email: authUser.email,
      name: name,
      role: role,
      password: '', // No password needed for Supabase Auth users
      family_id: familyId
    };
    
    console.log('Creating user in database:', newUser);
    const createdUser = await db.createUser(newUser);
    
    if (!createdUser) {
      throw new Error('Failed to create user in database');
    }
    
    console.log('User created successfully:', createdUser);
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
