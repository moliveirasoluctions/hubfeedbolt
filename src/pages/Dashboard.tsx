import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/api';
import { 
  Users, 
  MessageSquare, 
  Clock, 
  Star,
  TrendingUp,
  Activity
} from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatCard from '../components/dashboard/StatCard';
import RecentActivity from '../components/dashboard/RecentActivity';

interface DashboardStats {
  totalUsers: number;
  totalFeedback: number;
  pendingFeedback: number;
  averageRating: number;
  completionRate: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await dashboardService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: 'Administrador',
      manager: 'Gestor',
      user: 'Usuário'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Bem-vindo, {user?.name} • {getRoleDisplayName(user?.role || 'user')}
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Usuários"
            value={stats.totalUsers}
            icon={Users}
            color="blue"
            trend="+12% este mês"
          />
          <StatCard
            title="Feedbacks Criados"
            value={stats.totalFeedback}
            icon={MessageSquare}
            color="green"
            trend="+8% este mês"
          />
          <StatCard
            title="Pendentes"
            value={stats.pendingFeedback}
            icon={Clock}
            color="orange"
            trend="Requer atenção"
          />
          <StatCard
            title="Avaliação Média"
            value={`${stats.averageRating}/5`}
            icon={Star}
            color="purple"
            trend={`${stats.completionRate}% concluídos`}
          />
        </div>
      )}

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Overview */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Visão Geral de Performance</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Taxa de Conclusão</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.completionRate || 0}%</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Feedbacks Positivos</p>
                <p className="text-xl font-bold text-green-600">85%</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Tempo Médio</p>
                <p className="text-xl font-bold text-purple-600">2.3 dias</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Atividade Recente</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <RecentActivity />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group">
            <MessageSquare className="h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-gray-900">Novo Feedback</p>
            <p className="text-sm text-gray-500">Criar avaliação</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group">
            <Users className="h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-gray-900">Gerenciar Equipe</p>
            <p className="text-sm text-gray-500">Ver usuários</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group">
            <Star className="h-8 w-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-gray-900">Relatórios</p>
            <p className="text-sm text-gray-500">Ver métricas</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors group">
            <Clock className="h-8 w-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-gray-900">Pendências</p>
            <p className="text-sm text-gray-500">Revisar feedback</p>
          </button>
        </div>
      </div>
    </div>
  );
}