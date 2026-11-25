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
  checkEmail: (email) =>
    request('/auth/check-email', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyAuth: (token, extra = {}) =>
    request('/auth/verify', { method: 'POST', body: JSON.stringify(extra) }, token),
  updateProfile: (token, { firstName, lastName, displayName }) =>
    request(
      '/auth/profile',
      { method: 'PUT', body: JSON.stringify({ firstName, lastName, displayName }) },
      token
    ),
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
  addMember: (token, id, { name, email }) =>
    request(
      `/groups/${id}/members`,
      { method: 'POST', body: JSON.stringify({ name, email }) },
      token
    ),
  removeMember: (token, groupId, userId) =>
    request(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }, token),
  assignGroup: (token, id) =>
    request(`/groups/${id}/assign`, { method: 'POST' }, token),
  resetGroup: (token, id) =>
    request(`/groups/${id}/reset`, { method: 'POST' }, token),
  validateAssignment: (token, id, action) =>
    request(`/groups/${id}/validate`, { method: 'POST', body: JSON.stringify({ action }) }, token),
  getMyAssignment: (token, id) =>
    request(`/groups/${id}/my-assignment`, {}, token),
};
