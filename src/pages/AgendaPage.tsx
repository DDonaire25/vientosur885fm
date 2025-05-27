import React, { useEffect, useState } from "react";
import { EventoCulturalCard } from "../components/cultural/EventoCulturalCard";
import { CumpleañosCard } from "../components/cultural/CumpleañosCard";
import { TareaCulturalKanban } from "../components/cultural/TareaCulturalKanban";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import { Search } from 'lucide-react';

const AgendaPage: React.FC = () => {
  const [eventos, setEventos] = useState<any[]>([]);
  const [cumpleanos, setCumpleanos] = useState<any[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [loadingCumpleanos, setLoadingCumpleanos] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    // Cargar eventos culturales
    const fetchEventos = async () => {
      setLoadingEventos(true);
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .order('fecha_inicio', { ascending: true });
      setEventos(data || []);
      setLoadingEventos(false);
    };
    fetchEventos();
  }, []);

  useEffect(() => {
    // Cargar cumpleaños del día actual
    const fetchCumpleanos = async () => {
      setLoadingCumpleanos(true);
      const today = new Date();
      const mes = today.getMonth() + 1;
      const dia = today.getDate();
      const { data } = await supabase
        .from('cumpleanos')
        .select('*')
        .filter('extract(month from fecha_nacimiento)', 'eq', mes)
        .filter('extract(day from fecha_nacimiento)', 'eq', dia);
      setCumpleanos(data || []);
      setLoadingCumpleanos(false);
    };
    fetchCumpleanos();
  }, []);

  // Filtrar eventos por búsqueda y fecha
  const eventosFiltrados = eventos.filter(event => {
    const matchNombre = event.titulo?.toLowerCase().includes(search.toLowerCase());
    const matchFecha = filterDate ? format(new Date(event.fecha_inicio), 'yyyy-MM-dd') === filterDate : true;
    return matchNombre && matchFecha;
  });

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Agenda</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
        <div className="flex-1 flex flex-col md:flex-row gap-4">
          <div className="relative w-full md:w-1/2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder="Buscar evento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-3 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full transition shadow-sm"
              aria-label="Buscar evento"
            />
          </div>
          <div className="relative w-full md:w-1/3">
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="px-3 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full transition shadow-sm"
              aria-label="Filtrar por fecha"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z"/></svg>
            </span>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={() => window.location.href = '/calendar'}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 transition focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Programar evento"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 5v14m7-7H5"/></svg>
            Programar
          </button>
        </div>
      </div>
      <section aria-labelledby="eventos-culturales" className="mb-8">
        <h2 id="eventos-culturales" className="text-xl font-semibold mb-4">Eventos culturales</h2>
        {loadingEventos ? (
          <div>Cargando eventos...</div>
        ) : eventosFiltrados.length === 0 ? (
          <div>No hay eventos culturales.</div>
        ) : (
          eventosFiltrados.map(event => (
            <EventoCulturalCard key={event.id} event={event} />
          ))
        )}
      </section>
      <section aria-labelledby="cumpleanos" className="mb-8">
        <h2 id="cumpleanos" className="text-xl font-semibold mb-4">Cumpleaños</h2>
        {loadingCumpleanos ? (
          <div>Cargando cumpleaños...</div>
        ) : cumpleanos.length === 0 ? (
          <div>No hay cumpleaños hoy.</div>
        ) : (
          cumpleanos.map(birthday => (
            <CumpleañosCard key={birthday.id} birthday={birthday} />
          ))
        )}
      </section>
      <section aria-labelledby="tareas" className="mb-8">
        <h2 id="tareas" className="text-xl font-semibold mb-4">Tareas</h2>
        <TareaCulturalKanban />
      </section>
    </main>
  );
};

export default AgendaPage;