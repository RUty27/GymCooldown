import { useCallback, useEffect, useMemo, useState } from 'react';
import { EXERCISES } from '../data/exercises';
import { clampToNow } from '../lib/datetime';
import { emptyData, loadData, saveData } from '../lib/storage';
import type { AppData, Exercise, LoggedExercise, Session, Unit } from '../types';

export interface Store {
  data: AppData;
  exercises: Exercise[];
  lookup: (id: string) => Exercise | undefined;
  addSession: (exercises: LoggedExercise[], notes?: string, date?: string) => void;
  updateSession: (id: string, patch: Partial<Omit<Session, 'id'>>) => void;
  deleteSession: (id: string) => void;
  setUnit: (unit: Unit) => void;
  replaceAll: (data: AppData) => void;
  clearAll: () => void;
  /** The most recent logged instance of an exercise, for showing last time's numbers. */
  lastPerformance: (exerciseId: string) => { session: Session; logged: LoggedExercise } | null;
}

export function useSessions(): Store {
  const [data, setData] = useState<AppData>(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const exercises = useMemo(
    () =>
      [...EXERCISES, ...data.customExercises].sort((a, b) => a.name.localeCompare(b.name)),
    [data.customExercises],
  );

  const byId = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises],
  );

  const lookup = useCallback((id: string) => byId.get(id), [byId]);

  const addSession = useCallback(
    (loggedExercises: LoggedExercise[], notes?: string, date?: string) => {
      const session: Session = {
        id: `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
        // Backdating is allowed, but never into the future: the volume and
        // recovery calculations skip sessions dated after now, so one would
        // save and then be invisible on the body map.
        date: clampToNow(date ?? new Date().toISOString()),
        exercises: loggedExercises,
        notes,
      };
      setData((d) => ({ ...d, sessions: [session, ...d.sessions] }));
    },
    [],
  );

  const updateSession = useCallback((id: string, patch: Partial<Omit<Session, 'id'>>) => {
    setData((d) => ({
      ...d,
      sessions: d.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  const deleteSession = useCallback((id: string) => {
    setData((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) }));
  }, []);

  const setUnit = useCallback((unit: Unit) => {
    setData((d) => ({ ...d, settings: { ...d.settings, unit } }));
  }, []);

  const replaceAll = useCallback((next: AppData) => setData(next), []);
  const clearAll = useCallback(() => setData(emptyData()), []);

  const lastPerformance = useCallback(
    (exerciseId: string) => {
      const sorted = [...data.sessions].sort(
        (a, b) => Date.parse(b.date) - Date.parse(a.date),
      );
      for (const s of sorted) {
        const logged = s.exercises.find((e) => e.exerciseId === exerciseId && e.sets.length > 0);
        if (logged) return { session: s, logged };
      }
      return null;
    },
    [data.sessions],
  );

  return {
    data,
    exercises,
    lookup,
    addSession,
    updateSession,
    deleteSession,
    setUnit,
    replaceAll,
    clearAll,
    lastPerformance,
  };
}
