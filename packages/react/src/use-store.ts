import type { Store } from '@my-cashier/utils';
import { useSyncExternalStore } from 'react';

export const useStore = <T>(store: Store<T>): T => {
  return useSyncExternalStore(store.subscribe.bind(store), store.getState.bind(store));
};
