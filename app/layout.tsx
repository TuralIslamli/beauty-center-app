'use client';

import './globals.css';
import './styles/mobile.css';
import 'primereact/resources/themes/lara-dark-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { Toast } from 'primereact/toast';
import { useRef, useEffect } from 'react';
import { setToastInstance } from '../lib/axios';

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  const toastRef = useRef<Toast>(null);

  useEffect(() => {
    setToastInstance(toastRef.current);
  }, []);

  return (
    <html lang="az">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <title>Beauty Center</title>
      </head>
      <body>
        <Toast ref={toastRef} />
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
