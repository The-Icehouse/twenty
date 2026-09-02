import { useCallback, useSyncExternalStore } from 'react';

import {
  type AvatarImageStatus,
  getAvatarImageStatus,
  subscribeToAvatarImageStatus,
} from '@ui/data-display/Avatar/internal/avatarImageStatusStore';

const subscribeToNothing = () => () => undefined;

// Icehouse fork: the load status of an avatar image URL, shared across every Avatar that
// shows it. Re-subscribes when the URL changes, so a recycled table row picks up the
// cached verdict for its new record instead of probing again.
export const useAvatarImageStatus = (
  avatarImageURI: string | null,
): AvatarImageStatus | null => {
  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      avatarImageURI === null
        ? subscribeToNothing()
        : subscribeToAvatarImageStatus(avatarImageURI, onStoreChange),
    [avatarImageURI],
  );

  const getSnapshot = useCallback(
    () =>
      avatarImageURI === null ? null : getAvatarImageStatus(avatarImageURI),
    [avatarImageURI],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
