import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/api';
import { MessageSquare, Clock } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Activity {
  type: string;
  id: number;
  description: string;
  created_at: string;
  user_name: string;
  target_name?: string;
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      const response = await dashboardService.getActivity();
      setActivities(response.data);
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.length > 0 ? (
        activities.map((activity) => (
          <div key={`${activity.type}-${activity.id}`} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{activity.user_name}</span>
                {' criou feedback: '}
                <span className="font-medium">{activity.description}</span>
                {activity.target_name && (
                  <>
                    {' para '}
                    <span className="font-medium">{activity.target_name}</span>
                  </>
                )}
              </p>
              <div className="flex items-center space-x-1 mt-1">
                <Clock className="h-3 w-3 text-gray-400" />
                <p className="text-xs text-gray-500">
                  {new Date(activity.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="mx-auto h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm">Nenhuma atividade recente</p>
        </div>
      )}
    </div>
  );
}