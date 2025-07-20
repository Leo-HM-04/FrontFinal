// Logo de perfil para aprobador
// Guardar como BechapraLogoPerfil.tsx

import React, { useState } from 'react';
import Image from 'next/image';

export default function BechapraLogoPerfil({ className = "w-16 h-16" }) {
  const [error, setError] = useState(false);
  return (
    <Image
      src={error ? "/assets/images/Logo_1x1_Azul@2x.png" : "/assets/images/Logo_1x1_Azul@2x.png"}
      alt="Bechapra Logo"
      className={className + " rounded-full object-cover border-4 border-white shadow-lg"}
      width={64}
      height={64}
      onError={() => setError(true)}
      unoptimized
      priority
    />
  );
}
