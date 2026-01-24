import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        // Fix: Check if token has 3 parts (Header.Payload.Signature) BEFORE decoding
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error("Token is not a valid JWT");
        }

        const payload = JSON.parse(atob(parts[1]));
        const expirationTime = payload.exp * 1000;
        
        if (Date.now() >= expirationTime) {
            localStorage.removeItem('token');
            return <Navigate to="/login" replace />;
        }
    } catch (e) {
        // If decoding fails (bad string, old data), just clear it and redirect
        console.warn("Invalid token found, clearing...", e);
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default PrivateRoute;