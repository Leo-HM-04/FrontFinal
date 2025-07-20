// Logo Bechapra para perfil admin
import React from 'react';

export default function LogoBechapra({ className = '', size = 112 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 768 768"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="768" height="768" rx="0" fill="#F2F6FD"/>
      <text x="50%" y="44%" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="bold" fontSize="420" fill="#0052CC" dy=".35em">B</text>
      <path d="M 384 320 Q 480 240 608 240 Q 672 240 704 272 Q 672 256 608 280 Q 480 336 384 336 Z" fill="#0052CC"/>
      <text x="50%" y="80%" textAnchor="middle" fontFamily="Georgia,serif" fontSize="160" fill="#0052CC">Bechapra</text>
    </svg>
  );
}
