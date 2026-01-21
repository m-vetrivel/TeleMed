import axios from 'axios';

// 1. Point to your Spring Boot Backend
const API_URL = 'http://localhost:8080/api';

// 2. Create an Axios Instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// 3. Automatically add the JWT Token to every request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

export default api;