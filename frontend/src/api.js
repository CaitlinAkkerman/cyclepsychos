const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function apiCall(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  return response;
}

export { API_URL };