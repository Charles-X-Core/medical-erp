import { createContext, useContext, useState, useEffect } from 'react';
import { getUnitSystem, setUnitSystem } from '../utils/units';

const UnitContext = createContext(null);

export function UnitProvider({ children }) {
  const [system, setSystem] = useState(() => getUnitSystem());

  useEffect(() => {
    setUnitSystem(system);
  }, [system]);

  const toggle = () => setSystem((s) => (s === 'metric' ? 'us' : 'metric'));

  return (
    <UnitContext.Provider value={{ system, setSystem, toggle }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnitSystem() {
  const ctx = useContext(UnitContext);
  return ctx || { system: getUnitSystem(), setSystem: setUnitSystem, toggle: () => setUnitSystem(getUnitSystem() === 'metric' ? 'us' : 'metric') };
}
