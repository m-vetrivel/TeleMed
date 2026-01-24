import axios from 'axios';

// Your current Localtunnel Backend URL
const API_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        // 'ngrok-skip-browser-warning': 'true', // Useful if you switch to ngrok later
        // 'Bypass-Tunnel-Reminder': 'true'      // <--- ADD THIS for Localtunnel
    }
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

export default api;