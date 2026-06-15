export const createUserStorageKey = (userId: string, key: string) => `elha:${userId}:${key}`;

const LEGACY_MOCK_AVATAR_KEY = "elha_user_avatar_mock-user-id";

export const getUserStorageItem = (userId: string, key: string) => {
  if (!userId) return null;

  const storageKey = createUserStorageKey(userId, key);
  const value = localStorage.getItem(storageKey);

  if (value !== null) {
    return value;
  }

  if (key === "avatar" && userId === "mock-user-id") {
    return localStorage.getItem(LEGACY_MOCK_AVATAR_KEY);
  }

  return null;
};

export const setUserStorageItem = (userId: string, key: string, value: string) => {
  if (!userId) return;

  localStorage.setItem(createUserStorageKey(userId, key), value);

  if (key === "avatar" && userId === "mock-user-id") {
    localStorage.setItem(LEGACY_MOCK_AVATAR_KEY, value);
  }
};

export const removeUserStorageItem = (userId: string, key: string) => {
  if (!userId) return;

  localStorage.removeItem(createUserStorageKey(userId, key));

  if (key === "avatar" && userId === "mock-user-id") {
    localStorage.removeItem(LEGACY_MOCK_AVATAR_KEY);
  }
};