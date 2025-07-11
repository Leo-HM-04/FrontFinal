// Logo de perfil para aprobador
// Guardar como BechapraLogoPerfil.tsx
import React, { useState } from 'react';

export default function BechapraLogoPerfil({ className = "w-16 h-16" }) {
  const [error, setError] = useState(false);
  return (
    <img
      src={error ? "/assets/images/Logo_1x1_Azul@2x.png" : "/assets/images/Logo_1x1_Azul@2x.png"}
      alt="Bechapra Logo"
      className={className + " rounded-full object-cover border-4 border-white shadow-lg"}
      onError={() => setError(true)}
    />
  );
}
