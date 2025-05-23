import React, { useState, useEffect } from 'react';
import { Edit2, Settings, LogOut, Camera, MessageCircle, BookOpen, Users, ExternalLink, Heart, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { AddPortfolioItemForm } from './AddPortfolioItemForm';
import { AddGalleryItemForm } from './AddGalleryItemForm';

interface ProfileViewProps {
  onEdit: () => void;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
}

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  location: string;
  date: string;
  created_at: string;
}

interface Follower {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
}

const ProfileView: React.FC<ProfileViewProps> = ({ onEdit }) => {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'gallery' | 'followers' | 'about'>('portfolio');
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState(false);
  const [showAddGalleryModal, setShowAddGalleryModal] = useState(false);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      // Cargar portafolio
      const { data: portfolioData } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (portfolioData) {
        setPortfolio(portfolioData);
      }

      // Cargar galería
      const { data: galleryData } = await supabase
        .from('gallery')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (galleryData) {
        setGallery(galleryData);
      }

      // Cargar seguidores
      const { data: followersData } = await supabase
        .rpc('get_user_followers', { user_id: user.id });

      if (followersData) {
        setFollowers(followersData.map((f: any) => ({
          id: f.id,
          username: f.nombre_usuario,
          displayName: f.nombre_completo,
          avatar: f.avatar_url
        })));
      }

      // Cargar siguiendo
      const { data: followingData } = await supabase
        .rpc('get_user_following', { user_id: user.id });

      if (followingData) {
        setFollowing(followingData.map((f: any) => ({
          id: f.id,
          username: f.nombre_usuario,
          displayName: f.nombre_completo,
          avatar: f.avatar_url
        })));
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user]);

  if (!user) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'portfolio':
        return (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {portfolio.map((item) => (
              <motion.div 
                key={item.id}
                className="aspect-square rounded-lg overflow-hidden relative group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <img 
                  src={item.image_url} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                  <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-center p-4">
                    <h3 className="text-sm font-medium mb-1">{item.title}</h3>
                    <p className="text-xs">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {user && (
              <motion.button
                onClick={() => setShowAddPortfolioModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-600"
              >
                <span className="text-3xl">+</span>
              </motion.button>
            )}
          </div>
        );
      case 'gallery':
        return (
          <div className="mt-4 space-y-3">
            {gallery.map((item) => (
              <motion.div 
                key={item.id}
                className="card"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="aspect-video rounded-lg overflow-hidden mb-2">
                  <img 
                    src={item.image_url} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.location}, {new Date(item.date).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
            {user && (
              <Link to="/gallery/new" className="block">
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="card p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 text-center"
                >
                  <span className="text-gray-400 dark:text-gray-600">+ Agregar nueva exposición</span>
                </motion.div>
              </Link>
            )}
          </div>
        );
      case 'followers':
        return (
          <div className="mt-4">
            <div className="flex justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Seguidores · {followers.length}
              </h3>
              <Link to="/profile/followers" className="text-sm text-primary-600 dark:text-primary-400">
                Ver todos
              </Link>
            </div>
            <div className="space-y-3">
              {followers.map(follower => (
                <motion.div 
                  key={follower.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center">
                    <div className="avatar h-10 w-10 mr-3">
                      <img 
                        src={follower.avatar} 
                        alt={follower.displayName}
                        className="avatar-img"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {follower.displayName}
                      </h4>
                      <p className="text-xs text-gray-500">@{follower.username}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                      <Heart className="h-4 w-4" />
                    </button>
                    <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
              <Link to="/discover" className="block">
                <motion.div
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.2 }}
                  className="p-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 text-center"
                >
                  <span className="text-gray-400 dark:text-gray-600">
                    Descubrir más creadores
                  </span>
                </motion.div>
              </Link>
            </div>
          </div>
        );
      case 'about':
        return (
          <div className="mt-4 space-y-4">
            <div className="card">
              <h3 className="font-medium mb-2">Biografía</h3>
              <p className="text-gray-700 dark:text-gray-300">
                {user.bio || 'No hay biografía disponible.'}
              </p>
            </div>
            
            {user.disciplines && user.disciplines.length > 0 && (
              <div className="card">
                <h3 className="font-medium mb-2">Disciplinas</h3>
                <div className="flex flex-wrap gap-2">
                  {user.disciplines.map(tag => (
                    <span 
                      key={tag}
                      className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {user.social_links && user.social_links.length > 0 && (
              <div className="card">
                <h3 className="font-medium mb-2">Redes Sociales</h3>
                <div className="space-y-2">
                  {user.social_links.map(link => (
                    <a 
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <ExternalLink className="h-4 w-4 text-gray-500 mr-3" />
                      <span>{link.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Profile Header */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-primary-600 to-secondary-500 rounded-t-xl">
          {user.cover_image && (
            <img 
              src={user.cover_image} 
              alt="Cover" 
              className="w-full h-full object-cover rounded-t-xl"
            />
          )}
        </div>
        <div className="absolute left-0 right-0 -bottom-16 flex justify-center">
          <div className="avatar h-32 w-32 ring-4 ring-white dark:ring-gray-900">
            <img 
              src={user.avatar} 
              alt={user.displayName} 
              className="avatar-img"
            />
          </div>
        </div>
      </div>
      
      {/* Profile Actions */}
      <div className="flex justify-between pt-20 px-4">
        <Link to="/messages" className="btn btn-ghost text-sm flex items-center">
          <MessageCircle className="h-4 w-4 mr-1" />
          Mensaje
        </Link>
        
        <button 
          onClick={onEdit}
          className="btn btn-ghost text-sm flex items-center"
        >
          <Edit2 className="h-4 w-4 mr-1" />
          Editar
        </button>
      </div>
      
      {/* Profile Info */}
      <div className="text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {user.displayName}
        </h1>
        <p className="text-primary-600 dark:text-primary-400 font-medium mt-1">
          @{user.username}
        </p>
        <p className="text-gray-600 dark:text-gray-300 mt-3 max-w-md mx-auto">
          {user.bio}
        </p>
        
        <div className="flex justify-center mt-4 space-x-6">
          <div className="text-center">
            <p className="text-xl font-semibold">{portfolio.length}</p>
            <p className="text-xs text-gray-500">Obras</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold">{followers.length}</p>
            <p className="text-xs text-gray-500">Seguidores</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold">{following.length}</p>
            <p className="text-xs text-gray-500">Siguiendo</p>
          </div>
        </div>
      </div>
      
      {/* Profile Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex justify-between px-4">
          {[
            { id: 'portfolio', label: 'Portfolio', icon: <Camera className="h-4 w-4" /> },
            { id: 'gallery', label: 'Galería', icon: <BookOpen className="h-4 w-4" /> },
            { id: 'followers', label: 'Seguidores', icon: <Users className="h-4 w-4" /> },
            { id: 'about', label: 'Perfil', icon: <UserIcon className="h-4 w-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center py-3 px-2 relative ${
                activeTab === tab.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {tab.icon}
              <span className="text-xs mt-1">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeProfileTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
                  transition={{ duration: 0.2 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="px-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>
      
      {/* Account Actions */}
      <div className="px-4 mt-6">
        <div className="card">
          <button className="flex items-center justify-between w-full py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-gray-500 mr-3" />
              <span>Configuración de cuenta</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button 
            onClick={logout}
            className="flex items-center w-full py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg mt-2 text-red-600 dark:text-red-400"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showAddPortfolioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <AddPortfolioItemForm
                onSuccess={() => {
                  setShowAddPortfolioModal(false);
                  loadUserData();
                }}
                onCancel={() => setShowAddPortfolioModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showAddGalleryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <AddGalleryItemForm
                onSuccess={() => {
                  setShowAddGalleryModal(false);
                  loadUserData();
                }}
                onCancel={() => setShowAddGalleryModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;