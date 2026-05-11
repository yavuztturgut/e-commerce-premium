import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
    baseURL: API_BASE_URL
});

export const withAuth = (token) => ({
    headers: { Authorization: `Bearer ${token}` }
});

export default apiClient;
