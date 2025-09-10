import { supabase } from '../lib/supabase';
import type { User, Department, FeedbackItem } from '../lib/supabase';

// Auth Service
export const authService = {
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  register: async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });

    if (error) throw error;
    return data;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Primeiro verifica se o perfil existe
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    // Se não existe perfil, cria um
    if (!profile) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email!.split('@')[0],
          role: 'user'
        }])
        .select()
        .single();

      if (createError) throw createError;
      
      return {
        id: user.id,
        email: user.email!,
        name: newProfile.full_name,
        role: newProfile.role,
        is_active: newProfile.is_active
      };
    }

    return {
      id: user.id,
      email: user.email,
      name: profile.full_name,
      role: profile.role,
      is_active: profile.is_active,
      department_name: profile.department
    };
  }
};

// User Service
export const userService = {
  getUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        departments(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: data.map(user => ({
        ...user,
        department_name: user.departments?.name
      }))
    };
  },

  getProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        departments(name)
      `)
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return {
      data: {
        ...data,
        email: user.email,
        department_name: data.departments?.name
      }
    };
  },

  getUserStats: async (userId: string) => {
    const [givenResult, receivedResult, ratingResult] = await Promise.all([
      supabase
        .from('feedback')
        .select('id')
        .eq('from_user_id', userId),
      
      supabase
        .from('feedback')
        .select('id')
        .eq('to_user_id', userId),
      
      supabase
        .from('feedback')
        .select('rating')
        .eq('to_user_id', userId)
        .not('rating', 'is', null)
    ]);

    const feedbackGiven = givenResult.data?.length || 0;
    const feedbackReceived = receivedResult.data?.length || 0;
    const ratings = ratingResult.data?.map(f => f.rating) || [];
    const averageRating = ratings.length > 0 
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 0;

    return {
      data: {
        feedbackGiven,
        feedbackReceived,
        averageRating
      }
    };
  },

  updateUserRole: async (userId: string, role: string) => {
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;
    return { data: { message: 'Papel atualizado com sucesso' } };
  }
};

// Department Service
export const departmentService = {
  getDepartments: async () => {
    const { data, error } = await supabase
      .from('departments')
      .select(`
        *,
        users(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get employee count for each department
    const departmentsWithCount = await Promise.all(
      data.map(async (dept) => {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('department_id', dept.id);

        return {
          ...dept,
          employee_count: count || 0
        };
      })
    );

    return { data: departmentsWithCount };
  },

  createDepartment: async (departmentData: { name: string; description?: string }) => {
    const { data, error } = await supabase
      .from('departments')
      .insert([departmentData])
      .select()
      .single();

    if (error) throw error;
    return { data };
  }
};

// Feedback Service
export const feedbackService = {
  getFeedback: async () => {
    const { data, error } = await supabase
      .from('feedback')
      .select(`
        *,
        from_user:users!feedback_from_user_id_fkey(name),
        to_user:users!feedback_to_user_id_fkey(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: data.map(item => ({
        ...item,
        from_user_name: item.from_user?.name || 'Usuário',
        to_user_name: item.to_user?.name || 'Usuário'
      }))
    };
  },

  createFeedback: async (feedbackData: {
    title: string;
    description: string;
    type: string;
    priority: string;
    to_user_id: string;
    rating?: number;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { data, error } = await supabase
      .from('feedback')
      .insert([{
        ...feedbackData,
        from_user_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return { data };
  },

  updateFeedbackStatus: async (feedbackId: string, status: string) => {
    const { data, error } = await supabase
      .from('feedback')
      .update({ status })
      .eq('id', feedbackId)
      .select()
      .single();

    if (error) throw error;
    return { data };
  }
};

// Dashboard Service
export const dashboardService = {
  getStats: async () => {
    const [usersResult, feedbackResult, pendingResult, ratingsResult] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('feedback').select('*', { count: 'exact', head: true }),
      supabase.from('feedback').select('*', { count: 'exact', head: true }).in('status', ['draft', 'submitted']),
      supabase.from('feedback').select('rating').not('rating', 'is', null)
    ]);

    const totalUsers = usersResult.count || 0;
    const totalFeedback = feedbackResult.count || 0;
    const pendingFeedback = pendingResult.count || 0;
    
    const ratings = ratingsResult.data?.map(f => f.rating) || [];
    const averageRating = ratings.length > 0 
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 0;

    const completionRate = totalFeedback > 0 
      ? Math.round(((totalFeedback - pendingFeedback) / totalFeedback) * 100)
      : 0;

    return {
      data: {
        totalUsers,
        totalFeedback,
        pendingFeedback,
        averageRating,
        completionRate
      }
    };
  },

  getActivity: async () => {
    const { data, error } = await supabase
      .from('feedback')
      .select(`
        id,
        title,
        created_at,
        from_user:users!feedback_from_user_id_fkey(name),
        to_user:users!feedback_to_user_id_fkey(name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return {
      data: data.map(item => ({
        type: 'feedback',
        id: item.id,
        description: item.title,
        created_at: item.created_at,
        user_name: item.from_user?.name || 'Usuário',
        target_name: item.to_user?.name || 'Usuário'
      }))
    };
  }
};