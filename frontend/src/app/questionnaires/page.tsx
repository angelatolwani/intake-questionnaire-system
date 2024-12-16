'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import * as api from '@/lib/api';
import { Questionnaire } from '@/types/api';

export default function QuestionnairesPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchQuestionnaires = async () => {
      try {
        const data = await api.getQuestionnaires();
        setQuestionnaires(data);
      } catch (err) {
        setError('Failed to load questionnaires');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionnaires();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="error text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Available Questionnaires</h1>
        
        {questionnaires.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">No questionnaires available at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {questionnaires.map((questionnaire) => (
              <div
                key={questionnaire.id}
                className="card hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => router.push(`/questionnaires/${questionnaire.id}`)}
              >
                <h3 className="text-lg font-medium text-gray-900 mb-2">{questionnaire.name}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Click to start this questionnaire
                </p>
                <div className="mt-4 flex justify-end">
                  <span className="btn btn-secondary">
                    Start Questionnaire →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
