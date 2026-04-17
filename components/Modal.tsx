import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 animate-overlay-in" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative z-10 animate-scale-in inline-block align-bottom bg-white rounded-3xl text-left shadow-2xl transform sm:my-8 sm:align-middle sm:max-w-lg w-full border border-gray-100 max-h-[90vh] flex flex-col">
          {/* Header — fixed */}
          <div className="flex justify-between items-center px-6 pt-6 pb-4 sm:px-7 sm:pt-7 border-b border-gray-100 shrink-0">
            <h3 className="text-xl leading-6 font-bold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>
          {/* Body — scrollable */}
          <div className="overflow-y-auto px-6 py-5 sm:px-7">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
