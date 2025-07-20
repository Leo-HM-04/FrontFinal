import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface SubirComprobanteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File) => Promise<void>;
}

export const SubirComprobanteModal: React.FC<SubirComprobanteModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Selecciona un archivo');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(file);
      onClose();
    } catch {
      setError('Error al subir el comprobante');
    }
    setLoading(false);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-8 shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Subir Comprobante de Pago</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="block w-full" />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading || !file} className="bg-blue-600 text-white">
              {loading ? 'Subiendo...' : 'Subir Comprobante'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
