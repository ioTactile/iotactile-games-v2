const STORAGE_KEY = 'dice_guest_id';

/**
 * Return a persistent guest UUID (localStorage).
 * Used to play as a guest without an account.
 */
export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
