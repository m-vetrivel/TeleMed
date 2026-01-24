import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const DoctorProfile = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    
    const [doctor, setDoctor] = useState(state?.doctor || null);
    const [loading, setLoading] = useState(!state?.doctor);
    
    // --- NEW STATE FOR DATE/TIME SELECTION ---
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    // -----------------------------------------

    useEffect(() => {
        if (!doctor) {
            const fetchDoctor = async () => {
                try {
                    const res = await api.get(`/doctors/${id}`);
                    setDoctor(res.data);
                } catch (err) {
                    console.error("Failed to load doctor", err);
                    alert("Doctor not found");
                    navigate('/dashboard');
                } finally {
                    setLoading(false);
                }
            };
            fetchDoctor();
        }
    }, [id, doctor, navigate]);

    const handleBook = async () => {
        // 1. VALIDATION
        if (!selectedDate || !selectedTime) {
            alert("Please select both a Date and a Time for your appointment.");
            return;
        }

        const fee = doctor.consultationFee || 500; 
        const confirm = window.confirm(`Confirm booking with Dr. ${doctor.fullName} for ₹${fee} on ${selectedDate} at ${selectedTime}?`);
        
        if (confirm) {
            try {
                // 2. COMBINE DATE & TIME
                // Input Date: "2026-01-25"
                // Input Time: "14:30"
                // Result: "2026-01-25T14:30:00"
                const dateTimeString = `${selectedDate}T${selectedTime}:00`;

                // Calculate End Time (30 mins later)
                const startObj = new Date(dateTimeString);
                const endObj = new Date(startObj.getTime() + 30 * 60000); // Add 30 minutes
                
                // Format End Time manually to avoid timezone issues
                // (Quick hack: ISO string -> slice is safe if we ignore timezone shifts for local app)
                // Ideally use a library like date-fns, but this works for basic usage.
                const toLocalISO = (date) => {
                    const pad = (n) => n < 10 ? '0' + n : n;
                    return date.getFullYear() + '-' + 
                        pad(date.getMonth() + 1) + '-' + 
                        pad(date.getDate()) + 'T' + 
                        pad(date.getHours()) + ':' + 
                        pad(date.getMinutes()) + ':' + 
                        pad(date.getSeconds());
                };

                await api.post('/appointments', {
                    doctorId: doctor.id,
                    appointmentTime: dateTimeString, // Send selected time
                    endTime: toLocalISO(endObj),     // Send calculated end time
                    reason: "General Consultation"
                });

                alert("Appointment Booked Successfully!");
                navigate('/dashboard');
            } catch (err) {
                console.error(err);
                alert("Booking Failed: " + (err.response?.data || "Server Error"));
            }
        }
    };

    if (loading) return <div>Loading Profile...</div>;
    if (!doctor) return null;

    // Helper to get today's date for "min" attribute (prevent past dates)
    const today = new Date().toISOString().split('T')[0];

    return (
        <div style={styles.container}>
            {/* Header Banner */}
            <div style={styles.headerBanner}>
                <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>← Back</button>
            </div>

            {/* Profile Info */}
            <div style={styles.profileCard}>
                <div style={styles.avatar}>👨‍⚕️</div>
                <h2 style={{margin: '10px 0 5px 0'}}>Dr. {doctor.fullName}</h2>
                <span style={{color: '#007bff', fontWeight: 'bold'}}>{doctor.specialization}</span>
                <div style={styles.statsRow}>
                    <div style={styles.stat}><strong>{doctor.experienceYears || 0}+</strong> Years Exp</div>
                    <div style={styles.stat}><strong>License:</strong> {doctor.licenseNumber}</div>
                </div>
            </div>

            {/* Details Section */}
            <div style={styles.content}>
                <div style={styles.section}>
                    <h3>About Doctor</h3>
                    <p style={{lineHeight: '1.6', color: '#555', whiteSpace: 'pre-wrap'}}>
                        {doctor.about || "No bio available for this doctor."}
                    </p>
                </div>

                {/* --- NEW DATE SELECTION UI --- */}
                <div style={styles.section}>
                    <h3>Select Appointment Slot</h3>
                    <div style={styles.dateCard}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Date</label>
                            <input 
                                type="date" 
                                min={today}
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Time</label>
                            <input 
                                type="time" 
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                style={styles.input}
                            />
                        </div>
                    </div>
                </div>
                {/* ----------------------------- */}

                <div style={styles.section}>
                    <h3>Consultation Fee</h3>
                    <div style={styles.feeCard}>
                        <div>
                            <span style={{fontSize: '1.2rem', fontWeight: 'bold'}}>Video Consultation</span>
                            <div style={{fontSize: '0.8rem', color: '#666'}}>30 mins duration</div>
                        </div>
                        <div style={{fontSize: '1.5rem', color: '#28a745', fontWeight: 'bold'}}>
                            ₹{doctor.consultationFee || "N/A"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div style={styles.actionBar}>
                <div style={{display:'flex', flexDirection:'column'}}>
                    <span style={{fontSize:'0.8rem', color:'#666'}}>Total Payable</span>
                    <span style={{fontSize:'1.2rem', fontWeight:'bold'}}>₹{doctor.consultationFee || 0}</span>
                </div>
                <button onClick={handleBook} style={styles.bookBtn}>Confirm Booking</button>
            </div>
        </div>
    );
};

const styles = {
    container: { background: '#f8f9fa', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'sans-serif' },
    headerBanner: { height: '150px', background: 'linear-gradient(135deg, #007bff, #00d2ff)', padding: '20px' },
    backBtn: { background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', backdropFilter: 'blur(5px)' },
    profileCard: { margin: '-50px 20px 0 20px', background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', textAlign: 'center' },
    avatar: { width: '80px', height: '80px', background: '#e3f2fd', borderRadius: '50%', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem', border: '4px solid white' },
    statsRow: { display: 'flex', justifyContent: 'space-around', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' },
    stat: { fontSize: '0.9rem', color: '#555' },
    content: { padding: '20px' },
    section: { marginBottom: '25px' },
    feeCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #ddd' },
    actionBar: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', padding: '15px 20px', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    bookBtn: { background: '#007bff', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '10px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
    
    // NEW STYLES
    dateCard: { display: 'flex', gap: '15px', background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
    inputGroup: { flex: 1 },
    label: { display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#555' },
    input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }
};

export default DoctorProfile;