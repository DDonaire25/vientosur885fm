import React, { useEffect, useState } from 'react';
import CalendarView from '../components/calendar/CalendarView';
import EventList from '../components/calendar/EventList';
import CreateEventForm from '../components/calendar/CreateEventForm';
import { useEventStore } from '../store/eventStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCreating, setIsCreating] = useState(false);
  
  const { isLoading, fetchEvents } = useEventStore();
  
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  
  const handleCreateEvent = () => {
    setIsCreating(true);
  };
  
  const handleCreateSuccess = () => {
    setIsCreating(false);
  };
  
  const handleCreateCancel = () => {
    setIsCreating(false);
  };
  
  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <LoadingSpinner message="Loading calendar..." />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <CalendarView 
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />
      
      {isCreating ? (
        <CreateEventForm
          date={selectedDate}
          onSuccess={handleCreateSuccess}
          onCancel={handleCreateCancel}
        />
      ) : (
        <EventList
          date={selectedDate}
          onCreateEvent={handleCreateEvent}
        />
      )}
    </div>
  );
};

export default CalendarPage;