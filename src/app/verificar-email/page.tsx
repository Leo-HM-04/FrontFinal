"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function VerificarEmailPageInner() {
  const searchParams = useSearchParams();
  const [mensaje, setMensaje] = useState("Verificando...");
  const [estado, setEstado] = useState<"verificando"|"ok"|"error">("verificando");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setMensaje("Token no proporcionado.");
      setEstado("error");
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://46.202.177.106:4000"}/api/usuarios/verificar-email?token=` + token)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setMensaje(data.message || "Correo verificado correctamente.");
          setEstado("ok");
        } else {
          setMensaje(data.message || "Error al verificar el correo.");
          setEstado("error");
        }
      })
      .catch(() => {
        setMensaje("Error de red al verificar el correo.");
        setEstado("error");
      });
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className={`p-6 rounded shadow-md ${estado === "ok" ? "bg-green-100 text-green-800" : estado === "error" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
        <h1 className="text-2xl font-bold mb-2">Verificación de correo</h1>
        <p>{mensaje}</p>
      </div>
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <VerificarEmailPageInner />
    </Suspense>
  );
}
