import { useEffect, useState } from 'react';

export const useDebouncedValue = <T,>(value: T, delay = 300): T => {
  const [settled, setSettled] = useState(value);
  useEffect(() => { const timer = setTimeout(() => setSettled(value), delay); return () => clearTimeout(timer); }, [value, delay]);
  return settled;
};
