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
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
        {title && <h2 className="text-xl font-bold mb-2 text-gray-800">{title}</h2>}
        <p className="mb-4 text-gray-700">{message}</p>
        {warning && (
          <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded">
            {warning}
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 rounded border border-blue-500 text-blue-600 font-semibold hover:bg-blue-50 transition-colors"
            onClick={onCancel}
            type="button"
          >
            {cancelText}
          </button>
          <button
            className="px-4 py-2 rounded border border-blue-600 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
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
