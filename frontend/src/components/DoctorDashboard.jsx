import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    
    // Edit Form State
    const [editForm, setEditForm] = useState({});

    // --- HELPER: Determine Appointment Status ---
    const getStatus = (startStr, endStr) => {
        const now = new Date();
        const start = new Date(startStr);
        const end = new Date(endStr);

        // Logic 1: Completed (1 hour buffer after end time)
        if (now > new Date(end.getTime() + 60 * 60000)) { 
            return 'COMPLETED';
        }

        // Logic 2: Live/In-Progress (Same Day Rule)
        const isSameDay = now.toDateString() === start.toDateString();
        if (isSameDay) {
            return 'IN_PROGRESS';
        }

        return 'UPCOMING';
    };

    useEffect(() => {
        fetchDoctorData();
    }, []);

    const fetchDoctorData = async () => {
        try {
            // 1. Get My Profile
            const profileRes = await api.get('/doctors/me');
            setDoctor(profileRes.data);
            setEditForm(profileRes.data);

            // 2. Get My Appointments
            const apptRes = await api.get('/doctors/appointments');
            const rawAppts = apptRes.data;

            // --- SORTING LOGIC ---
            // Priority: 1. IN_PROGRESS, 2. UPCOMING, 3. COMPLETED
            // Secondary Sort: Date (Earliest first)
            const sortedAppts = rawAppts.sort((a, b) => {
                const statusA = getStatus(a.appointmentTime, a.endTime);
                const statusB = getStatus(b.appointmentTime, b.endTime);

                const score = { 'IN_PROGRESS': 1, 'UPCOMING': 2, 'COMPLETED': 3 };

                if (score[statusA] !== score[statusB]) {
                    return score[statusA] - score[statusB];
                }

                return new Date(a.appointmentTime) - new Date(b.appointmentTime);
            });

            setAppointments(sortedAppts);

        } catch (err) {
            console.error("Failed to load doctor data", err);
        }
    };

    const handleUpdate = async () => {
        try {
            await api.put('/doctors/me', editForm);
            alert("Profile Updated Successfully!");
            setIsEditing(false);
            fetchDoctorData(); 
        } catch (err) {
            alert("Update Failed");
        }
    };

    // --- HELPER: Handle Join Click ---
    const handleJoin = (appt) => {
        const status = getStatus(appt.appointmentTime, appt.endTime);
        
        if (status === 'IN_PROGRESS') {
            // For Doctor, the recipient is the PATIENT
            // We use optional chaining safely: appt.patient?.user?.email
            const patientEmail = appt.patient?.user?.email;
            if (patientEmail) {
                navigate(`/chat/${patientEmail}`); 
            } else {
                alert("Error: Patient email not found.");
            }
        } else if (status === 'UPCOMING') {
            alert("This meeting hasn't started yet.");
        } else {
            alert("This meeting has already ended.");
        }
    };

    if (!doctor) return <div style={{padding:'20px'}}>Loading Doctor Profile...</div>;

    return (
        <div style={styles.container}>
            {/* --- TOP PROFILE SECTION --- */}
            <div style={styles.header}>
                <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
                    <div style={styles.avatar}>👨‍⚕️</div>
                    <div>
                        <h2 style={{margin:0}}>Dr. {doctor.fullName}</h2>
                        <p style={{margin:'5px 0', color:'#e0e0e0'}}>
                            {doctor.specialization || "General"} • {doctor.experienceYears} Yrs Exp
                        </p>
                        <div style={{display: 'flex', gap: '10px', marginTop:'5px'}}>
                            <div style={styles.badge}>License: {doctor.licenseNumber}</div>
                            {doctor.consultationFee && (
                                <div style={{...styles.badge, background: '#28a745'}}>
                                    ₹{doctor.consultationFee} / Visit
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <button onClick={() => setIsEditing(!isEditing)} style={styles.editBtn}>
                    {isEditing ? "Cancel" : "Edit Profile ✏️"}
                </button>
            </div>

            {/* --- EDIT FORM (Collapsible) --- */}
            {isEditing && (
                <div style={styles.editCard}>
                    <h3>Update Your Info</h3>
                    <div style={styles.formGrid}>
                        <label>
                            Full Name: 
                            <input value={editForm.fullName || ''} onChange={e=>setEditForm({...editForm, fullName: e.target.value})} style={styles.input}/>
                        </label>
                        <label>
                            Specialization:
                            <input value={editForm.specialization || ''} onChange={e=>setEditForm({...editForm, specialization: e.target.value})} style={styles.input}/>
                        </label>
                        <label>
                            Experience (Yrs): 
                            <input type="number" value={editForm.experienceYears || ''} onChange={e=>setEditForm({...editForm, experienceYears: e.target.value})} style={styles.input}/>
                        </label>
                        <label>
                            License No: 
                            <input value={editForm.licenseNumber || ''} onChange={e=>setEditForm({...editForm, licenseNumber: e.target.value})} style={styles.input}/>
                        </label>
                        <label>
                            Consultation Fee (₹): 
                            <input type="number" value={editForm.consultationFee || ''} onChange={e=>setEditForm({...editForm, consultationFee: e.target.value})} style={styles.input}/>
                        </label>
                    </div>
                    <label style={{display:'block', marginTop:'15px'}}>
                        About:
                        <textarea value={editForm.about || ''} onChange={e=>setEditForm({...editForm, about: e.target.value})} style={styles.textarea}/>
                    </label>
                    <button onClick={handleUpdate} style={styles.saveBtn}>Save Changes</button>
                </div>
            )}

            {/* --- UPCOMING APPOINTMENTS --- */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Your Schedule</h3>
                {appointments.length === 0 ? (
                    <p style={{color:'#666'}}>No upcoming appointments.</p>
                ) : (
                    <div style={styles.apptGrid}>
                        {appointments.map(appt => {
                            const status = getStatus(appt.appointmentTime, appt.endTime);
                            const isLive = status === 'IN_PROGRESS';

                            return (
                                <div key={appt.id} style={styles.apptCard}>
                                    {/* Header: Date & Status */}
                                    <div style={styles.apptHeader}>
                                        <span style={{fontWeight:'bold'}}>
                                            {new Date(appt.appointmentTime).toLocaleDateString()}
                                        </span>
                                        <span style={{
                                            ...styles.statusBadge, 
                                            background: isLive ? '#d4edda' : (status === 'COMPLETED' ? '#e2e3e5' : '#fff3cd'),
                                            color: isLive ? '#155724' : (status === 'COMPLETED' ? '#383d41' : '#856404')
                                        }}>
                                            {status === 'IN_PROGRESS' ? '🔴 Live' : (status === 'COMPLETED' ? 'Done' : 'Upcoming')}
                                        </span>
                                    </div>
                                    
                                    {/* Patient Info */}
                                    <div style={styles.patientInfo}>
                                        <div style={styles.patientAvatar}>👤</div>
                                        <div>
                                            <strong>{appt.patient?.fullName || "Patient"}</strong>
                                            <div style={{fontSize:'0.85rem', color:'#666'}}>
                                                Time: {new Date(appt.appointmentTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </div>
                                            <div style={{fontSize:'0.8rem', color:'#888', fontStyle:'italic'}}>
                                                "{appt.reason || "General Checkup"}"
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={styles.actions}>
                                        <button 
                                            style={{
                                                ...styles.joinBtn,
                                                background: isLive ? '#007bff' : '#ccc',
                                                cursor: isLive ? 'pointer' : 'not-allowed'
                                            }}
                                            onClick={() => handleJoin(appt)}
                                            disabled={!isLive}
                                        >
                                            {isLive ? "Join Call 📹" : (status === 'COMPLETED' ? "Completed" : "Wait")}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { background: '#f4f6f8', minHeight: '100vh', fontFamily: 'sans-serif' },
    header: { background: 'linear-gradient(135deg, #2c3e50, #4ca1af)', color: 'white', padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    avatar: { fontSize: '3rem', background: 'rgba(255,255,255,0.2)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    badge: { background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem', color: 'white' },
    editBtn: { background: 'white', color: '#333', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    
    section: { padding: '20px' },
    card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
    editCard: { margin: '20px', padding: '20px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
    
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    input: { width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '80px', fontFamily: 'sans-serif' },
    saveBtn: { background: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginTop: '20px', fontSize: '1rem' },
    
    sectionTitle: { borderLeft: '4px solid #007bff', paddingLeft: '10px', marginBottom: '20px', color: '#333' },
    apptGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', paddingBottom: '30px' },
    apptCard: { background: 'white', borderRadius: '10px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderTop: '4px solid #ffc107' },
    apptHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' },
    statusBadge: { padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' },
    patientInfo: { display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' },
    patientAvatar: { width: '40px', height: '40px', background: '#e9ecef', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    actions: { display: 'flex', gap: '10px' },
    joinBtn: { width: '100%', padding: '10px', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }
};

export default DoctorDashboard;