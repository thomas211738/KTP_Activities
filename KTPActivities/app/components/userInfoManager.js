let userInfo = null;
const userInfoListeners = new Set();

export const getUserInfo = () => userInfo;

export const setUserInfo = (newUserInfo) => {
  userInfo = newUserInfo;
  userInfoListeners.forEach((listener) => listener(userInfo));
};

export const subscribeToUserInfo = (listener) => {
  userInfoListeners.add(listener);
  return () => {
    userInfoListeners.delete(listener);
  };
};
