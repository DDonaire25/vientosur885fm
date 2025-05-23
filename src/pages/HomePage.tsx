import React, { useEffect, useState } from 'react';
import CreatePostForm from '../components/posts/CreatePostForm';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { usePostStore } from '../store/postStore';
import { useEventStore } from '../store/eventStore';
import { EventoCulturalCard } from '../components/cultural/EventoCulturalCard';
import CreateEventForm from '../components/calendar/CreateEventForm';
import { Event } from '../store/eventStore';

const HomePage = () => {
  const { posts, isLoading: isLoadingPosts, fetchPosts } = usePostStore();
  const { events, isLoading: isLoadingEvents, fetchEvents } = useEventStore();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetchPosts();
    fetchEvents();
  }, [fetchPosts, fetchEvents]);

  return (
    <div className="space-y-4">
      <CreatePostForm />

      {/* Modal de edición de evento */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              onClick={() => setEditingEvent(null)}
            >
              ✕
            </button>
            <h2 className="text-lg font-bold mb-4">Editar evento</h2>
            <CreateEventForm
              date={new Date(editingEvent.date)}
              onSuccess={() => { setEditingEvent(null); fetchEvents(); }}
              onCancel={() => setEditingEvent(null)}
              initialData={{
                id: editingEvent.id,
                title: editingEvent.title,
                description: editingEvent.description,
                category: editingEvent.metadata?.category || '',
                event_type: editingEvent.type,
                date: editingEvent.date.split('T')[0],
                location: editingEvent.location,
                target_audience: editingEvent.metadata?.target_audience || '',
                cost: { type: 'free' }, // Puedes mapear el costo real si lo tienes
                responsible_person: editingEvent.metadata?.responsible_person || { name: '', phone: '' },
                technical_requirements: editingEvent.metadata?.technical_requirements || [],
                image_url: editingEvent.imagen_url,
                tags: editingEvent.metadata?.tags || [],
                recurrence: editingEvent.metadata?.recurrence || { type: 'none' }
              }}
            />
          </div>
        </div>
      )}

      {/* Eventos culturales destacados */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-4">Eventos culturales</h2>
      {isLoadingEvents ? (
        <div className="py-8 flex justify-center">
          <LoadingSpinner message="Cargando eventos..." />
        </div>
      ) : events.length === 0 ? (
        <div className="card py-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No hay eventos culturales aún</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <EventoCulturalCard
              key={event.id}
              event={{
                id: event.id,
                titulo: event.title,
                descripcion: event.description,
                fecha_inicio: event.date,
                ubicacion: event.location || '',
                imagen_url: event.imagen_url,
                categoria: '',
                tipo: event.type,
                userId: event.userId,
                metadata: {
                  target_audience: event.metadata?.target_audience || '',
                  responsible_person: event.metadata?.responsible_person || { name: '', phone: '' },
                  technical_requirements: event.metadata?.technical_requirements || [],
                  tags: event.metadata?.tags || [],
                }
              }}
              onEdit={() => setEditingEvent(event)}
            />
          ))}
        </div>
      )}

      {/* Posts */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-8">Publicaciones</h2>
      {isLoadingPosts ? (
        <div className="py-8 flex justify-center">
          <LoadingSpinner message="Loading posts..." />
        </div>
      ) : posts.length === 0 ? (
        <div className="card py-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create your first post to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;