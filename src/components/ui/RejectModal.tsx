import React, { useState } from "react";

interface RejectModalProps {
  isOpen: boolean;
  title?: string;
  solicitudId?: number;
  onConfirm: (comentario: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  title = "¿Confirmar rechazo?",
  solicitudId,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    const comentarioTrimmed = comentario.trim();
    
    if (!comentarioTrimmed) {
      setError("El comentario es obligatorio para rechazar la solicitud");
      return;
    }

    if (comentarioTrimmed.length < 10) {
      setError("El comentario debe tener al menos 10 caracteres");
      return;
    }

    onConfirm(comentarioTrimmed);
  };

  const handleCancel = () => {
    setComentario("");
    setError("");
    onCancel();
  };

  const handleComentarioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComentario(e.target.value);
    if (error) {
      setError("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg animate-fade-in border border-gray-100">
        <h2 className="text-2xl font-extrabold mb-4 text-gray-900 text-center tracking-tight">
          {title}
        </h2>
        
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                Esta acción rechazará la solicitud {solicitudId && `#${solicitudId}`} y notificará al solicitante.
              </p>
              <p className="text-sm text-red-700 mt-1">
                <strong>Advertencia:</strong> Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="comentario-rechazo" className="block text-sm font-semibold text-gray-700 mb-2">
            Motivo del rechazo <span className="text-red-500">*</span>
          </label>
          <textarea
            id="comentario-rechazo"
            value={comentario}
            onChange={handleComentarioChange}
            placeholder="Explica el motivo por el cual se está rechazando esta solicitud..."
            className={`w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-colors text-gray-900 placeholder-gray-500 ${
              error ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
            }`}
            rows={4}
            maxLength={500}
            disabled={isLoading}
          />
          <div className="flex justify-between mt-1">
            <div>
              {error && (
                <p className="text-sm text-red-600 font-medium">{error}</p>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {comentario.length}/500 caracteres
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-bold bg-white hover:bg-gray-50 transition-colors text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCancel}
            type="button"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            className="px-6 py-2 rounded-lg border border-red-600 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleConfirm}
            type="button"
            disabled={isLoading || !comentario.trim()}
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Rechazar Solicitud
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;