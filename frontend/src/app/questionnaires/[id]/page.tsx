'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import * as api from '@/lib/api';
import { QuestionnaireWithQuestions, Answer } from '@/types/api';
import { useForm, Controller } from 'react-hook-form';

interface QuestionnaireFormData {
  [key: string]: string | string[];
}

export default function QuestionnairePage({ params }: { params: { id: string } }) {
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();
  const { control, handleSubmit } = useForm<QuestionnaireFormData>();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchQuestionnaire = async () => {
      try {
        const data = await api.getQuestionnaire(parseInt(params.id));
        setQuestionnaire(data);
      } catch (err) {
        setError('Failed to load questionnaire');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionnaire();
  }, [params.id, user, router]);

  const onSubmit = async (data: QuestionnaireFormData) => {
    if (!questionnaire) return;

    setSubmitting(true);
    try {
      const answers: Answer[] = Object.entries(data).map(([questionId, value]) => ({
        question_id: parseInt(questionId),
        value: Array.isArray(value) ? value : [value],
      }));

      await api.submitResponse(questionnaire.id, answers);
      router.push('/questionnaires');
    } catch (err) {
      setError('Failed to submit questionnaire');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !questionnaire) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="error text-xl">{error || 'Questionnaire not found'}</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{questionnaire.name}</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {questionnaire.questions.map((question) => (
            <div key={question.id} className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{question.question}</h3>
              <Controller
                name={question.id.toString()}
                control={control}
                rules={{ required: true }}
                render={({ field, fieldState: { error } }) => (
                  <div className="space-y-2">
                    {question.type === 'mcq' ? (
                      <div className="space-y-3">
                        {question.options.map((option, index) => (
                          <label key={index} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              value={option}
                              onChange={(e) => {
                                const currentValues = Array.isArray(field.value) ? field.value : [];
                                if (e.target.checked) {
                                  field.onChange([...currentValues, option]);
                                } else {
                                  field.onChange(currentValues.filter(v => v !== option));
                                }
                              }}
                              checked={Array.isArray(field.value) && field.value.includes(option)}
                            />
                            <span className="text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        className="input"
                        {...field}
                      />
                    )}
                    {error && (
                      <p className="error">This question is required</p>
                    )}
                  </div>
                )}
              />
            </div>
          ))}
          
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="error">{error}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Submitting...' : 'Submit Questionnaire'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
