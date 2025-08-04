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
    } catch (err: any) {
      setError(err.message || "Error al subir comprobante");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-8 shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-black">Subir Comprobante de Viático</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="block w-full" />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end space-x-2">
            <button type="button" className="px-4 py-2 rounded bg-gray-200 text-black" onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={loading || !file} className="px-4 py-2 rounded bg-blue-600 text-white font-bold">
              {loading ? "Subiendo..." : "Subir Comprobante"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
