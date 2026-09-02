import { useCallback, useEffect, useState } from 'react';
import { deletePhoto, getPhoto, savePhoto } from '../lib/photos';

/** Loads an exercise's reference photo as an object URL, revoking it on change. */
export function useExercisePhoto(exerciseId: string) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const blob = await getPhoto(exerciseId);
      setUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return blob ? URL.createObjectURL(blob) : null;
      });
    } catch {
      // A blocked or unavailable IndexedDB should not break logging.
      setUrl(null);
    }
  }, [exerciseId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(
    () => () => {
      setUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    },
    [],
  );

  const save = useCallback(
    async (file: Blob) => {
      setBusy(true);
      setError(null);
      try {
        await savePhoto(exerciseId, file);
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save that photo');
      } finally {
        setBusy(false);
      }
    },
    [exerciseId, load],
  );

  const remove = useCallback(async () => {
    await deletePhoto(exerciseId);
    await load();
  }, [exerciseId, load]);

  return { url, busy, error, save, remove };
}
