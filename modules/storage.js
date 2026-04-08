const STORAGE_KEYS = {
  SETTINGS: 'startpageSettings',
  TODOS: 'startpageTodos',
  WEATHER: 'weatherCache'
}


//ANCHOR - Settings
export function loadSettingsFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse settings', e);
    return null;
  }
}

export function saveSettingsToStorage(settings) {
  localStorage.setItem(
    STORAGE_KEYS.SETTINGS,
    JSON.stringify(settings)
  );
}


//ANCHOR - ToDos
export function loadTodosFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEYS.TODOS);
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse todos', e);
    return [];
  }
}

export function saveTodosToStorage(todos) {
  localStorage.setItem(
    STORAGE_KEYS.TODOS,
    JSON.stringify(todos)
  );
}


//ANCHOR - Weather
export function loadWeatherCacheFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEYS.WEATHER);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveWeatherCacheToStorage(data) {
  localStorage.setItem(
    STORAGE_KEYS.WEATHER,
    JSON.stringify(data)
  );
}

export function clearWeatherCacheFromStorage() {
  localStorage.removeItem(STORAGE_KEYS.WEATHER);
}