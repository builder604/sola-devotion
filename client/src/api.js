const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}

// Bible
export const getTranslations = () => request('/bible/translations');
export const getPassage = (ref, translation) =>
  request(`/bible/passage?ref=${encodeURIComponent(ref)}&translation=${translation}`);

// Devotions
export const getTodayDevotion = () => request('/devotions/today');
export const getDevotion = (date) => request(`/devotions/${date}`);
export const getDevotions = (limit = 30) => request(`/devotions?limit=${limit}`);
export const generateDevotion = (passage, date, translation) =>
  request('/devotions/generate', {
    method: 'POST',
    body: JSON.stringify({ passage, date, translation }),
  });
export const deleteDevotion = (id) =>
  request(`/devotions/${id}`, { method: 'DELETE' });

// Prayers
export const getPrayers = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return request(`/prayers?${params}`);
};
export const getPrayerStats = () => request('/prayers/stats');
export const getPrayer = (id) => request(`/prayers/${id}`);
export const createPrayer = (prayer) =>
  request('/prayers', { method: 'POST', body: JSON.stringify(prayer) });
export const updatePrayer = (id, updates) =>
  request(`/prayers/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
export const deletePrayer = (id) =>
  request(`/prayers/${id}`, { method: 'DELETE' });

// Reading Plan
export const getReadingPlan = () => request('/reading-plan');
export const getNextPassage = () => request('/reading-plan/next');
export const addToReadingPlan = (passage) =>
  request('/reading-plan', { method: 'POST', body: JSON.stringify(passage) });
export const addBulkPassages = (passages) =>
  request('/reading-plan/bulk', { method: 'POST', body: JSON.stringify({ passages }) });
export const updateReadingEntry = (id, updates) =>
  request(`/reading-plan/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
export const deleteReadingEntry = (id) =>
  request(`/reading-plan/${id}`, { method: 'DELETE' });

// Push Notifications
export const getVapidKey = () => request('/push/vapid-key');
export const subscribePush = (subscription) =>
  request('/push/subscribe', { method: 'POST', body: JSON.stringify(subscription) });
export const unsubscribePush = (endpoint) =>
  request('/push/unsubscribe', { method: 'DELETE', body: JSON.stringify({ endpoint }) });
export const testPush = () => request('/push/test', { method: 'POST' });

// Settings
export const getSettings = () => request('/settings');
export const updateSettings = (settings) =>
  request('/settings', { method: 'PUT', body: JSON.stringify(settings) });
