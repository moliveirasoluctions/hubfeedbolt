import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
  department_id?: string;
  is_active: boolean;
  created_at: string;
  department_name?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  employee_count?: number;
  manager_name?: string;
}

export interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  type: 'performance' | '360' | 'development' | 'recognition';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'submitted' | 'in_review' | 'completed' | 'archived';
  rating?: number;
  from_user_id: string;
  to_user_id: string;
  from_user_name?: string;
  to_user_name?: string;
  created_at: string;
  updated_at: string;
}