'use client';

import './globals.css';
import './styles/mobile.css';
import 'primereact/resources/themes/lara-dark-blue/theme.css';
import 'primeicons/primeicons.css';

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <html lang="az">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <title>Beauty Center</title>
      </head>
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
