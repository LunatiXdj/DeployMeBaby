import { GeistSans } from 'geist/font/sans';
import 'material-symbols/index.css';
import '@/globals.css';
import { ThemeProvider } from '@/client/components/layout/theme-provider';
import { Providers } from './providers';

export const metadata = {
  title: 'My App',
  description: 'My App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable}`} suppressHydrationWarning>
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
