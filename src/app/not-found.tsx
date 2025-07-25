'use client';

import React from 'react';
import Link from 'next/link';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const NotFound = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f8ff', // blanco con azul muy claro
        color: '#2563eb', // azul fuerte para texto principal
      }}
    >
      <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem', textShadow: '0 2px 8px #e0e7ff' }}>
        Página no encontrada
      </h1>
      <DotLottieReact
        src="https://lottie.host/2f3da450-2689-45e0-834a-453f9c2dc725/vSm7Jng7iz.lottie"
        loop
        autoplay
        style={{ width: 220, height: 220, marginBottom: '1.5rem', background: 'transparent' }}
      />
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem', textAlign: 'center', color: '#2563eb', textShadow: '0 1px 4px #e0e7ff' }}>
        La página que buscas no existe o fue movida.
      </p>
      <Link
        href="/"
        style={{
          padding: '0.75rem 2rem',
          background: '#2563eb',
          color: '#fff',
          borderRadius: '999px',
          fontWeight: 600,
          fontSize: '1rem',
          textDecoration: 'none',
          boxShadow: '0 2px 8px #e0e7ff',
          transition: 'background 0.2s, color 0.2s',
          cursor: 'pointer',
          display: 'inline-block',
        }}
        onMouseOver={e => {
          (e.currentTarget as HTMLAnchorElement).style.background = '#60A5FA';
        }}
        onMouseOut={e => {
          (e.currentTarget as HTMLAnchorElement).style.background = '#2563eb';
        }}
      >
        Volver al inicio
      </Link>
    </div>
  );
};

export default NotFound;
