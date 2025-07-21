import { useEffect, useState } from "react";
import { toast, ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Notificacion {
  id_notificacion: number;
  mensaje: string;
  leida: number;
  fecha_creacion: string;
}

export default function UserNotifications({ token }: { token: string }) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastShownId, setLastShownId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/notificaciones/solicitante`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setNotificaciones(data);
        // Mostrar toast solo para la última no leída
        const unread = data.filter((n: Notificacion) => !n.leida);
        if (unread.length && unread[0].id_notificacion !== lastShownId && !open) {
          toast.info(unread[0].mensaje, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            transition: Slide,
          });
          setLastShownId(unread[0].id_notificacion);
        }
      })
      .finally(() => setLoading(false));
  }, [token, open, lastShownId]);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        transition={Slide}
        theme="light"
        style={{ zIndex: 9999 }}
      />
      <button
        onClick={() => setOpen(true)}
        aria-label="Ver notificaciones"
        className="relative w-12 h-12 flex items-center justify-center rounded-full bg-transparent hover:bg-blue-100 transition-colors duration-200 text-blue-700 focus:outline-none"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto p-6 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-2xl font-bold"
              aria-label="Cerrar"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-blue-700">Notificaciones</h2>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : notificaciones.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No tienes notificaciones.</div>
            ) : (
              <ul className="divide-y divide-blue-100 max-h-80 overflow-y-auto">
                {notificaciones.map((n) => (
                  <li key={n.id_notificacion} className={`py-3 px-2 ${!n.leida ? "bg-blue-50" : ""}`}>
                    <div className="font-medium text-gray-800 mb-1">{n.mensaje}</div>
                    <div className="text-xs text-gray-500">{new Date(n.fecha_creacion).toLocaleString()}</div>
                    {!n.leida && <span className="inline-block mt-1 text-xs text-blue-600 font-semibold">● Nueva</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
