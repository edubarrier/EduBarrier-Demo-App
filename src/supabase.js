import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const ensureUserInDatabase = async (authUser) => {
  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (!existingUser) {
      const name = authUser.user_metadata?.name || authUser.email.split('@')[0];
      const role = authUser.user_metadata?.role || 'parent';
      
      const { error } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          name,
          role,
          password: ''
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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Storage adapter for Supabase
export const storage = {
  async get(key) {
    try {
      // Handle different key types
      if (key === 'session') {
        // Session is stored in localStorage for quick access
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : null
      }
      
      if (key === 'users') {
        const { data, error } = await supabase.from('users').select('*')
        if (error) throw error
        return data || []
      }
      
      if (key === 'courses') {
        const { data, error } = await supabase.from('courses').select('*')
        if (error) throw error
        return data || []
      }
      
      if (key === 'subjects') {
        const { data, error } = await supabase.from('subjects').select('name')
        if (error) throw error
        return data.map(s => s.name) || []
      }
      
      if (key.startsWith('fam-')) {
        const familyId = key.replace('fam-', '')
        const { data, error } = await supabase
          .from('families')
          .select('*')
          .eq('id', familyId)
          .single()
        if (error && error.code !== 'PGRST116') throw error
        return data || null
      }
      
      if (key.startsWith('assigns-')) {
        const familyId = key.replace('assigns-', '')
        const { data, error } = await supabase
          .from('assignments')
          .select('*')
          .eq('family_id', familyId)
        if (error) throw error
        return data || []
      }
      
      if (key.startsWith('child-locked-')) {
        const childId = key.replace('child-locked-', '')
        const { data, error } = await supabase
          .from('child_settings')
          .select('is_locked')
          .eq('child_id', childId)
          .single()
        if (error && error.code !== 'PGRST116') return false
        return data?.is_locked || false
      }
      
      if (key.startsWith('timer-running-')) {
        const childId = key.replace('timer-running-', '')
        const { data, error } = await supabase
          .from('child_settings')
          .select('timer_running')
          .eq('child_id', childId)
          .single()
        if (error && error.code !== 'PGRST116') return false
        return data?.timer_running || false
      }
      
      // Fallback to localStorage for other keys
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Storage get error:', error)
      return null
    }
  },
  
  async set(key, value) {
    try {
      // Handle different key types
      if (key === 'session') {
        localStorage.setItem(key, JSON.stringify(value))
        return true
      }
      
      if (key === 'users') {
        // This is handled by individual user operations
        return true
      }
      
      if (key === 'courses') {
        // Courses are managed through admin panel
        return true
      }
      
      if (key === 'subjects') {
        // Subjects are managed through admin panel
        return true
      }
      
      if (key.startsWith('fam-')) {
        const family = value
        const { error } = await supabase
          .from('families')
          .upsert(family, { onConflict: 'id' })
        if (error) throw error
        return true
      }
      
      if (key.startsWith('assigns-')) {
        const familyId = key.replace('assigns-', '')
        // Delete existing assignments for this family
        await supabase.from('assignments').delete().eq('family_id', familyId)
        // Insert new assignments
        if (value && value.length > 0) {
          const assignments = value.map(a => ({
            ...a,
            family_id: familyId
          }))
          const { error } = await supabase.from('assignments').insert(assignments)
          if (error) throw error
        }
        return true
      }
      
      if (key.startsWith('child-locked-')) {
        const childId = key.replace('child-locked-', '')
        const { error } = await supabase
          .from('child_settings')
          .upsert({ 
            child_id: childId, 
            is_locked: value,
            last_updated: new Date().toISOString()
          }, { onConflict: 'child_id' })
        if (error) throw error
        return true
      }
      
      if (key.startsWith('timer-running-')) {
        const childId = key.replace('timer-running-', '')
        const { error } = await supabase
          .from('child_settings')
          .upsert({ 
            child_id: childId, 
            timer_running: value,
            last_updated: new Date().toISOString()
          }, { onConflict: 'child_id' })
        if (error) throw error
        return true
      }
      
      // Fallback to localStorage
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Storage set error:', error)
      return false
    }
  }
}

// Helper functions for common operations
export const db = {
  async createUser(user) {
    const { data, error } = await supabase.from('users').insert(user).select().single()
    if (error) throw error
    return data
  },
  
  async getUser(email, password) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },
  
  async updateUser(id, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
  
  async deleteUser(id) {
    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) throw error
  },
  
  async createFamily(family) {
    const { data, error } = await supabase.from('families').insert(family).select().single()
    if (error) throw error
    return data
  },
  
  async getFamily(id) {
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('id', id)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },
  
  async getFamilyByCode(code) {
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('code', code)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },
  
  async createCourse(course) {
    const { data, error } = await supabase.from('courses').insert(course).select().single()
    if (error) throw error
    return data
  },
  
  async updateCourse(id, updates) {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
  
  async deleteCourse(id) {
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) throw error
  },
  
  async createSubject(name) {
    const { data, error } = await supabase.from('subjects').insert({ name }).select().single()
    if (error) throw error
    return data
  },
  
  async deleteSubject(name) {
    const { error } = await supabase.from('subjects').delete().eq('name', name)
    if (error) throw error
  }
}
