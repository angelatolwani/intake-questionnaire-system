'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>();
  const { login, error: loginError, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.is_admin) {
        router.push('/admin');
      } else {
        router.push('/questionnaires');
      }
    }
  }, [user, router]);

  const onSubmit = async (data: LoginForm) => {
    await login(data.username, data.password);
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: '#fafafa',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            background: 'white',
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                backgroundColor: '#2c3e50',
                borderRadius: '50%',
                p: 1.5,
                mb: 3,
                color: 'white',
              }}
            >
              <LockOutlinedIcon />
            </Box>
            
            <Typography 
              component="h1" 
              sx={{ 
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                fontWeight: 300,
                color: '#2c3e50',
                letterSpacing: '-0.02em',
                mb: 4,
              }}
            >
              Sign in to your account
            </Typography>

            {loginError && (
              <Alert 
                severity="error"
                sx={{ 
                  mb: 3, 
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: '#e74c3c',
                  '& .MuiAlert-icon': { color: '#e74c3c' }
                }}
              >
                {loginError}
              </Alert>
            )}

            <Box 
              component="form" 
              onSubmit={handleSubmit(onSubmit)} 
              sx={{ width: '100%' }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                autoComplete="username"
                autoFocus
                error={!!errors.username}
                helperText={errors.username?.message}
                {...register('username', { required: 'Username is required' })}
                sx={{
                  mb: 3,
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
                  '& .MuiInputLabel-root': {
                    color: '#546e7a',
                    '&.Mui-focused': {
                      color: '#2c3e50',
                    },
                  },
                }}
              />

              <TextField
                required
                fullWidth
                id="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                error={!!errors.password}
                helperText={errors.password?.message}
                {...register('password', { required: 'Password is required' })}
                sx={{
                  mb: 4,
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
                  '& .MuiInputLabel-root': {
                    color: '#546e7a',
                    '&.Mui-focused': {
                      color: '#2c3e50',
                    },
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSubmitting}
                sx={{
                  py: 1.5,
                  backgroundColor: '#2c3e50',
                  '&:hover': { backgroundColor: '#34495e' },
                  textTransform: 'none',
                  fontWeight: 400,
                  fontSize: '1.1rem',
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Sign In'
                )}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
