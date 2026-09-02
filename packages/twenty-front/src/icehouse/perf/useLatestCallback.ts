import { useCallback, useLayoutEffect, useRef } from 'react';

// A function whose identity never changes but which always calls the latest
// `callback`. Lets the table-level context values (RecordTableContext,
// RecordTableBodyContext, RecordTableUpdateContext) be memoised without
// pinning stale closures: the wrapped callbacks capture atoms and metadata
// that change between renders, while every cell only needs a stable handle.
export const useLatestCallback = <TArgs extends unknown[], TResult>(
  callback: (...args: TArgs) => TResult,
): ((...args: TArgs) => TResult) => {
  // Not state: the ref only carries the latest closure to a stable wrapper.
  // oxlint-disable-next-line twenty/no-state-useref
  const callbackRef = useRef(callback);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args: TArgs) => callbackRef.current(...args), []);
};
