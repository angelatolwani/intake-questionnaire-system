import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface QuestionData {
  type: string;
  options: string[];
  question: string;
}

async function parseCSV(filePath: string): Promise<any[]> {
  const records: any[] = [];
  const parser = fs
    .createReadStream(filePath)
    .pipe(parse({ columns: true, skip_empty_lines: true }));

  for await (const record of parser) {
    records.push(record);
  }
  return records;
}

async function importQuestionnaires() {
  const records = await parseCSV(path.join(__dirname, '../data/questionnaire_questionnaires.csv'));
  
  for (const record of records) {
    await prisma.questionnaire.create({
      data: {
        id: parseInt(record.id),
        name: record.name,
      },
    });
  }
  console.log('Questionnaires imported successfully');
}

async function importQuestions() {
  const records = await parseCSV(path.join(__dirname, '../data/questionnaire_questions.csv'));
  
  for (const record of records) {
    const questionData: QuestionData = JSON.parse(record.question);
    await prisma.question.create({
      data: {
        id: parseInt(record.id),
        type: questionData.type,
        options: JSON.stringify(questionData.options || []),
        question: questionData.question,
      },
    });
  }
  console.log('Questions imported successfully');
}

async function importJunctions() {
  const records = await parseCSV(path.join(__dirname, '../data/questionnaire_junction.csv'));
  
  for (const record of records) {
    await prisma.questionJunction.create({
      data: {
        id: parseInt(record.id),
        questionId: parseInt(record.question_id),
        questionnaireId: parseInt(record.questionnaire_id),
        priority: parseInt(record.priority),
      },
    });
  }
  console.log('Question junctions imported successfully');
}

async function createAdminUser() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  await prisma.user.create({
    data: {
      username: adminUsername,
      password: adminPassword, // In a real app, this should be hashed
      isAdmin: true,
    },
  });
  console.log('Admin user created successfully');
}

async function main() {
  try {
    // Clear existing data
    await prisma.$transaction([
      prisma.answer.deleteMany(),
      prisma.response.deleteMany(),
      prisma.questionJunction.deleteMany(),
      prisma.question.deleteMany(),
      prisma.questionnaire.deleteMany(),
      prisma.user.deleteMany(),
    ]);
    console.log('Existing data cleared');

    // Import data in order
    await importQuestionnaires();
    await importQuestions();
    await importJunctions();
    await createAdminUser();

    console.log('Data import completed successfully');
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
