'use client';

import { Container, Typography, Button, Box, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import LoginIcon from '@mui/icons-material/Login';

export default function Home() {
  const router = useRouter();

  return (
    <Container maxWidth="md" sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4
    }}>
      <Paper elevation={3} sx={{ 
        p: 6, 
        textAlign: 'center',
        borderRadius: 2,
        maxWidth: '600px'
      }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Welcome to the Questionnaire System
        </Typography>
        
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
          A simple and efficient way to collect and manage responses through customized questionnaires.
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => router.push('/login')}
            startIcon={<LoginIcon />}
            sx={{ 
              py: 1.5,
              px: 4,
              fontSize: '1.1rem'
            }}
          >
            Get Started
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
