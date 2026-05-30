const BASE_URL = 'http://localhost:5000/api';

async function request(path, method = 'GET', body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export async function registerUser(payload) {
  return request('/auth/register', 'POST', payload);
}

export async function verifyOtp(payload) {
  return request('/auth/verify-otp', 'POST', payload);
}

export async function loginUser(payload) {
  return request('/auth/login', 'POST', payload);
}

export async function fetchJobs(query = '') {
  const queryString = query ? `?search=${encodeURIComponent(query)}` : '';
  return request(`/jobs${queryString}`);
}

export async function fetchUsers(query = '', role = 'worker', token) {
  const queryString = `?query=${encodeURIComponent(query)}&role=${encodeURIComponent(role)}`;
  return request(`/users/search${queryString}`, 'GET', null, token);
}

export async function fetchAllUsers(token) {
  return request('/users', 'GET', null, token);
}

export async function createJob(payload, token) {
  return request('/jobs', 'POST', payload, token);
}

export async function hireJob(jobId, token) {
  return request(`/jobs/${jobId}/hire`, 'POST', null, token);
}
