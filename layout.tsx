import { GeistSans } from 'geist/font/sans';
import './../src/app/globals.css';
import { ThemeProvider } from '@/client/components/layout/theme-provider';
import { Providers } from './providers';
import GoogleAnalytics from '@/client/components/analytics/google-analytics';

export const metadata = {
  title: 'My App',
  description: 'My App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable}`} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
        <GoogleAnalytics />
      </head>
      <body>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
