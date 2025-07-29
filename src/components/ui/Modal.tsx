import React from "react";

interface ModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  warning?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  message,
  warning,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-lg animate-fade-in border border-gray-100">
        {title && (
          <h2 className="text-2xl font-extrabold mb-3 text-gray-900 text-center tracking-tight">
            {title}
          </h2>
        )}
        <p className="mb-6 text-gray-700 text-center text-base font-medium">{message}</p>
        {warning && (
          <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded text-center text-sm font-semibold">
            {warning}
          </div>
        )}
        <div className="flex justify-center gap-4 mt-6">
          <button
            className="px-6 py-2 rounded-lg border border-blue-500 text-blue-600 font-bold bg-white hover:bg-blue-50 transition-colors text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            onClick={onCancel}
            type="button"
          >
            {cancelText}
          </button>
          <button
            className="px-6 py-2 rounded-lg border border-blue-600 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            onClick={onConfirm}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
