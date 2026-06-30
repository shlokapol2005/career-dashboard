import './globals.css';

export const metadata = {
  title: 'AI Notes Summarizer | Career Dashboard',
  description: 'Upload your notes and let AI summarize them, extract concepts, and generate revision points.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
