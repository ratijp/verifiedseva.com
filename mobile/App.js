import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  registerUser,
  verifyOtp,
  loginUser,
  fetchJobs,
  fetchUsers,
  fetchAllUsers,
  createJob,
  hireJob,
} from './api';

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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        if (storedToken && storedUser) {
          const savedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(savedUser);
          setScreen('dashboard');
          await loadJobs(storedToken);
          await loadWorkers(storedToken);
          if (savedUser.role === 'admin') {
            await loadAllUsers(storedToken);
          }
        }
      } catch (error) {
        console.warn('Failed to restore session', error);
      } finally {
        setIsReady(true);
      }
    }

    restoreSession();
  }, []);

  const handleChange = (key, value) => setAuth((prev) => ({ ...prev, [key]: value }));
  const handleJobChange = (key, value) => setJobForm((prev) => ({ ...prev, [key]: value }));

  const showError = (error) => {
    const message = error?.message || 'Something went wrong';
    Alert.alert('Error', message);
  };

  const onRegister = async () => {
    try {
      await registerUser({
        name: auth.name,
        email: auth.email,
        password: auth.password,
        phone: auth.phone,
        role: auth.role,
      });
      setScreen('verify');
      Alert.alert('Success', 'OTP sent to your email and phone.');
    } catch (error) {
      showError(error);
    }
  };

  const onVerify = async () => {
    try {
      const data = await verifyOtp({ email: auth.email, otpCode: auth.otpCode });
      setUser(data.user);
      setToken(data.token);
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      setScreen('dashboard');
      await loadJobs(data.token);
      await loadWorkers(data.token);
      if (data.user.role === 'admin') await loadAllUsers(data.token);
    } catch (error) {
      showError(error);
    }
  };

  const onLogin = async () => {
    try {
      const data = await loginUser({ email: auth.email, password: auth.password });
      setUser(data.user);
      setToken(data.token);
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      setScreen('dashboard');
      await loadJobs(data.token);
      await loadWorkers(data.token);
      if (data.user.role === 'admin') await loadAllUsers(data.token);
    } catch (error) {
      showError(error);
    }
  };

  const loadJobs = async (authToken) => {
    try {
      const data = await fetchJobs(search, authToken);
      setJobs(data);
    } catch (error) {
      showError(error);
    }
  };

  const loadWorkers = async (authToken = token) => {
    try {
      const data = await fetchUsers(workerSearch, 'worker', authToken);
      setWorkers(data);
    } catch (error) {
      showError(error);
    }
  };

  const loadAllUsers = async (authToken = token) => {
    try {
      const data = await fetchAllUsers(authToken);
      setUsers(data);
    } catch (error) {
      showError(error);
    }
  };

  const onCreateJob = async () => {
    try {
      await createJob({
        title: jobForm.title,
        description: jobForm.description,
        category: jobForm.category,
        location: jobForm.location,
        budget: Number(jobForm.budget),
      }, token);
      setJobForm(initialJobForm);
      await loadJobs(token);
      Alert.alert('Success', 'Job posted successfully.');
    } catch (error) {
      showError(error);
    }
  };

  const onHire = async (jobId) => {
    try {
      await hireJob(jobId, token);
      await loadJobs(token);
      Alert.alert('Success', 'Worker hired / job accepted.');
    } catch (error) {
      showError(error);
    }
  };

  const onLogout = async () => {
    setScreen('landing');
    setAuth(initialAuth);
    setUser(null);
    setToken('');
    setJobs([]);
    setSearch('');
    setWorkerSearch('');
    setWorkers([]);
    setUsers([]);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  };

  if (!isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const authForm = (
    <View style={styles.formCard}>
      <Text style={styles.sectionTitle}>Register or Login</Text>
      {(screen === 'register' || screen === 'verify') && (
        <>
          <TextInput style={styles.input} placeholder="Name" value={auth.name} onChangeText={(text) => handleChange('name', text)} />
          <TextInput style={styles.input} placeholder="Phone" value={auth.phone} onChangeText={(text) => handleChange('phone', text)} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Role (hirer or worker)" value={auth.role} onChangeText={(text) => handleChange('role', text)} />
        </>
      )}
      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" value={auth.email} onChangeText={(text) => handleChange('email', text)} keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={auth.password} onChangeText={(text) => handleChange('password', text)} />
      {screen === 'verify' && (
        <TextInput style={styles.input} placeholder="OTP Code" value={auth.otpCode} onChangeText={(text) => handleChange('otpCode', text)} keyboardType="numeric" />
      )}
      <TouchableOpacity
        style={styles.button}
        onPress={screen === 'login' ? onLogin : screen === 'verify' ? onVerify : onRegister}
      >
        <Text style={styles.buttonText}>{screen === 'login' ? 'Login' : screen === 'verify' ? 'Verify OTP' : 'Register'}</Text>
      </TouchableOpacity>
      <View style={styles.switchRow}>
        {screen !== 'login' && (
          <TouchableOpacity onPress={() => setScreen('login')}>
            <Text style={styles.switchText}>Have account? Login</Text>
          </TouchableOpacity>
        )}
        {screen !== 'register' && screen !== 'verify' && (
          <TouchableOpacity onPress={() => setScreen('register')}>
            <Text style={styles.switchText}>New user? Register</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const dashboard = (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Welcome, {user?.name}</Text>
      <Text style={styles.subtitle}>Role: {user?.role}</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.searchCard}>
        <TextInput style={styles.input} placeholder="Search jobs" value={search} onChangeText={setSearch} />
        <TouchableOpacity style={styles.button} onPress={() => loadJobs(token)}>
          <Text style={styles.buttonText}>Search Jobs</Text>
        </TouchableOpacity>
      </View>

      {user?.role === 'hirer' && (
        <View style={styles.jobCard}>
          <Text style={styles.sectionTitle}>Post a Job</Text>
          <TextInput style={styles.input} placeholder="Title" value={jobForm.title} onChangeText={(text) => handleJobChange('title', text)} />
          <TextInput style={styles.input} placeholder="Description" value={jobForm.description} onChangeText={(text) => handleJobChange('description', text)} />
          <TextInput style={styles.input} placeholder="Category" value={jobForm.category} onChangeText={(text) => handleJobChange('category', text)} />
          <TextInput style={styles.input} placeholder="Location" value={jobForm.location} onChangeText={(text) => handleJobChange('location', text)} />
          <TextInput style={styles.input} placeholder="Budget" value={jobForm.budget} onChangeText={(text) => handleJobChange('budget', text)} keyboardType="numeric" />
          <TouchableOpacity style={styles.button} onPress={onCreateJob}>
            <Text style={styles.buttonText}>Post Job</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.jobList}>
        <Text style={styles.sectionTitle}>Open Jobs</Text>
        {jobs.length === 0 ? (
          <Text style={styles.emptyText}>No jobs found.</Text>
        ) : (
          jobs.map((job) => (
            <View key={job._id} style={styles.jobCard}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobText}>{job.description}</Text>
              <Text style={styles.jobMeta}>Category: {job.category}</Text>
              <Text style={styles.jobMeta}>Location: {job.location}</Text>
              <Text style={styles.jobMeta}>Budget: {job.budget ?? 'N/A'}</Text>
              <TouchableOpacity style={styles.buttonOutline} onPress={() => onHire(job._id)}>
                <Text style={styles.buttonOutlineText}>Take this job</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.jobCard}>
        <Text style={styles.sectionTitle}>Search Workers</Text>
        <TextInput style={styles.input} placeholder="Search by name" value={workerSearch} onChangeText={setWorkerSearch} />
        <TouchableOpacity style={styles.button} onPress={() => loadWorkers(token)}>
          <Text style={styles.buttonText}>Search Workers</Text>
        </TouchableOpacity>
        {workers.length === 0 ? (
          <Text style={styles.emptyText}>No workers found.</Text>
        ) : (
          workers.map((worker) => (
            <View key={worker._id} style={styles.workerCard}>
              <Text style={styles.jobTitle}>{worker.name}</Text>
              <Text style={styles.jobMeta}>Role: {worker.role}</Text>
              <Text style={styles.jobText}>Email: {worker.email}</Text>
              <Text style={styles.jobText}>Phone: {worker.phone}</Text>
            </View>
          ))
        )}
      </View>

      {user?.role === 'admin' && (
        <View style={styles.jobCard}>
          <Text style={styles.sectionTitle}>Admin User Management</Text>
          {users.length === 0 ? (
            <Text style={styles.emptyText}>No users yet.</Text>
          ) : (
            users.map((userItem) => (
              <View key={userItem._id} style={styles.workerCard}>
                <Text style={styles.jobTitle}>{userItem.name}</Text>
                <Text style={styles.jobMeta}>Role: {userItem.role}</Text>
                <Text style={styles.jobText}>Email: {userItem.email}</Text>
                <Text style={styles.jobText}>Phone: {userItem.phone}</Text>
                <Text style={styles.jobText}>Verified: {userItem.isVerified ? 'Yes' : 'No'}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {screen === 'dashboard' ? dashboard : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>VerifiedSeva</Text>
          <Text style={styles.subtitle}>Post work, search jobs, and verify by OTP.</Text>
          {authForm}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', marginVertical: 16, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#4b5563', textAlign: 'center', marginBottom: 24 },
  formCard: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  input: { width: '100%', backgroundColor: '#f3f4f6', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16 },
  button: { width: '100%', backgroundColor: '#2563eb', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
  buttonOutline: { width: '100%', borderColor: '#2563eb', borderWidth: 1, padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  buttonOutlineText: { color: '#2563eb', fontWeight: '700' },
  switchRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  switchText: { color: '#2563eb', fontWeight: '600' },
  logoutButton: { backgroundColor: '#ef4444', padding: 12, borderRadius: 12, marginTop: 8, alignSelf: 'flex-end' },
  logoutText: { color: '#fff', fontWeight: '700' },
  searchCard: { width: '100%', marginVertical: 16 },
  jobCard: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  jobList: { width: '100%' },
  workerCard: { width: '100%', backgroundColor: '#f8fafc', borderRadius: 16, padding: 14, marginTop: 12 },
  jobTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  jobText: { color: '#374151', marginBottom: 8 },
  jobMeta: { color: '#6b7280', marginBottom: 4 },
  emptyText: { color: '#6b7280', textAlign: 'center', marginTop: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: '#374151' },
});
