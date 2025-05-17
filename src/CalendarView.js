import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import { db } from "./firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

function CalendarView() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventsOnDate, setEventsOnDate] = useState([]);

  useEffect(() => {
    async function fetchEvents() {
      const q = query(collection(db, "events"), orderBy("date", "asc"));
      const querySnapshot = await getDocs(q);
      const eventsArr = [];
      querySnapshot.forEach((doc) => {
        eventsArr.push({ id: doc.id, ...doc.data() });
      });
      setEvents(eventsArr);
    }
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!events.length) return;
    const filtered = events.filter(ev => {
      const evDate = new Date(ev.date.seconds ? ev.date.seconds * 1000 : ev.date);
      return (
        evDate.getFullYear() === selectedDate.getFullYear() &&
        evDate.getMonth() === selectedDate.getMonth() &&
        evDate.getDate() === selectedDate.getDate()
      );
    });
    setEventsOnDate(filtered);
  }, [selectedDate, events]);

  // Highlight tiles with events
  const tileContent = ({date, view}) => {
    if (view === "month") {
      const hasEvent = events.some(ev => {
        const evDate = new Date(ev.date.seconds ? ev.date.seconds * 1000 : ev.date);
        return (
          evDate.getFullYear() === date.getFullYear() &&
          evDate.getMonth() === date.getMonth() &&
          evDate.getDate() === date.getDate()
        );
      });
      return hasEvent ? <div style={{background: "#ffd700", borderRadius: "50%", width: 8, height: 8, margin: "0 auto"}}></div> : null;
    }
    return null;
  };

  return (
    <div>
      <h2>Event Calendar</h2>
      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
        tileContent={tileContent}
      />
      <h3>Events on {selectedDate.toLocaleDateString()}:</h3>
      {eventsOnDate.length === 0 ? (
        <p>No events on this date.</p>
      ) : (
        <ul>
          {eventsOnDate.map(ev => (
            <li key={ev.id}>
              <strong>{ev.title}</strong><br />
              {ev.description}<br />
              Time: {new Date(ev.date.seconds ? ev.date.seconds * 1000 : ev.date).toLocaleTimeString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CalendarView;