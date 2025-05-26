import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Moon, Sun, BellDot, Search, ArrowLeft, MoreVertical } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { UserSearch } from '../profile/UserSearch';

const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  const shouldShowBackButton = !['/'].includes(location.pathname);
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Inicio';
      case '/favorites': return 'Favoritos';
      case '/create': return 'Crear';
      case '/calendar': return 'Calendario';
      case '/profile': return 'Perfil';
      case '/blogs': return 'Blogs';
      case '/stories': return 'Stories';
      case '/streams': return 'En Vivo';
      case '/messages': return 'Mensajes';
      default: return '';
    }
  };
  
  const [showMenu, setShowMenu] = React.useState(false);
  const [showSubMenu, setShowSubMenu] = React.useState<string | null>(null);
  const [showSearch, setShowSearch] = React.useState(false);
  const searchModalRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setShowSubMenu(null);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);
  
  React.useEffect(() => {
    if (!showSearch) return;
    function handleClickOutside(event: MouseEvent) {
      if (searchModalRef.current && !searchModalRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearch]);
  
  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center w-1/3">
            {shouldShowBackButton ? (
              <button 
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            ) : (
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Red Viento Sur
              </h1>
            )}
          </div>
          
          {getPageTitle() && (
            <div className="flex items-center w-1/3 justify-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getPageTitle()}
              </h2>
            </div>
          )}
          
          <div className="flex items-center justify-end w-1/3 space-x-1">
            <button 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Buscar"
              onClick={() => setShowSearch(true)}
            >
              <Search className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            
            <button 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Notificaciones"
            >
              <BellDot className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-700" />
              )}
            </button>
            
            {/* Botón menú de usuario */}
            <div className="relative">
              <button
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Abrir menú de usuario"
                onClick={() => setShowMenu((v) => !v)}
              >
                <MoreVertical className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
              {showMenu && (
                <div ref={menuRef} className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {/* MENSAJES */}
                    <li>
                      <button
                        className="w-full text-left px-4 py-3 hover:bg-primary-50 dark:hover:bg-gray-800 flex items-center gap-2"
                        onClick={() => setShowSubMenu(showSubMenu === 'mensajes' ? null : 'mensajes')}
                        aria-haspopup="true"
                        aria-expanded={showSubMenu === 'mensajes'}
                      >
                        📩 Mensajes
                        <span className="ml-auto">›</span>
                      </button>
                      {showSubMenu === 'mensajes' && (
                        <ul className="ml-4 mt-1 space-y-1">
                          <li>
                            <Link to="/direct-messages" className="block px-4 py-2 hover:bg-primary-100 dark:hover:bg-gray-800 rounded">Mensajes directos</Link>
                          </li>
                          <li>
                            <Link to="/online-users" className="block px-4 py-2 hover:bg-primary-100 dark:hover:bg-gray-800 rounded">Usuarios en línea</Link>
                          </li>
                          <li>
                            <Link to="/messages" className="block px-4 py-2 hover:bg-primary-100 dark:hover:bg-gray-800 rounded">Mensaje/Chat (antiguo)</Link>
                          </li>
                        </ul>
                      )}
                    </li>
                    {/* MÁS OPCIONES */}
                    <li>
                      <button
                        className="w-full text-left px-4 py-3 hover:bg-primary-50 dark:hover:bg-gray-800 flex items-center gap-2"
                        onClick={() => setShowSubMenu(showSubMenu === 'mas' ? null : 'mas')}
                        aria-haspopup="true"
                        aria-expanded={showSubMenu === 'mas'}
                      >
                        ➕ Más opciones
                        <span className="ml-auto">›</span>
                      </button>
                      {showSubMenu === 'mas' && (
                        <ul className="ml-4 mt-1 space-y-1">
                          <li><Link to="/blogs" className="block px-4 py-2 hover:bg-primary-100 dark:hover:bg-gray-800 rounded">Blogs</Link></li>
                          <li><Link to="/calendar" className="block px-4 py-2 hover:bg-primary-100 dark:hover:bg-gray-800 rounded">Eventos culturales</Link></li>
                          <li><Link to="/calendar" className="block px-4 py-2 hover:bg-primary-100 dark:hover:bg-gray-800 rounded">Tareas</Link></li>
                          <li><Link to="/calendar" className="block px-4 py-2 hover:bg-primary-100 dark:hover:bg-gray-800 rounded">Cumpleaños</Link></li>
                          {/* <li><Link to="/agenda" className="block px-4 py-2 hover:bg-primary-100 dark:hover:bg-gray-800 rounded font-semibold text-primary-700 dark:text-primary-300">Agenda</Link></li> */}
                        </ul>
                      )}
                    </li>
                    {/* CONFIGURACIÓN Y CERRAR SESIÓN */}
                    <li>
                      <Link to="#" className="block px-4 py-3 hover:bg-primary-50 dark:hover:bg-gray-800">Configuración</Link>
                    </li>
                    <li>
                      <Link to="/login" className="block px-4 py-3 hover:bg-red-50 dark:hover:bg-gray-800 text-red-600 dark:text-red-400">Cerrar sesión</Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div ref={searchModalRef} className="bg-white dark:bg-gray-900 rounded-xl shadow-lg max-w-md w-full p-6 relative">
            <button
              className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Cerrar búsqueda"
              onClick={() => setShowSearch(false)}
            >
              <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            <UserSearch />
          </div>
        </div>
      )}
    </header>
  );
};

export default TopBar;