'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import * as api from '@/lib/api';
import { QuestionnaireWithQuestions, Answer } from '@/types/api';
import { useForm, Controller } from 'react-hook-form';
import {
  Container,
  Typography,
  FormControl,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Button,
  CircularProgress,
  Alert,
  Box,
  FormHelperText,
  FormGroup,
  TextField,
  Stack,
  Paper,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutButton from '@/components/LogoutButton';

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
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        sx={{ background: '#fafafa' }}
      >
        <CircularProgress sx={{ color: '#2c3e50' }} />
      </Box>
    );
  }

  if (error || !questionnaire) {
    return (
      <Container maxWidth="md" sx={{ py: 4, background: '#fafafa', minHeight: '100vh' }}>
        <Alert severity="error" 
          sx={{ 
            backgroundColor: 'transparent',
            color: '#e74c3c',
            '& .MuiAlert-icon': { color: '#e74c3c' }
          }}
        >
          {error || 'Questionnaire not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ background: '#fafafa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Stack spacing={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/questionnaires')}
              sx={{
                color: '#2c3e50',
                '&:hover': { backgroundColor: 'rgba(44, 62, 80, 0.04)' },
              }}
            >
              Back
            </Button>
            <LogoutButton />
          </Box>

          <Typography 
            variant="h2" 
            component="h1" 
            sx={{ 
              fontWeight: 300,
              color: '#2c3e50',
              fontSize: { xs: '2rem', md: '3rem' },
              letterSpacing: '-0.02em',
            }}
          >
            {questionnaire.name}
          </Typography>

          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 3, md: 6 },
              background: 'white',
              borderRadius: 2,
            }}
          >
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={6}>
                {questionnaire.questions.map((question) => (
                  <FormControl key={question.id} component="fieldset">
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ 
                        fontWeight: 400,
                        color: '#2c3e50',
                        mb: 2,
                      }}
                    >
                      {question.question}
                    </Typography>

                    <Controller
                      name={question.id.toString()}
                      control={control}
                      defaultValue={question.type === 'mcq' ? [] : ''}
                      rules={{ required: true }}
                      render={({ field }) => (
                        question.type === 'mcq' ? (
                          <FormGroup>
                            {question.options.map((option) => (
                              <FormControlLabel
                                key={option}
                                control={
                                  <Checkbox 
                                    checked={field.value?.includes(option)}
                                    onChange={(e) => {
                                      const currentValues = Array.isArray(field.value) ? field.value : [];
                                      const newValue = e.target.checked
                                        ? [...currentValues, option]
                                        : currentValues.filter(v => v !== option);
                                      field.onChange(newValue);
                                    }}
                                    sx={{
                                      color: '#546e7a',
                                      '&.Mui-checked': { color: '#2c3e50' },
                                    }}
                                  />
                                }
                                label={
                                  <Typography sx={{ color: '#546e7a' }}>
                                    {option}
                                  </Typography>
                                }
                              />
                            ))}
                          </FormGroup>
                        ) : (
                          <TextField
                            {...field}
                            fullWidth
                            multiline
                            rows={3}
                            onChange={(e) => field.onChange([e.target.value])}
                            value={Array.isArray(field.value) ? field.value[0] || '' : field.value || ''}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                  borderColor: '#e0e0e0',
                                },
                                '&:hover fieldset': {
                                  borderColor: '#2c3e50',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#2c3e50',
                                },
                              },
                            }}
                          />
                        )
                      )}
                    />
                  </FormControl>
                ))}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  endIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
                  sx={{
                    mt: 4,
                    py: 1.5,
                    px: 4,
                    backgroundColor: '#2c3e50',
                    '&:hover': { backgroundColor: '#34495e' },
                    textTransform: 'none',
                    fontWeight: 400,
                  }}
                >
                  Submit
                </Button>
              </Stack>
            </form>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
