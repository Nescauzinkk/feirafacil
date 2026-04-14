import { useSyncExternalStore } from 'react';
import { subscribe, getData } from '@/lib/store';
import type { AppData } from '@/types';

export function useStore(): AppData {
  return useSyncExternalStore(subscribe, getData, getData);
}
