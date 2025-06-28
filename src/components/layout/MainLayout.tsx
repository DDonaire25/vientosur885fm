import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import LeftSidebar from './LeftSidebar';
import MainContent from './MainContent';
import RightSidebar from './RightSidebar';
import Header from './Header';
import ConversationModal from './ConversationModal';

const MainLayout: React.FC = () => {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [showConversations, setShowConversations] = useState(false);

  // Permite abrir el modal de conversaciones desde cualquier parte (ej: botón flotante homepage)
  useEffect(() => {
    const openModal = () => setShowConversations(true);
    window.addEventListener('openConversationsModal', openModal);
    return () => window.removeEventListener('openConversationsModal', openModal);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header general visible en móvil y escritorio */}
      <Header />
      <div className="flex flex-1 gap-0 sm:gap-2 md:gap-4 max-w-full mx-auto w-full overflow-x-hidden">
        {/* Sidebar izquierdo */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 transform ${leftOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 w-64 sm:w-72 md:w-80 bg-white dark:bg-gray-800 shadow-lg lg:shadow-none lg:w-1/4 hidden md:block lg:block`}
        >
          <LeftSidebar onOpenConversations={() => setShowConversations(true)} />
        </aside>
        {/* Contenido principal */}
        <main className="flex-1 w-full bg-white dark:bg-gray-900 rounded-none shadow-none border-0 min-h-[calc(100vh-56px)] overflow-y-auto p-0">
          <MainContent />
          <div className="w-full px-0 py-0">
            <Outlet />
          </div>
        </main>
        {/* Sidebar derecho solo escritorio */}
        <aside
          className={`fixed lg:static inset-y-0 right-0 z-30 transform ${rightOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 transition-transform duration-200 w-64 sm:w-72 md:w-80 bg-white dark:bg-gray-800 shadow-lg lg:shadow-none lg:w-1/4 hidden md:block lg:block`}
        >
          <RightSidebar />
        </aside>
      </div>
      {/* Botón flotante para escribir mensaje solo en móvil */}
      <div className="lg:hidden fixed bottom-20 right-4 z-50">
        <button
          className="btn btn-primary rounded-full p-4 shadow-lg text-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          onClick={() => setShowConversations(true)}
          aria-label="Escribir mensaje"
          tabIndex={0}
        >
          {/* Icono burbuja de mensaje (MessageCircle de lucide-react) */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 12c0 4.556-4.686 8.25-9.75 8.25-1.13 0-2.25-.17-3.3-.5l-4.2 1.25a.75.75 0 01-.94-.94l1.25-4.2c-.33-1.05-.5-2.17-.5-3.3C2.25 7.186 5.944 2.5 12 2.5s9.75 4.686 9.75 9.5z" />
          </svg>
        </button>
      </div>
      {/* Modal de conversaciones universal (móvil y escritorio) */}
      <ConversationModal open={showConversations} onClose={() => setShowConversations(false)} />
      {/* Panel de navegación inferior solo en móvil */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40 flex justify-between items-center px-0 py-1 max-w-full shadow-t">
        <BottomNavigation />
      </nav>
      {/* Backdrop para móvil */}
      {(leftOpen || rightOpen) && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => {
            setLeftOpen(false);
            setRightOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default MainLayout;
