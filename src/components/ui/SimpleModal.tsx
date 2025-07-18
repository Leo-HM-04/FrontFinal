import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const SimpleModal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl shadow-blue-200 border border-blue-200 p-6 max-w-4xl w-[800px] animate-fade-in relative transition-all duration-300 transform scale-100 opacity-100 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 8px 40px 0 rgba(30, 64, 175, 0.18), 0 1.5px 8px 0 rgba(0,0,0,0.10)' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 hover:bg-blue-100 transition-colors rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>
        {title && <h2 className="text-2xl font-bold mb-4 text-blue-800 tracking-tight">{title}</h2>}
        {children}
      </div>
    </div>
  );
};

export default SimpleModal;
