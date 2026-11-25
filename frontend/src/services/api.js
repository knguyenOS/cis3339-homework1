/**
 * Thin HTTP client for the Express REST API. All requests go to the same
 * origin (`/api/...`); in development Vite proxies them to port 3000.
 */

export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

let unavailableHandler = null;

/** Register a callback that runs whenever the server reports the database is unavailable (503). */
export function onServiceUnavailable(handler) {
  unavailableHandler = handler;
}

async function request(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Make sure the backend is running, then try again.');
  }

  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    if (response.status === 503 && unavailableHandler) unavailableHandler();
    throw new ApiError(data?.error || `Request failed with status ${response.status}.`, response.status, data?.details || null);
  }
  return data;
}

const enc = encodeURIComponent;

export const api = {
  health: async () => {
    try {
      const res = await fetch('/api/health', { headers: { Accept: 'application/json' } });
      return await res.json();
    } catch {
      return { status: 'offline', database: 'unavailable' };
    }
  },

  students: {
    list: (query = '') => request(`/students${query ? `?q=${enc(query)}` : ''}`),
    get: (studentId) => request(`/students/${enc(studentId)}`),
    create: (student) => request('/students', { method: 'POST', body: student }),
    remove: (studentId) => request(`/students/${enc(studentId)}`, { method: 'DELETE' }),
  },

  courses: {
    list: () => request('/courses'),
    roster: (courseId) => request(`/courses/${enc(courseId)}/students`),
    create: (course) => request('/courses', { method: 'POST', body: course }),
    remove: (courseId) => request(`/courses/${enc(courseId)}`, { method: 'DELETE' }),
  },

  enrollments: {
    list: () => request('/enrollments'),
    create: (studentId, courseId) => request('/enrollments', { method: 'POST', body: { studentId, courseId } }),
    remove: (enrollmentId) => request(`/enrollments/${enc(enrollmentId)}`, { method: 'DELETE' }),
  },
};
