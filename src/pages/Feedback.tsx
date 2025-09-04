import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { feedbackService, userService } from '../services/api';
import { 
  MessageSquare, 
  Plus, 
  Filter, 
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  User
} from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { toast } from '../components/ui/Toast';

interface FeedbackItem {
  id: number;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  rating?: number;
  from_user_name: string;
  to_user_name: string;
  created_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

export default function Feedback() {
  const { user: currentUser } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'performance',
    priority: 'medium',
    to_user_id: '',
    rating: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [feedbackResponse, usersResponse] = await Promise.all([
        feedbackService.getFeedback(),
        userService.getUsers()
      ]);
      setFeedback(feedbackResponse.data);
      setUsers(usersResponse.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await feedbackService.createFeedback({
        ...formData,
        to_user_id: formData.to_user_id,
        rating: formData.rating ? parseInt(formData.rating) : undefined
      });
      toast.success('Feedback criado com sucesso');
      setFormData({
        title: '',
        description: '',
        type: 'performance',
        priority: 'medium',
        to_user_id: '',
        rating: ''
      });
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      toast.error('Erro ao criar feedback');
    }
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      draft: Clock,
      submitted: AlertCircle,
      in_review: Clock,
      completed: CheckCircle,
      archived: CheckCircle
    };
    return icons[status as keyof typeof icons] || Clock;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'text-gray-500 bg-gray-100',
      submitted: 'text-blue-500 bg-blue-100',
      in_review: 'text-orange-500 bg-orange-100',
      completed: 'text-green-500 bg-green-100',
      archived: 'text-gray-500 bg-gray-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-500 bg-gray-100';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-orange-600 bg-orange-100',
      urgent: 'text-red-600 bg-red-100'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const filteredFeedback = feedback.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <MessageSquare className="h-7 w-7 text-blue-600" />
            <span>Feedback</span>
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Gerencie feedbacks e avaliações da equipe
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Feedback
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'draft', label: 'Rascunho' },
              { key: 'submitted', label: 'Enviado' },
              { key: 'in_review', label: 'Em Revisão' },
              { key: 'completed', label: 'Concluído' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Criar Novo Feedback</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Avaliação de Performance Q1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Para (Usuário)
                  </label>
                  <select
                    required
                    value={formData.to_user_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, to_user_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione um usuário</option>
                    {users.filter(u => u.id !== currentUser?.id).map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="performance">Performance</option>
                      <option value="360">360°</option>
                      <option value="development">Desenvolvimento</option>
                      <option value="recognition">Reconhecimento</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridade
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avaliação (1-5)
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sem avaliação</option>
                    <option value="1">1 - Insatisfatório</option>
                    <option value="2">2 - Abaixo do esperado</option>
                    <option value="3">3 - Atende expectativas</option>
                    <option value="4">4 - Supera expectativas</option>
                    <option value="5">5 - Excepcional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Descreva o feedback detalhadamente..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Criar Feedback
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedback.map((item) => {
          const StatusIcon = getStatusIcon(item.status);
          return (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{item.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>De: {item.from_user_name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>Para: {item.to_user_name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {item.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{item.rating}/5</span>
                    </div>
                  )}
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {item.status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
                  {item.type.toUpperCase()}
                </span>
                
                <div className="flex space-x-2">
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    Ver Detalhes
                  </button>
                  {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                    <button className="text-sm text-gray-600 hover:text-gray-800 font-medium">
                      Editar Status
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFeedback.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum feedback encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'Comece criando um novo feedback para sua equipe.'
              : 'Nenhum feedback encontrado com este filtro.'
            }
          </p>
        </div>
      )}
    </div>
  );
}