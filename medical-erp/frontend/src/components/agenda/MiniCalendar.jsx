import { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, Search } from 'lucide-react';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_CORTOS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

function generateMonthGrid(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();
  const grid = [];

  for (let i = 0; i < startOffset; i++) {
    const d = new Date(year, month, -startOffset + i + 1);
    grid.push({ date: d, num: d.getDate(), currentMonth: false });
  }
  for (let day = 1; day <= totalDays; day++) {
    grid.push({ date: new Date(year, month, day), num: day, currentMonth: true });
  }
  const remaining = 42 - grid.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    grid.push({ date: d, num: d.getDate(), currentMonth: false });
  }
  return grid;
}

function formatDateKey(date) {
  return date.toISOString().split('T')[0];
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function parseDateSearch(input) {
  if (!input || input.trim().length < 2) return null;
  const lower = input.trim().toLowerCase();
  const today = new Date();

  if (lower === 'hoy' || lower === 'today') return new Date();
  if (lower === 'ayer' || lower === 'yesterday') { const d = new Date(); d.setDate(d.getDate() - 1); return d; }
  if (lower === 'mañana' || lower === 'tomorrow') { const d = new Date(); d.setDate(d.getDate() + 1); return d; }

  const dayNames = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 0 };
  for (const [name, dow] of Object.entries(dayNames)) {
    if (lower.includes(name) || lower.includes(name + 's')) {
      const currentDow = today.getDay();
      let diff = dow - currentDow;
      if (lower.includes('proximo') || lower.includes('próximo') || lower.includes('siguiente')) {
        diff = diff <= 0 ? diff + 7 : diff;
      } else {
        diff = diff <= 0 ? diff + 7 : diff;
      }
      const d = new Date(today);
      d.setDate(d.getDate() + diff);
      return d;
    }
  }

  const mesMap = { enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11 };
  const matchDdMm = lower.match(/(\d{1,2})\s+(de\s+)?(\w+)/);
  if (matchDdMm) {
    const dayNum = parseInt(matchDdMm[1], 10);
    const monthStr = matchDdMm[3];
    if (mesMap[monthStr] !== undefined && dayNum >= 1 && dayNum <= 31) {
      const d = new Date(today.getFullYear(), mesMap[monthStr], dayNum);
      return d;
    }
  }

  const matchMmDd = lower.match(/(\w+)\s+(\d{1,2})/);
  if (matchMmDd) {
    const monthStr = matchMmDd[1];
    const dayNum = parseInt(matchMmDd[2], 10);
    if (mesMap[monthStr] !== undefined && dayNum >= 1 && dayNum <= 31) {
      const d = new Date(today.getFullYear(), mesMap[monthStr], dayNum);
      return d;
    }
  }

  const matchIso = input.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (matchIso) {
    return new Date(parseInt(matchIso[1]), parseInt(matchIso[2]) - 1, parseInt(matchIso[3]));
  }

  return null;
}

export default function MiniCalendar({ currentDate, onDateSelect, weekStart }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(currentDate);
  const [searchInput, setSearchInput] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setViewDate(currentDate);
  }, [currentDate]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const monthGrid = generateMonthGrid(viewDate);

  const navigateMonth = useCallback((delta) => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  }, []);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      const result = parseDateSearch(searchInput);
      if (result) {
        setSearchResult(result);
        onDateSelect(result);
        setIsOpen(false);
        setSearchInput('');
        setSearchResult(null);
      }
    }
  };

  const handleDayClick = (day) => {
    onDateSelect(day.date);
    setIsOpen(false);
  };

  const dateLabel = currentDate
    ? `${currentDate.getDate()} de ${MESES[currentDate.getMonth()]}`
    : 'Seleccionar fecha';

  return (
    <div className="mini-calendar" ref={dropdownRef}>
      <button className="mini-calendar__trigger" onClick={() => setIsOpen(!isOpen)}>
        <Calendar size={16} />
        <span>{dateLabel}</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isOpen && (
        <div className="mini-calendar__dropdown">
          <div className="mini-calendar__header">
            <button className="mini-calendar__nav-btn" onClick={() => navigateMonth(-1)}>
              <ChevronLeft size={16} />
            </button>
            <span className="mini-calendar__month-label">
              {MESES[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button className="mini-calendar__nav-btn" onClick={() => navigateMonth(1)}>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mini-calendar__grid">
            {DIAS_CORTOS.map((d) => (
              <div key={d} className="mini-calendar__day-label">{d}</div>
            ))}
            {monthGrid.map((day, i) => {
              const isToday = isSameDay(day.date, new Date());
              const isSelected = isSameDay(day.date, currentDate);
              const inWeek = weekStart && day.date >= weekStart && day.date <= new Date(weekStart.getTime() + 6 * 86400000);
              return (
                <button
                  key={i}
                  className={`mini-calendar__day ${!day.currentMonth ? '--other-month' : ''} ${isToday ? '--today' : ''} ${isSelected ? '--selected' : ''} ${inWeek ? '--in-week' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  {day.num}
                </button>
              );
            })}
          </div>

          <div className="mini-calendar__search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Buscar fecha..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronUp({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}
