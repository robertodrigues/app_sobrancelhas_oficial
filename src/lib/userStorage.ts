export const createUserStorageKey = (userId: string, key: string) => `elha:${userId}:${key}`;

export const getUserStorageItem = (userId: string, key: string) => {
  if (!userId) return null;
  return localStorage.getItem(createUserStorageKey(userId, key));
};

export const setUserStorageItem = (userId: string, key: string, value: string) => {
  if (!userId) return;
  localStorage.setItem(createUserStorageKey(userId, key), value);
};

export const removeUserStorageItem = (userId: string, key: string) => {
  if (!userId) return;
  localStorage.removeItem(createUserStorageKey(userId, key));
};