import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Questionnaire System',
  description: 'A system for managing questionnaires and responses',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Questionnaire System</title>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
