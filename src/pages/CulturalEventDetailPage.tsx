import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import NotFoundPage from './NotFoundPage';
import { supabase } from '../lib/supabase';
import { EventoCulturalCard } from '../components/cultural/EventoCulturalCard';

const CulturalEventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      (async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .eq('id', id)
          .single();
        if (data && !error) {
          setEvent(data);
        } else {
          setEvent(null);
        }
        setLoading(false);
      })();
    }
  }, [id]);

  if (loading) return <div className="p-8 text-center">Cargando...</div>;
  if (!event) return <NotFoundPage />;

  return (
    <div className="max-w-xl mx-auto p-4">
      <EventoCulturalCard event={event} />
    </div>
  );
};

export default CulturalEventDetailPage;
