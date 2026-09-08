import { useCallback, useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useToggle(initial = false) {
  const [open, setOpen] = useState(initial);
  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  return { open, show, hide, toggle, setOpen };
}

export function useTable<T extends { id: string }>(fetchFn: () => Promise<T[]>) {
  const [list, setList] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFn();
      setList(data);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    void load();
  }, [load]);

  return { list, loading, page, setPage, pageSize, setPageSize, keyword, setKeyword, reload: load };
}
