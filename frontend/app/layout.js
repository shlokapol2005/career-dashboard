import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import LayoutWrapper from '../components/LayoutWrapper';

export const metadata = {
  title: 'NEXUS HQ | AI-Powered Career Learning Platform',
  description: 'Upload notes, close skill gaps, analyze your resume, and find hackathon teammates — all powered by Gemini AI.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
