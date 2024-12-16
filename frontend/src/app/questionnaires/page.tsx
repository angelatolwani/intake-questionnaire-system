'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import * as api from '@/lib/api';
import { Questionnaire } from '@/types/api';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Box,
  Chip,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LogoutButton from '@/components/LogoutButton';

export default function QuestionnairesPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [questionnairesData, completedData] = await Promise.all([
          api.getQuestionnaires(),
          api.getCompletedQuestionnaires()
        ]);
        setQuestionnaires(questionnairesData);
        setCompletedIds(completedData);
      } catch (err) {
        setError('Failed to load questionnaires');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

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

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1">
          Available Questionnaires
        </Typography>
        <LogoutButton />
      </Box>
      
      {questionnaires.length === 0 ? (
        <Card sx={{ py: 6, textAlign: 'center' }}>
          <CardContent>
            <Typography color="text.secondary">
              No questionnaires available at the moment.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {questionnaires.map((questionnaire) => {
            const isCompleted = completedIds.includes(questionnaire.id);
            return (
              <Grid item xs={12} sm={6} md={4} key={questionnaire.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                      cursor: 'pointer'
                    }
                  }}
                  onClick={() => router.push(`/questionnaires/${questionnaire.id}`)}
                >
                  <CardContent sx={{ flexGrow: 1, position: 'relative' }}>
                    {isCompleted && (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Completed"
                        color="success"
                        size="small"
                        sx={{ 
                          position: 'absolute',
                          top: 8,
                          right: 8,
                        }}
                      />
                    )}
                    <Typography variant="h5" component="h2" gutterBottom>
                      {questionnaire.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Click to {isCompleted ? 'update' : 'start'} this questionnaire
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      endIcon={<ArrowForwardIcon />} 
                      sx={{ ml: 'auto' }}
                    >
                      {isCompleted ? 'Update Answers' : 'Start'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}
