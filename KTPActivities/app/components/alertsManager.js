const listeners = new Set();

// Lets the Alerts list refresh after the add-alert modal completes a write.
export const notifyAlertsChanged = () => {
  listeners.forEach((listener) => listener());
};

export const subscribeToAlertsChanged = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
