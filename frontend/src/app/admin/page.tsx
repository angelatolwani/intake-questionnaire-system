'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import * as apiClient from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Container,
  Box,
  Stack,
} from '@mui/material';
import LogoutButton from '@/components/LogoutButton';

interface UserResponse {
  username: string;
  response_count: number;
}

interface Answer {
  question: string;
  answer: string[] | string;
}

interface ResponseDetail {
  username: string;
  questionnaire_name: string;
  answers: Answer[];
}

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<ResponseDetail[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user?.is_admin) {
      router.push('/');
      return;
    }

    const fetchUserResponses = async () => {
      try {
        const data = await apiClient.getUserResponses();
        setUserResponses(data);
      } catch (error) {
        console.error('Error fetching user responses:', error);
      }
    };

    fetchUserResponses();
  }, [user, router]);

  const handleRowClick = async (username: string) => {
    try {
      const data = await apiClient.getUserResponseDetails(username);
      setUserDetails(data);
      setSelectedUser(username);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  return (
    <Box sx={{ background: '#fafafa', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Stack spacing={6}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
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
              Admin Dashboard
            </Typography>
            <LogoutButton />
          </Box>

          <Paper 
            elevation={0} 
            sx={{ 
              background: 'white',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      sx={{ 
                        fontWeight: 500,
                        color: '#2c3e50',
                        borderBottom: '2px solid #f5f6fa',
                        py: 2.5,
                      }}
                    >
                      Username
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontWeight: 500,
                        color: '#2c3e50',
                        borderBottom: '2px solid #f5f6fa',
                        py: 2.5,
                      }}
                    >
                      Completed Questionnaires
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userResponses.map((response) => (
                    <TableRow 
                      key={response.username}
                      onClick={() => handleRowClick(response.username)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { 
                          backgroundColor: 'rgba(44, 62, 80, 0.04)',
                        },
                      }}
                    >
                      <TableCell 
                        sx={{ 
                          color: '#546e7a',
                          borderBottom: '1px solid #f5f6fa',
                          py: 2,
                        }}
                      >
                        {response.username}
                      </TableCell>
                      <TableCell
                        sx={{ 
                          color: '#546e7a',
                          borderBottom: '1px solid #f5f6fa',
                          py: 2,
                        }}
                      >
                        {response.response_count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Stack>

        <Dialog 
          open={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              p: { xs: 2, md: 3 },
            }
          }}
        >
          <DialogTitle>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 300,
                color: '#2c3e50',
                mb: 2,
              }}
            >
              Responses for {selectedUser}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={4}>
              {userDetails.map((detail, index) => (
                <Box key={index}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 400,
                      color: '#2c3e50',
                      mb: 2,
                    }}
                  >
                    {detail.questionnaire_name}
                  </Typography>
                  <Stack spacing={2}>
                    {detail.answers.map((answer, answerIndex) => (
                      <Box key={answerIndex}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            color: '#2c3e50',
                            fontWeight: 500,
                            mb: 0.5,
                          }}
                        >
                          {answer.question}
                        </Typography>
                        <Typography 
                          sx={{ 
                            color: '#546e7a',
                            pl: 2,
                          }}
                        >
                          {Array.isArray(answer.answer) 
                            ? answer.answer.join(', ') 
                            : answer.answer}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
}
