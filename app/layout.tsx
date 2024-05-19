"use client";
import "./globals.css";
import "primereact/resources/themes/lara-dark-blue/theme.css";
import 'primeicons/primeicons.css';


const RootLayout = ({ children }: { children: React.ReactNode }) => {

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;