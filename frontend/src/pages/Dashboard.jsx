import { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [userRole, setUserRole] = useState('');
    
    // Booking Form State
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { navigate('/'); return; }
                
                const payload = JSON.parse(atob(token.split('.')[1]));
                // Handle "roles" (array) or "role" (string) from JWT
                const role = payload.roles || payload.role || "PATIENT";
                setUserRole(role);

                const apptRes = await api.get('/appointments');
                setAppointments(apptRes.data);

                if (role === 'PATIENT') {
                    const docRes = await api.get('/doctors');
                    setDoctors(docRes.data);
                }

            } catch (err) {
                console.error("Error", err);
                if (err.response && (err.response.status === 403 || err.response.status === 401)) {
                    navigate('/'); 
                }
            }
        };
        fetchData();
    }, [navigate]);

    const toLocalISOString = (date) => {
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().slice(0, 19);
    };

    const handleBook = async (e) => {
        e.preventDefault();
        try {
            if (!bookingTime) return alert("Select time!");
            const start = new Date(bookingTime);
            const end = new Date(start.getTime() + 30 * 60000); 

            await api.post('/appointments/book', {
                doctorId: selectedDoctor,
                startTime: toLocalISOString(start),
                endTime: toLocalISOString(end)
            });

            alert('Booking Successful!');
            window.location.reload(); 
        } catch (err) {
            alert(err.response?.data?.message || 'Booking Failed');
        }
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleString();

    const getChatPartner = (appt) => {
        return userRole === 'DOCTOR' ? appt.patient : appt.doctor.user;
    };

    // --- NEW LOGIC: Check if appointment is expired ---
    const getStatusInfo = (appt) => {
        const now = new Date();
        const end = new Date(appt.endTime);
        const start = new Date(appt.appointmentTime);

        if (now > end) {
            return { text: 'COMPLETED', color: '#6c757d', bg: '#e9ecef', active: false }; // Grey
        } else if (now >= start && now <= end) {
            return { text: 'IN PROGRESS', color: '#fff', bg: '#28a745', active: true }; // Green (Live)
        } else {
            return { text: 'SCHEDULED', color: '#2e7d32', bg: '#e8f5e9', active: false }; // Light Green
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h1>{userRole === 'DOCTOR' ? 'Doctor Dashboard' : 'Patient Dashboard'}</h1>

            {/* BOOKING SECTION */}
            {userRole === 'PATIENT' && (
                <div style={styles.card}>
                    <h3>📅 Book New Appointment</h3>
                    <form onSubmit={handleBook} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <select 
                            value={selectedDoctor} 
                            onChange={(e) => setSelectedDoctor(e.target.value)}
                            style={styles.input}
                            required
                        >
                            <option value="">Select a Doctor</option>
                            {doctors.map(doc => (
                                <option key={doc.id} value={doc.id}>
                                    {doc.user ? doc.user.fullName : 'Unknown'} ({doc.specialization})
                                </option>
                            ))}
                        </select>
                        <input 
                            type="datetime-local" 
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            style={styles.input}
                            required
                        />
                        <button type="submit" style={styles.button}>Book Now</button>
                    </form>
                </div>
            )}

            {/* APPOINTMENT LIST */}
            <h3>{userRole === 'DOCTOR' ? 'My Upcoming Consultations' : 'My Upcoming Appointments'}</h3>
            
            {appointments.length === 0 ? (
                <p>No appointments found.</p>
            ) : (
                <ul style={{ padding: 0 }}>
                    {appointments.map((appt) => {
                        const otherPerson = getChatPartner(appt);
                        const status = getStatusInfo(appt); // <--- Get dynamic status
                        
                        return (
                            <li key={appt.id} style={styles.listItem}>
                                <div>
                                    <strong>
                                        {userRole === 'DOCTOR' ? 'Patient: ' : 'Dr. '} 
                                        {otherPerson ? otherPerson.fullName : 'Unknown'}
                                        {userRole === 'PATIENT' && <span style={{fontWeight: 'normal', color: '#555'}}> ({appt.doctor.specialization})</span>}
                                    </strong>
                                    
                                    <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                                        📅 <b>Start:</b> {formatDate(appt.appointmentTime)} <br/>
                                        ⏰ <b>End:</b> {formatDate(appt.endTime)}
                                    </div>
                                </div>
                                
                                <div style={{display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end'}}>
                                    {/* STATUS BADGE */}
                                    <span style={{
                                        ...styles.statusBadge, 
                                        backgroundColor: status.bg, 
                                        color: status.color
                                    }}>
                                        {status.text}
                                    </span>
                                    
                                    {/* CHAT BUTTON (Only visible if Active or Scheduled) */}
                                    {/* We allow clicking "Scheduled" too, so they can enter waiting room, 
                                        but "Completed" is disabled */}
                                    {status.text !== 'COMPLETED' && (
                                        <button 
                                            onClick={() => navigate(`/chat/${otherPerson.email}`)}
                                            style={{...styles.button, backgroundColor: '#007bff', fontSize: '0.8em'}}
                                        >
                                            💬 Chat
                                        </button>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
            
            <button onClick={() => { localStorage.removeItem('token'); navigate('/'); }} style={styles.logoutBtn}>
                Logout
            </button>
        </div>
    );
};

const styles = {
    card: { background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' },
    input: { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 },
    button: { padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    listItem: { 
        border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '8px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        backgroundColor: '#fff' 
    },
    statusBadge: { padding: '4px 8px', borderRadius: '12px', fontSize: '0.8em', fontWeight: 'bold' },
    logoutBtn: { padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }
};

export default Dashboard;