import { useState, useEffect } from 'react';
import { registerUser, verifyOtp, loginUser, fetchJobs, fetchUsers, fetchAllUsers, createJob, hireJob } from './api';

const initialAuth = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'hirer',
  otpCode: '',
};

const initialJobForm = {
  title: '',
  description: '',
  category: '',
  location: '',
  budget: '',
};

export default function App() {
  const [screen, setScreen] = useState('landing');
  const [auth, setAuth] = useState(initialAuth);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [jobForm, setJobForm] = useState(initialJobForm);
  const [workerSearch, setWorkerSearch] = useState('');
  const [workers, setWorkers] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setScreen('dashboard');
        loadJobs();
        await loadWorkers(storedToken);
        if (parsedUser.role === 'admin') {
          await loadAllUsers(storedToken);
        }
      }
      setIsReady(true);
    };
    restoreSession();
  }, []);

  useEffect(() => {
    if (screen === 'dashboard') {
      loadJobs();
      loadWorkers();
      if (user?.role === 'admin') loadAllUsers();
    }
  }, [screen]);

  const setField = (field, value) => setAuth((prev) => ({ ...prev, [field]: value }));
  const setJobField = (field, value) => setJobForm((prev) => ({ ...prev, [field]: value }));

  const showMessage = (text) => setMessage(text);

  const handleRegister = async () => {
    try {
      await registerUser({
        name: auth.name,
        email: auth.email,
        password: auth.password,
        phone: auth.phone,
        role: auth.role,
      });
      setScreen('verify');
      showMessage('OTP sent to email and phone.');
    } catch (error) {
      showMessage(error.message);
    }
  };

  const handleVerify = async () => {
    try {
      const data = await verifyOtp({ email: auth.email, otpCode: auth.otpCode });
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setScreen('dashboard');
      showMessage('Registration complete.');
    } catch (error) {
      showMessage(error.message);
    }
  };

  const handleLogin = async () => {
    try {
      const data = await loginUser({ email: auth.email, password: auth.password });
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setScreen('dashboard');
      showMessage('Login successful.');
    } catch (error) {
      showMessage(error.message);
    }
  };

  const loadJobs = async () => {
    try {
      const data = await fetchJobs(search);
      setJobs(data);
    } catch (error) {
      showMessage(error.message);
    }
  };

  const loadWorkers = async () => {
    try {
      if (!token) return;
      const data = await fetchUsers(workerSearch, 'worker', token);
      setWorkers(data);
    } catch (error) {
      showMessage(error.message);
    }
  };

  const loadAllUsers = async () => {
    try {
      if (!token) return;
      const data = await fetchAllUsers(token);
      setUsers(data);
    } catch (error) {
      showMessage(error.message);
    }
  };

  const handleCreateJob = async () => {
    try {
      await createJob({
        title: jobForm.title,
        description: jobForm.description,
        category: jobForm.category,
        location: jobForm.location,
        budget: Number(jobForm.budget) || 0,
      }, token);
      setJobForm(initialJobForm);
      loadJobs();
      showMessage('Job posted successfully.');
    } catch (error) {
      showMessage(error.message);
    }
  };

  const handleHire = async (jobId) => {
    try {
      await hireJob(jobId, token);
      loadJobs();
      showMessage('Worker hired / job accepted.');
    } catch (error) {
      showMessage(error.message);
    }
  };

  const handleLogout = () => {
    setScreen('landing');
    setAuth(initialAuth);
    setUser(null);
    setToken('');
    setJobs([]);
    setSearch('');
    setJobForm(initialJobForm);
    setWorkerSearch('');
    setWorkers([]);
    setUsers([]);
    setMessage('');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (!isReady) {
    return (
      <main className="page-shell">
        <section className="hero-section">
          <p>Loading...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      {!user && (
        <section className="hero-section">
          <div>
            <h1>VerifiedSeva</h1>
            <p>Find home workers or post jobs with OTP-secured registration.</p>
            <div className="button-row">
              <button className="button fill" onClick={() => setScreen('register')}>Register</button>
              <button className="button outline" onClick={() => setScreen('login')}>Login</button>
            </div>
          </div>
          <div className="hero-card">
            <h2>Search work or hire trusted workers</h2>
            <p>Carpenters, cleaners, electricians, painters, and more.</p>
          </div>
        </section>
      )}

      {(screen === 'register' || screen === 'login' || screen === 'verify') && (
        <section className="auth-section">
          <div className="auth-card">
            <h2>{screen === 'login' ? 'Login' : screen === 'verify' ? 'Verify OTP' : 'Register'}</h2>
            {screen !== 'login' && screen !== 'verify' && (
              <>
                <label>Name</label>
                <input value={auth.name} onChange={(e) => setField('name', e.target.value)} />
                <label>Phone</label>
                <input value={auth.phone} onChange={(e) => setField('phone', e.target.value)} />
                <label>Role</label>
                <select value={auth.role} onChange={(e) => setField('role', e.target.value)}>
                  <option value="hirer">Hirer</option>
                  <option value="worker">Worker</option>
                </select>
              </>
            )}
            <label>Email</label>
            <input value={auth.email} onChange={(e) => setField('email', e.target.value)} />
            <label>Password</label>
            <input type="password" value={auth.password} onChange={(e) => setField('password', e.target.value)} />
            {screen === 'verify' && (
              <>
                <label>OTP Code</label>
                <input value={auth.otpCode} onChange={(e) => setField('otpCode', e.target.value)} />
              </>
            )}
            <button className="button fill" onClick={screen === 'login' ? handleLogin : screen === 'verify' ? handleVerify : handleRegister}>
              {screen === 'login' ? 'Login' : screen === 'verify' ? 'Verify OTP' : 'Register'}
            </button>
            <button className="button outline" onClick={() => setScreen(screen === 'login' ? 'register' : 'login')}>
              {screen === 'login' ? 'New user? Register' : 'Already registered? Login'}
            </button>
            {message && <p className="info-text">{message}</p>}
          </div>
        </section>
      )}

      {user && (
        <section className="dashboard-shell">
          <div className="dashboard-header">
            <div>
              <h1>Welcome, {user.name}</h1>
              <p>Role: {user.role}</p>
            </div>
            <button className="button outline" onClick={handleLogout}>Logout</button>
          </div>
          {message && <p className="info-text">{message}</p>}
          <div className="dashboard-grid">
            {user.role === 'hirer' && (
              <div className="panel card">
                <h3>Post a Job</h3>
                <label>Title</label>
                <input value={jobForm.title} onChange={(e) => setJobField('title', e.target.value)} />
                <label>Description</label>
                <textarea value={jobForm.description} onChange={(e) => setJobField('description', e.target.value)} />
                <label>Category</label>
                <input value={jobForm.category} onChange={(e) => setJobField('category', e.target.value)} />
                <label>Location</label>
                <input value={jobForm.location} onChange={(e) => setJobField('location', e.target.value)} />
                <label>Budget</label>
                <input value={jobForm.budget} onChange={(e) => setJobField('budget', e.target.value)} />
                <button className="button fill" onClick={handleCreateJob}>Post Job</button>
              </div>
            )}
            <div className="panel card">
              <h3>Search jobs</h3>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or location" />
              <button className="button fill" onClick={loadJobs}>Search</button>
              <div className="job-list">
                {jobs.length === 0 ? (
                  <p>No open jobs available.</p>
                ) : (
                  jobs.map((job) => (
                    <div key={job._id} className="job-item">
                      <h4>{job.title}</h4>
                      <p>{job.description}</p>
                      <small>{job.category} • {job.location} • Budget: {job.budget || 'N/A'}</small>
                      <button className="button outline" onClick={() => handleHire(job._id)}>Take this job</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="dashboard-grid">
            <div className="panel card">
              <h3>Search Workers</h3>
              <input value={workerSearch} onChange={(e) => setWorkerSearch(e.target.value)} placeholder="Search by name" />
              <button className="button fill" onClick={loadWorkers}>Search Workers</button>
              {workers.length === 0 ? (
                <p>No workers found.</p>
              ) : (
                workers.map((worker) => (
                  <div key={worker._id} className="job-item">
                    <h4>{worker.name}</h4>
                    <p>{worker.email}</p>
                    <small>{worker.phone} • {worker.role}</small>
                  </div>
                ))
              )}
            </div>
            {user.role === 'admin' && (
              <div className="panel card">
                <h3>Admin User Management</h3>
                {users.length === 0 ? (
                  <p>No users found.</p>
                ) : (
                  users.map((userItem) => (
                    <div key={userItem._id} className="job-item">
                      <h4>{userItem.name}</h4>
                      <p>{userItem.email}</p>
                      <small>{userItem.phone} • {userItem.role} • Verified: {userItem.isVerified ? 'Yes' : 'No'}</small>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
