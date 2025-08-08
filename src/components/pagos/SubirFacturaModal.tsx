import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';

interface SubirFacturaModalProps {
  open: boolean;
  solicitudId: number | null;
  onClose: () => void;
  onSubmit?: (file: File, solicitudId: number | null) => void;
}

export const SubirFacturaModal: React.FC<SubirFacturaModalProps> = ({ 
  open, 
  solicitudId, 
  onClose, 
  onSubmit 
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  const handleFileSelect = (file: File) => {
    setFileName(file.name);
    setError(null);
    
    // Preview para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(file => 
      file.type === 'application/pdf' || 
      file.type.startsWith('image/')
    );
    
    if (validFile && fileInputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(validFile);
      fileInputRef.current.files = dt.files;
      handleFileSelect(validFile);
    } else {
      setError("Por favor, selecciona un archivo PDF o imagen válido");
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return (
        <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop con blur mejorado */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200/50 overflow-hidden transform transition-all duration-300 ease-out animate-in slide-in-from-bottom-4 fade-in-0">
        {/* Header con gradiente */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-700/90 backdrop-blur-sm"></div>
          
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200 group"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Subir Comprobante
                </h2>
                <p className="text-blue-100 text-sm">
                  Solicitud <span className="font-semibold">#{solicitudId}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">
          {/* Advertencia mejorada */}
          <div className="relative bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-r-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-amber-600 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-amber-800 font-semibold text-sm">
                  ¡Importante!
                </p>
                <p className="text-amber-700 text-sm mt-1">
                  Una vez subido el comprobante, <span className="font-semibold underline decoration-amber-500">no podrás realizar cambios</span> en este pago.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setSubmitting(true);
              
              const file = fileInputRef.current?.files?.[0];
              if (!file) {
                setError("Por favor selecciona un archivo válido");
                setSubmitting(false);
                return;
              }
              
              try {
                if (onSubmit) await onSubmit(file, solicitudId);
                onClose();
              } catch {
                setError("Error al subir el archivo. Inténtalo nuevamente.");
              } finally {
                setSubmitting(false);
              }
            }}
            className="space-y-6"
          >
            {/* Zona de drop mejorada */}
            <div className="space-y-4">
              <label className="block text-slate-700 font-semibold text-sm">
                Archivo del comprobante
              </label>
              
              <div
                className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-200 ${
                  isDragOver 
                    ? 'border-blue-400 bg-blue-50/50' 
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  disabled={submitting}
                  required
                />
                
                <div className="text-center">
                  {fileName ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-4">
                        {filePreview ? (
                          <Image 
                            src={filePreview} 
                            alt="Preview" 
                            width={64}
                            height={64}
                            className="w-16 h-16 object-cover rounded-xl border-2 border-slate-200"
                          />
                        ) : (
                          getFileIcon(fileName)
                        )}
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {fileName}
                          </p>
                          <p className="text-sm text-slate-500">Archivo seleccionado</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFileName("");
                          setFilePreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-sm text-slate-500 hover:text-slate-700 underline transition-colors"
                      >
                        Cambiar archivo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-slate-600 font-medium">
                          Arrastra tu archivo aquí o{" "}
                          <span className="text-blue-600 underline">haz clic para seleccionar</span>
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          Formatos: PDF, JPG, PNG (máx. 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Botones mejorados */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all duration-200 border border-slate-200"
                disabled={submitting}
              >
                Cancelar
              </button>
              
                          <button
              type="submit"
              disabled={submitting || !fileName}
              className="
                flex-1 px-6 py-3 
                bg-green-600 hover:bg-green-700  
                text-white 
                rounded-2xl 
                font-extrabold 
                shadow-xl hover:shadow-2xl 
                transition-all duration-200 
                flex items-center justify-center gap-2 
                disabled:cursor-not-allowed 
                border-2 border-green-600/70
              "
            >
              {submitting ? (
                // Estado: Subiendo (con spinner de carga)
                <>
                  <svg 
                    className="w-5 h-5 animate-spin" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
                    />
                  </svg>
                  Subiendo...
                </>
              ) : (
                // Estado: Listo para subir
                <>
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l3 3m0 0l3-3m-3 3V9" 
                    />
                  </svg>
                  Subir Comprobante
                </>
              )}
            </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};