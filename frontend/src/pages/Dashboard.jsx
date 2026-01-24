import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import PatientDashboard from '../components/PatientDashboard';
import DoctorDashboard from '../components/DoctorDashboard';

const Dashboard = () => {
    const [role, setRole] = useState(null);
    const navigate = useNavigate(); // Hook for redirection

    useEffect(() => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            // Decode token safely
            const parts = token.split('.');
            if (parts.length !== 3) throw new Error("Invalid Token");
            
            const payload = JSON.parse(atob(parts[1]));
            
            if (!payload.role) {
                throw new Error("Token missing Role");
            }

            setRole(payload.role); 

        } catch (e) {
            console.error("Dashboard Error:", e);
            // If token is bad, clear it and kick user to login
            localStorage.removeItem('token');
            navigate('/login');
        }
    }, [navigate]);

    if (!role) {
        return (
            <div style={{display:'flex', justifyContent:'center', marginTop:'50px'}}>
                <h3>Loading Dashboard...</h3>
                {/* Fallback button if it gets stuck */}
                <button 
                    onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
                    style={{marginLeft:'20px', padding:'5px 10px', cursor:'pointer'}}
                >
                    Stuck? Logout
                </button>
            </div>
        );
    }

    return role === 'DOCTOR' ? <DoctorDashboard /> : <PatientDashboard />;
};

export default Dashboard;