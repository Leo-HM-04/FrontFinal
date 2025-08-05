import { useState } from "react";

interface Props {
  open: boolean;
  viaticoId: number | null;
  onClose: () => void;
  onSubmit: (file: File, viaticoId: number) => Promise<void>;
}

export default function SubirComprobanteViaticoModal({ open, viaticoId, onClose, onSubmit }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !viaticoId) {
      setError("Selecciona un archivo y un viático válido.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(file, viaticoId);
      onClose();
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al subir comprobante";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-md border border-blue-100">
        <h2 className="text-2xl font-bold mb-6 text-blue-900 border-b border-blue-100 pb-3">Subir Comprobante de Viático</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 bg-blue-50 hover:bg-blue-100 transition-colors duration-200">
            <div className="text-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-sm text-blue-700 font-medium">Selecciona un archivo</p>
              <p className="text-xs text-blue-600">PDF, JPG, PNG (Max 10MB)</p>
            </div>
            
            <div className="flex justify-center mt-4">
              <label className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
                Seleccionar archivo
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  onChange={handleFileChange}
                  className="hidden"
                  id="fileInput"
                />
              </label>
            </div>
            
            {file && (
              <div className="text-center mt-4 text-sm font-medium text-blue-800 bg-blue-50 p-2 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Archivo seleccionado:</span>
                </div>
                <div className="mt-1 font-bold">{file.name}</div>
                <div className="text-xs text-blue-600">({(file.size / 1024).toFixed(1)} KB)</div>
              </div>
            )}
          </div>
          
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-2">
            <button 
              type="button" 
              className="px-5 py-2.5 rounded-xl bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300" 
              onClick={onClose}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading || !file} 
              className={`px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold shadow-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${(!file || loading) ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Subiendo...
                </span>
              ) : "Subir Comprobante"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
