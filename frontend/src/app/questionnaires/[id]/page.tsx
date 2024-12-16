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
  Card,
  CardContent,
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
  Paper,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

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
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !questionnaire) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Questionnaire not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {questionnaire.name}
        </Typography>
      </Paper>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {questionnaire.questions.map((question) => (
            <Card key={question.id}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {question.question}
                </Typography>
                <Controller
                  name={question.id.toString()}
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl error={!!error} component="fieldset" fullWidth>
                      {question.type === 'mcq' ? (
                        <FormGroup>
                          {question.options.map((option, index) => (
                            <FormControlLabel
                              key={index}
                              control={
                                <Checkbox
                                  checked={field.value?.includes(option) || false}
                                  onChange={(e) => {
                                    const currentValues = Array.isArray(field.value) ? field.value : [];
                                    if (e.target.checked) {
                                      field.onChange([...currentValues, option]);
                                    } else {
                                      field.onChange(currentValues.filter(v => v !== option));
                                    }
                                  }}
                                />
                              }
                              label={option}
                            />
                          ))}
                        </FormGroup>
                      ) : (
                        <RadioGroup
                          value={field.value || ''}
                          onChange={(e) => field.onChange([e.target.value])}
                        >
                          {question.options.map((option, index) => (
                            <FormControlLabel
                              key={index}
                              value={option}
                              control={<Radio />}
                              label={option}
                            />
                          ))}
                        </RadioGroup>
                      )}
                      {error && (
                        <FormHelperText>This field is required</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </CardContent>
            </Card>
          ))}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={submitting}
              endIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
            >
              {submitting ? 'Submitting...' : 'Submit Questionnaire'}
            </Button>
          </Box>
        </Box>
      </form>
    </Container>
  );
}
