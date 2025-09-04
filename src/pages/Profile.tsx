import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/api';
import { User, Mail, Shield, Calendar, BarChart3, Star } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { toast } from '../components/ui/Toast';

interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  department_name?: string;
}

interface UserStats {
  feedbackGiven: number;
  feedbackReceived: number;
  averageRating: number;
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const [profileResponse, statsResponse] = await Promise.all([
        userService.getProfile(),
        userService.getUserStats(user?.id || '')
      ]);
      setProfile(profileResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: 'Administrador',
      manager: 'Gestor',
      user: 'Usuário'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Erro ao carregar perfil</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <User className="h-7 w-7 text-blue-600" />
          <span>Meu Perfil</span>
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Visualize e gerencie suas informações pessoais
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start space-x-6">
            <div className="h-24 w-24 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(profile.role)}`}>
                  <Shield className="h-4 w-4 mr-1" />
                  {getRoleDisplayName(profile.role)}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>{profile.email}</span>
                </div>
                
                {profile.department_name && (
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>{profile.department_name}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Estatísticas</h3>
          </div>
          
          {stats && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Feedbacks Dados</p>
                <p className="text-2xl font-bold text-blue-600">{stats.feedbackGiven}</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Feedbacks Recebidos</p>
                <p className="text-2xl font-bold text-green-600">{stats.feedbackReceived}</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Avaliação Média</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-purple-600">{stats.averageRating}</p>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= stats.averageRating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
        <div className="text-center py-8 text-gray-500">
          <p>Nenhuma atividade recente para exibir</p>
        </div>
      </div>
    </div>
  );
}