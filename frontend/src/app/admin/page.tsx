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
  Card,
  CardContent,
  Typography,
  Container,
  Box,
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1">
          Admin Dashboard
        </Typography>
        <LogoutButton />
      </Box>

      <Typography variant="h4" component="h2" gutterBottom>
        User Responses
      </Typography>
      
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Completed Questionnaires</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userResponses.map((response) => (
              <TableRow
                key={response.username}
                hover
                onClick={() => handleRowClick(response.username)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{response.username}</TableCell>
                <TableCell>{response.response_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Responses for {selectedUser}
        </DialogTitle>
        <DialogContent dividers>
          {userDetails.map((detail, idx) => (
            <Card key={idx} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {detail.questionnaire_name}
                </Typography>
                {detail.answers.map((answer, answerIdx) => (
                  <div key={answerIdx} style={{ marginBottom: '1rem' }}>
                    <Typography variant="subtitle1" color="primary">
                      Q: {answer.question}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      A: {Array.isArray(answer.answer) 
                        ? answer.answer.join(', ') 
                        : answer.answer}
                    </Typography>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </DialogContent>
      </Dialog>
    </Container>
  );
}
