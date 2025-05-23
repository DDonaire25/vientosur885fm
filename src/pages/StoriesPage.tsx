import React, { useState, useEffect } from 'react';
import { PlusCircle, ChevronLeft, ChevronRight, Heart, MessageCircle, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUrl: string;
  description: string;
  createdAt: string;
  likes: number;
  isViewed: boolean;
}

const sampleStories: Story[] = [
  {
    id: '1',
    userId: '1',
    userName: 'María González',
    userAvatar: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=100',
    imageUrl: 'https://images.pexels.com/photos/3617457/pexels-photo-3617457.jpeg?auto=compress&cs=tinysrgb&w=600',
    description: 'Inauguración de la exposición "Luces del Sur" en el Centro Cultural',
    createdAt: new Date().toISOString(),
    likes: 24,
    isViewed: false
  },
  {
    id: '2',
    userId: '2',
    userName: 'Carlos Moreno',
    userAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
    imageUrl: 'https://images.pexels.com/photos/1749/fire-orange-emergency-burning.jpg?auto=compress&cs=tinysrgb&w=600',
    description: 'Ensayo general para el concierto de música andina',
    createdAt: new Date().toISOString(),
    likes: 18,
    isViewed: false
  },
  {
    id: '3',
    userId: '3',
    userName: 'Laura Díaz',
    userAvatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
    imageUrl: 'https://images.pexels.com/photos/995301/pexels-photo-995301.jpeg?auto=compress&cs=tinysrgb&w=600',
    description: 'Taller de danza contemporánea en la plaza central',
    createdAt: new Date().toISOString(),
    likes: 32,
    isViewed: false
  },
  {
    id: '4',
    userId: '4',
    userName: 'Pedro Ramírez',
    userAvatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100',
    imageUrl: 'https://images.pexels.com/photos/2873486/pexels-photo-2873486.jpeg?auto=compress&cs=tinysrgb&w=600',
    description: 'Rodaje del nuevo cortometraje "Raíces"',
    createdAt: new Date().toISOString(),
    likes: 15,
    isViewed: false
  }
];

const StoriesPage: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  
  useEffect(() => {
    // Simular carga de stories
    const loadStories = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStories(sampleStories);
      setIsLoading(false);
    };
    
    loadStories();
  }, []);
  
  const handleStoryClick = (story: Story, index: number) => {
    setActiveStory(story);
    setStoryIndex(index);
  };
  
  const handleCloseStory = () => {
    setActiveStory(null);
  };
  
  const handleNextStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (storyIndex < stories.length - 1) {
      setStoryIndex(storyIndex + 1);
      setActiveStory(stories[storyIndex + 1]);
    } else {
      handleCloseStory();
    }
  };
  
  const handlePrevStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
      setActiveStory(stories[storyIndex - 1]);
    }
  };
  
  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <LoadingSpinner message="Cargando stories..." />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Story Circles */}
      <div className="pt-2">
        <div className="flex overflow-x-auto space-x-4 pb-4 hide-scrollbar">
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center min-w-[80px]"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary-500 flex items-center justify-center bg-primary-50 dark:bg-primary-900/20">
              <PlusCircle className="h-8 w-8 text-primary-500" />
            </div>
            <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">Crear</span>
          </motion.div>
          
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center min-w-[80px]"
              onClick={() => handleStoryClick(story, index)}
            >
              <div className={`w-16 h-16 rounded-full p-[2px] ${story.isViewed ? 'bg-gray-300 dark:bg-gray-700' : 'bg-gradient-to-br from-primary-500 to-accent-500'}`}>
                <img 
                  src={story.userAvatar}
                  alt={story.userName}
                  className="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-900"
                />
              </div>
              <span className="text-xs mt-1 text-center truncate w-20">{story.userName.split(' ')[0]}</span>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Story Feed - Previews */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Stories destacadas</h2>
        
        <div className="grid grid-cols-2 gap-3">
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="aspect-[3/4] rounded-xl overflow-hidden relative"
              onClick={() => handleStoryClick(story, index)}
            >
              <img 
                src={story.imageUrl}
                alt={story.description}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden mr-2 ring-2 ring-white">
                    <img 
                      src={story.userAvatar}
                      alt={story.userName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium text-white">{story.userName}</span>
                </div>
                <p className="text-xs text-gray-200 line-clamp-2">{story.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Full Screen Story Viewer */}
      <AnimatePresence>
        {activeStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={handleCloseStory}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full max-w-md mx-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Progress Bar */}
              <div className="absolute top-0 left-0 right-0 z-10 flex p-2 space-x-1">
                {stories.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1 rounded-full flex-1 ${idx <= storyIndex ? 'bg-white' : 'bg-white/30'}`}
                  />
                ))}
              </div>
              
              {/* Story Content */}
              <div className="h-full relative">
                <img 
                  src={activeStory.imageUrl}
                  alt={activeStory.description}
                  className="w-full h-full object-cover"
                />
                
                {/* User Info */}
                <div className="absolute top-0 left-0 right-0 p-6 pt-8 flex items-center">
                  <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                    <img 
                      src={activeStory.userAvatar}
                      alt={activeStory.userName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-white font-medium">{activeStory.userName}</p>
                    <p className="text-xs text-gray-300">
                      {new Date(activeStory.createdAt).toLocaleString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </p>
                  </div>
                </div>
                
                {/* Description */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                  <p className="text-white mb-4">{activeStory.description}</p>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-5">
                    <button className="text-white flex items-center">
                      <Heart className="h-6 w-6 mr-1" />
                      <span>{activeStory.likes}</span>
                    </button>
                    <button className="text-white flex items-center">
                      <MessageCircle className="h-6 w-6 mr-1" />
                      <span>Comentar</span>
                    </button>
                    <button className="text-white">
                      <Share2 className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                
                {/* Navigation Buttons */}
                {storyIndex > 0 && (
                  <button 
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 p-1 rounded-full"
                    onClick={handlePrevStory}
                  >
                    <ChevronLeft className="h-8 w-8 text-white" />
                  </button>
                )}
                
                {storyIndex < stories.length - 1 && (
                  <button 
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 p-1 rounded-full"
                    onClick={handleNextStory}
                  >
                    <ChevronRight className="h-8 w-8 text-white" />
                  </button>
                )}
              </div>
            </motion.div>
            
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 text-white z-50"
              onClick={handleCloseStory}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoriesPage;