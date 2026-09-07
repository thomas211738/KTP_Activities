let allUsersInfo = null;
const listeners = new Set();

export const getAllUsersInfo = () => allUsersInfo;

export const setAllUsersInfo = (newAllUsersInfo) => {
  // Keep archived users (Position -1) out of any stale or non-production list
  // response as an additional client-side safeguard.
  allUsersInfo = Array.isArray(newAllUsersInfo)
    ? newAllUsersInfo.filter((user) => Number(user?.Position) >= 0)
    : [];
  listeners.forEach((listener) => listener(allUsersInfo));
};

export const subscribeToAllUsersInfo = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
