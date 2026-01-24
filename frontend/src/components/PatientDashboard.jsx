import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const PatientDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState(null);
    const [loading, setLoading] = useState(true);

    const specialties = [
        { name: "General", icon: "🩺" },
        { name: "Cardiology", icon: "❤️" },
        { name: "Dermatology", icon: "🧴" },
        { name: "Neurology", icon: "🧠" },
        { name: "Pediatrics", icon: "👶" },
        { name: "Psychiatry", icon: "🧩" }
    ];

    // --- HELPER: Get Status ---
    // (Moved outside useEffect so it can be used for sorting)
    const getStatus = (startStr, endStr) => {
        const now = new Date();
        const start = new Date(startStr);
        const end = new Date(endStr);

        // Logic 1: Completed
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
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({ email: payload.sub });

                const docRes = await api.get('/doctors');
                setDoctors(docRes.data);

                const apptRes = await api.get('/appointments');
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

                    // If status is same, sort by date
                    return new Date(a.appointmentTime) - new Date(b.appointmentTime);
                });

                setAppointments(sortedAppts);

            } catch (err) {
                console.error("Dashboard Load Error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- HELPER: Handle Join Click ---
    const handleJoin = (appt) => {
        const status = getStatus(appt.appointmentTime, appt.endTime);
        
        if (status === 'IN_PROGRESS') {
            navigate(`/chat/${appt.doctor?.user?.email}`); 
        } else if (status === 'UPCOMING') {
            alert("Please wait! The meeting hasn't started yet.");
        } else {
            alert("This meeting has already ended.");
        }
    };

    const filteredDoctors = doctors.filter(doc => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (doc.fullName || '').toLowerCase().includes(searchLower) || 
                              (doc.specialization || '').toLowerCase().includes(searchLower);
        const matchesSpecialty = selectedSpecialty 
            ? (doc.specialization || '').includes(selectedSpecialty) 
            : true;
        return matchesSearch && matchesSpecialty;
    });

    if (loading) return <div style={{padding:'20px'}}>Loading TeleMed...</div>;

    return (
        <div style={styles.container}>
            {/* HEADER */}
            <div style={styles.header}>
                <div>
                    <h2 style={{margin:0}}>Hello, Patient</h2>
                    <p style={{margin:0, opacity:0.6}}>{user?.email}</p>
                </div>
              
<div 
    style={{...styles.profileIcon, cursor: 'pointer'}} 
    onClick={() => navigate('/patient/profile')} // <--- Navigate Here
>
    👤
</div>
            </div>

            {/* SEARCH */}
            <div style={styles.searchSection}>
                <input 
                    style={styles.searchBar} 
                    placeholder="🔍 Search doctors..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* --- APPOINTMENTS SECTION (Now Sorted) --- */}
            {appointments.length > 0 && (
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Your Appointments</h3>
                    <div style={styles.apptScroll}>
                        {appointments.map(appt => {
                            const status = getStatus(appt.appointmentTime, appt.endTime);
                            const isLive = status === 'IN_PROGRESS';

                            return (
                                <div key={appt.id} style={styles.apptCard}>
                                    
                                    {/* Top Row: Date & Status Badge */}
                                    <div style={styles.apptHeader}>
                                        <span style={{fontWeight:'bold', color: '#555'}}>
                                            {new Date(appt.appointmentTime).toLocaleDateString()}
                                        </span>
                                        <span style={{
                                            ...styles.statusBadge, 
                                            background: isLive ? '#d4edda' : (status === 'COMPLETED' ? '#e2e3e5' : '#fff3cd'),
                                            color: isLive ? '#155724' : (status === 'COMPLETED' ? '#383d41' : '#856404')
                                        }}>
                                            {status === 'IN_PROGRESS' ? '🔴 Live Now' : (status === 'COMPLETED' ? 'Completed' : 'Upcoming')}
                                        </span>
                                    </div>

                                    {/* Doctor Info */}
                                    <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}>
                                        <div style={styles.docAvatarSmall}>👨‍⚕️</div>
                                        <div>
                                            <div style={{fontWeight:'bold'}}>Dr. {appt.doctor?.fullName}</div>
                                            <div style={{fontSize:'0.8rem', color:'#666'}}>
                                                {new Date(appt.appointmentTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button 
                                        style={{
                                            ...styles.joinBtn,
                                            background: isLive ? '#28a745' : '#ccc',
                                            cursor: isLive ? 'pointer' : 'not-allowed'
                                        }}
                                        onClick={() => handleJoin(appt)}
                                        disabled={!isLive} 
                                    >
                                        {isLive ? "Join Meeting 📹" : (status === 'COMPLETED' ? "Ended" : "Wait for Time")}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* SPECIALTIES & DOCTOR LIST (Unchanged) */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Find by Specialty</h3>
                <div style={styles.specialtyScroll}>
                    {specialties.map((spec, idx) => (
                        <div 
                            key={idx} 
                            style={{...styles.specialtyCard, border: selectedSpecialty === spec.name ? '2px solid #007bff' : '1px solid #eee'}}
                            onClick={() => setSelectedSpecialty(spec.name === selectedSpecialty ? null : spec.name)}
                        >
                            <div style={{fontSize:'2rem'}}>{spec.icon}</div>
                            <div style={{fontSize:'0.8rem'}}>{spec.name}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Available Doctors</h3>
                <div style={styles.doctorList}>
                    {filteredDoctors.length > 0 ? filteredDoctors.map(doc => (
                        <div key={doc.id} style={styles.docCard} onClick={() => navigate(`/doctor/${doc.id}`, { state: { doctor: doc } })}>
                            <div style={styles.docImg}>👨‍⚕️</div>
                            <div style={styles.docInfo}>
                                <h4 style={{margin:0}}>Dr. {doc.fullName}</h4>
                                <span style={{color:'#666', fontSize:'0.9rem'}}>{doc.specialization}</span>
                                <div style={{fontSize:'0.8rem', color: '#28a745', fontWeight:'bold', marginTop:'5px'}}>
                                    {doc.consultationFee ? `₹${doc.consultationFee}` : 'Fee not set'}
                                </div>
                            </div>
                            <button style={styles.viewBtn}>View</button>
                        </div>
                    )) : (
                        <p style={{color:'#888', textAlign:'center', padding:'20px'}}>
                            No doctors found matching criteria.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '20px', background: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    profileIcon: { width: '40px', height: '40px', borderRadius: '50%', background: '#ddd', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem' },
    searchSection: { marginBottom: '20px' },
    searchBar: { width: '100%', padding: '12px 15px', borderRadius: '10px', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize: '1rem', boxSizing: 'border-box' },
    section: { marginBottom: '25px' },
    sectionTitle: { fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px', color: '#333' },
    apptScroll: { display: 'flex', flexWrap: 'wrap', gap: '15px', overflowY: 'auto', paddingBottom: '10px' },
    apptCard: { minWidth: '280px', background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', borderLeft: '5px solid #007bff' },
    apptHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '0.9rem', alignItems: 'center' },
    statusBadge: { padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' },
    docAvatarSmall: { width: '40px', height: '40px', background: '#f0f0f0', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize:'1.2rem' },
    joinBtn: { width: '100%', padding: '10px', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', transition: '0.3s' },
    specialtyScroll: { display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' },
    specialtyCard: { minWidth: '90px', height: '100px', background: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
    doctorList: { display: 'flex', flexDirection: 'column', gap: '15px' },
    docCard: { display: 'flex', alignItems: 'center', background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', cursor: 'pointer' },
    docImg: { width: '50px', height: '50px', borderRadius: '50%', background: '#e3f2fd', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem', marginRight: '15px' },
    docInfo: { flex: 1 },
    viewBtn: { padding: '8px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }
};

export default PatientDashboard;