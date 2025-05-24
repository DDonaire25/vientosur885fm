import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Cake, Mail, Phone, Award, Share2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface CumpleañosCardProps {
  birthday: {
    id: string;
    nombre: string;
    fecha_nacimiento: string;
    disciplina: string;
    rol: string;
    email: string;
    telefono: string;
    trayectoria: string;
    imagen_url?: string;
  };
  onEdit?: () => void;
}

export const CumpleañosCard: React.FC<CumpleañosCardProps> = ({ birthday, onEdit }) => {
  const isToday = (date: string) => {
    const today = new Date();
    const birthDate = new Date(date);
    return birthDate.getDate() === today.getDate() && 
           birthDate.getMonth() === today.getMonth();
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar este cumpleaños?')) return;

    try {
      const { error } = await supabase
        .from('cumpleanos')
        .delete()
        .eq('id', birthday.id);

      if (error) throw error;
      toast.success('Cumpleaños eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar cumpleaños:', error);
      toast.error('Error al eliminar el cumpleaños');
    }
  };

  // Handler para compartir cumpleaños
  const handleShare = () => {
    const url = window.location.origin + '/cumpleanos/' + birthday.id;
    const title = `Cumpleaños de ${birthday.nombre}`;
    const text = `¡Feliz cumpleaños a ${birthday.nombre}! (${birthday.rol})`;
    if (navigator.share) {
      navigator.share({ title, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('¡Enlace copiado!');
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${
      isToday(birthday.fecha_nacimiento) ? 'ring-2 ring-pink-500' : ''
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {birthday.nombre}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {birthday.rol}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Cake className={`h-6 w-6 ${
              isToday(birthday.fecha_nacimiento) ? 'text-pink-500' : 'text-gray-400'
            }`} />
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Compartir cumpleaños"
              aria-label="Compartir cumpleaños"
            >
              <Share2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {birthday.imagen_url && (
          <div className="mt-4">
            <img
              src={birthday.imagen_url}
              alt={birthday.nombre}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}

        <div className="mt-4">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Award className="h-4 w-4 mr-2" />
            <span>{birthday.disciplina}</span>
          </div>
          
          <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Mail className="h-4 w-4 mr-2" />
            <a href={`mailto:${birthday.email}`} className="hover:text-pink-500">
              {birthday.email}
            </a>
          </div>
          
          <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Phone className="h-4 w-4 mr-2" />
            <a href={`tel:${birthday.telefono}`} className="hover:text-pink-500">
              {birthday.telefono}
            </a>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Trayectoria
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
            {birthday.trayectoria}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cumpleaños: {format(new Date(birthday.fecha_nacimiento), "d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>
    </div>
  );
};