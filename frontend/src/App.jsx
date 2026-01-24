import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register'; // <--- 1. Import this
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import PrivateRoute from './components/PrivateRoute.jsx'; // Assuming you have this wrapper

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        
        {/* <--- 2. Add the Register Route here */}
        <Route path="/register" element={<Register />} /> 

        {/* Private Routes (Protected) */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/chat/:recipientEmail"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;