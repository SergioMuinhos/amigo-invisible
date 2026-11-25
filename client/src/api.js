const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function request(path, options = {}, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status}`);
  }

  return res.json();
}

export const api = {
  verifyAuth: (token) => request('/auth/verify', { method: 'POST' }, token),
  getGroups: (token) => request('/groups', {}, token),
  createGroup: (token, name) =>
    request('/groups', { method: 'POST', body: JSON.stringify({ name }) }, token),
  joinGroup: (token, code) =>
    request(
      '/groups/join',
      { method: 'POST', body: JSON.stringify({ code }) },
      token
    ),
  getGroup: (token, id) => request(`/groups/${id}`, {}, token),
  assignGroup: (token, id) =>
    request(`/groups/${id}/assign`, { method: 'POST' }, token),
  getMyAssignment: (token, id) =>
    request(`/groups/${id}/my-assignment`, {}, token),
};
