import React, { useEffect, useState } from 'react';
import { Book, Calendar, ArrowRight } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  coverImage: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  published: string;
  category: string;
  // Opcional: readTime, likes, comments
}

const BlogsPage: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');

  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoading(true);
      // Traer solo publicaciones tipo 'blog'
      const { data, error } = await supabase
        .from('publicaciones')
        .select(`id, titulo, excerpt, imagen_portada, categoria, publicado_en, autor:usuarios(id, nombre_completo, avatar_url)`)
        .eq('tipo', 'blog')
        .order('publicado_en', { ascending: false });
      if (error) {
        setBlogs([]);
        setIsLoading(false);
        return;
      }
      const mapped = (data || []).map((b: any) => ({
        id: b.id,
        title: b.titulo,
        excerpt: b.excerpt,
        coverImage: b.imagen_portada,
        authorId: b.autor?.id || '',
        authorName: b.autor?.nombre_completo || 'Autor',
        authorAvatar: b.autor?.avatar_url || '',
        published: b.publicado_en,
        category: b.categoria || 'General',
      }));
      setBlogs(mapped);
      setIsLoading(false);
    };
    fetchBlogs();
  }, []);

  const categories = ['Todos', 'Arte', 'Música', 'Cine', 'Danza', 'Literatura'];

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <LoadingSpinner message="Cargando artículos..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Featured Blog */}
      <div className="relative rounded-xl overflow-hidden h-48 mb-6">
        <img 
          src="https://images.pexels.com/photos/3617457/pexels-photo-3617457.jpeg?auto=compress&cs=tinysrgb&w=600"
          alt="Featured blog" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
          <span className="text-xs font-medium text-primary-300 mb-1">DESTACADO</span>
          <h2 className="text-xl font-bold text-white mb-1">Festivales culturales: Espacios de integración</h2>
          <p className="text-sm text-gray-200">Cómo los eventos masivos están redefiniendo el acceso a la cultura</p>
          <Link to="/blogs/featured" className="mt-2 text-sm text-white flex items-center">
            Leer más <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
      
      {/* Categories */}
      <div className="flex overflow-x-auto pb-2 hide-scrollbar">
        <div className="flex space-x-2">
          {categories.map(category => (
            <motion.button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
                activeCategory === category 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Blog List */}
      <div className="space-y-4">
        {blogs
          .filter(blog => activeCategory === 'Todos' || blog.category === activeCategory)
          .map(blog => (
            <Link key={blog.id} to={`/blogs/${blog.id}`}>
              <motion.div 
                className="card p-0 overflow-hidden"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 aspect-video md:aspect-square">
                    <img 
                      src={blog.coverImage} 
                      alt={blog.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 md:w-2/3">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">
                        {blog.category}
                      </span>
                      <span className="mx-2">•</span>
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{new Date(blog.published).toLocaleDateString('es-ES')}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">
                      {blog.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {blog.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="avatar h-6 w-6 mr-2">
                          <img 
                            src={blog.authorAvatar} 
                            alt={blog.authorName} 
                            className="avatar-img"
                          />
                        </div>
                        <span className="text-xs font-medium">{blog.authorName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
      </div>
      
      {/* Create Blog Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <Link to="/blogs/new">
          <motion.button
            className="btn btn-primary rounded-full p-3 shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Crear nuevo blog"
          >
            <Book className="h-5 w-5" />
          </motion.button>
        </Link>
      </div>
    </div>
  );
};

export default BlogsPage;