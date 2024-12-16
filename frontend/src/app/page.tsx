'use client';

import { Container, Typography, Button, Box, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import LoginIcon from '@mui/icons-material/Login';

export default function Home() {
  const router = useRouter();

  return (
    <Box sx={{
      minHeight: '100vh',
      background: '#fafafa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4,
      px: 2,
    }}>
      <Paper elevation={0} sx={{
        p: { xs: 4, md: 8 },
        textAlign: 'center',
        maxWidth: '700px',
        background: 'transparent',
      }}>
        <Typography 
          variant="h1" 
          component="h1" 
          sx={{ 
            fontWeight: 300,
            fontSize: { xs: '2.5rem', md: '4rem' },
            letterSpacing: '-0.02em',
            color: '#2c3e50',
            mb: 3,
          }}
        >
          Questionnaire System
        </Typography>

        <Typography 
          variant="h5" 
          sx={{ 
            mb: 6,
            fontSize: { xs: '1.1rem', md: '1.4rem' },
            lineHeight: 1.6,
            maxWidth: '600px',
            mx: 'auto',
            color: '#546e7a',
            fontWeight: 300,
          }}
        >
          A streamlined platform for collecting and managing responses
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={() => router.push('/login')}
          startIcon={<LoginIcon />}
          sx={{
            py: 2,
            px: 6,
            fontSize: '1.1rem',
            fontWeight: 400,
            borderRadius: 2,
            textTransform: 'none',
            backgroundColor: '#2c3e50',
            '&:hover': {
              backgroundColor: '#34495e',
            }
          }}
        >
          Get Started
        </Button>
      </Paper>
    </Box>
  );
}
