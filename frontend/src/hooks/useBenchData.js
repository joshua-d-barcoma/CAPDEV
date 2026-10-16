import { useContext } from 'react';
import { BenchDataContext } from './BenchDataContext.js';

export function useBenchData() {
  const context = useContext(BenchDataContext);
  if (!context) {
    throw new Error('useBenchData must be used inside BenchDataProvider.');
  }
  return context;
}
