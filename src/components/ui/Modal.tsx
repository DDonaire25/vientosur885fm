import React, { useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, children, className }) => {
  const startY = useRef<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handler para detectar swipe hacia abajo en móvil
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current !== null && modalRef.current) {
      const deltaY = e.touches[0].clientY - startY.current;
      if (deltaY > 0) {
        modalRef.current.style.transform = `translateY(${deltaY}px)`;
        modalRef.current.style.transition = 'none';
      }
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startY.current !== null && modalRef.current) {
      const deltaY = e.changedTouches[0].clientY - startY.current;
      if (deltaY > 80) {
        onClose();
      } else {
        modalRef.current.style.transform = '';
        modalRef.current.style.transition = '';
      }
    }
    startY.current = null;
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        ref={modalRef}
        className={`bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg md:max-w-6xl w-full mx-2 p-0 relative animate-modal-in max-h-[90vh] min-h-[400px] md:min-h-[500px] overflow-y-auto ${className || ''}`}
        style={{ touchAction: 'pan-y' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-300 focus:outline-none"
          aria-label="Cerrar"
          onClick={onClose}
        >
          <span aria-hidden>×</span>
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
