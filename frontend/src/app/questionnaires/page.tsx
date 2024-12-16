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
  Button,
  CircularProgress,
  Alert,
  Box,
  Stack,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LogoutButton from '@/components/LogoutButton';

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

  if (error) {
    return (
      <Box sx={{ background: '#fafafa', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="md">
          <Alert 
            severity="error"
            sx={{ 
              backgroundColor: 'transparent',
              color: '#e74c3c',
              '& .MuiAlert-icon': { color: '#e74c3c' }
            }}
          >
            {error}
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ background: '#fafafa', minHeight: '100vh', py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Stack spacing={6}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
          }}>
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
              Available Questionnaires
            </Typography>
            <LogoutButton />
          </Box>
          
          {questionnaires.length === 0 ? (
            <Card 
              elevation={0}
              sx={{ 
                py: 8,
                textAlign: 'center',
                backgroundColor: 'white',
                borderRadius: 2,
              }}
            >
              <CardContent>
                <Typography 
                  sx={{ 
                    color: '#546e7a',
                    fontSize: '1.1rem',
                  }}
                >
                  No questionnaires available at the moment.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {questionnaires.map((questionnaire) => (
                <Grid item xs={12} sm={6} md={4} key={questionnaire.id}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      backgroundColor: 'white',
                      borderRadius: 2,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(44, 62, 80, 0.12)',
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 4 }}>
                      <Typography 
                        variant="h5" 
                        component="h2" 
                        gutterBottom
                        sx={{ 
                          fontWeight: 400,
                          color: '#2c3e50',
                          mb: 2,
                        }}
                      >
                        {questionnaire.name}
                      </Typography>
                      
                      <Button
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => router.push(`/questionnaires/${questionnaire.id}`)}
                        sx={{
                          mt: 2,
                          color: '#2c3e50',
                          '&:hover': { 
                            backgroundColor: 'rgba(44, 62, 80, 0.04)',
                          },
                          textTransform: 'none',
                          fontWeight: 400,
                        }}
                      >
                        Start Questionnaire
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
