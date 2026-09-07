let allUsersInfo = null;
const listeners = new Set();

export const getAllUsersInfo = () => allUsersInfo;

export const setAllUsersInfo = (newAllUsersInfo) => {
  allUsersInfo = Array.isArray(newAllUsersInfo) ? newAllUsersInfo : [];
  listeners.forEach((listener) => listener(allUsersInfo));
};

export const subscribeToAllUsersInfo = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
