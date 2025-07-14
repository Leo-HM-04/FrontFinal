import React, { useRef } from 'react';

interface SubirFacturaModalProps {
  open: boolean;
  solicitudId: number | null;
  onClose: () => void;
  onSubmit?: (file: File, solicitudId: number | null) => void;
}

export const SubirFacturaModal: React.FC<SubirFacturaModalProps> = ({ open, solicitudId, onClose, onSubmit }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md border border-blue-300 relative">
        <button
          className="absolute top-2 right-2 text-blue-700 hover:text-red-600 text-2xl font-bold"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>
        <h3 className="text-xl font-bold mb-4 text-blue-700">
          Subir factura para solicitud #{solicitudId}
        </h3>
        <form
          onSubmit={e => {
            e.preventDefault();
            const file = fileInputRef.current?.files?.[0];
            if (file && onSubmit) {
              onSubmit(file, solicitudId);
            }
            onClose();
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="mb-4 block w-full border border-blue-300 rounded-lg px-3 py-2"
            required
          />
          <button
            type="submit"
            className="w-full py-2 px-4 bg-green-600 text-white rounded-lg font-bold shadow hover:bg-green-700 transition"
          >
            Subir factura
          </button>
        </form>
      </div>
    </div>
  );
};
