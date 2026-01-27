import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    // --- FILE STATES ---
    const [photoUrl, setPhotoUrl] = useState(null);
    const [myFiles, setMyFiles] = useState([]); // List of uploaded files
    
    // Refs
    const photoInputRef = useRef(null);
    const certInputRef = useRef(null);

    const getStatus = (startStr, endStr) => {
        const now = new Date();
        const start = new Date(startStr);
        const end = new Date(endStr);
        if (now > new Date(end.getTime() + 60 * 60000)) return 'COMPLETED';
        const isSameDay = now.toDateString() === start.toDateString();
        if (isSameDay) return 'IN_PROGRESS';
        return 'UPCOMING';
    };

    useEffect(() => {
        fetchDoctorData();
        fetchPhoto();
        fetchMyFiles(); // Load documents on mount
    }, []);

    const fetchDoctorData = async () => {
        try {
            const profileRes = await api.get('/doctors/me');
            setDoctor(profileRes.data);
            setEditForm(profileRes.data);

            const apptRes = await api.get('/doctors/appointments');
            const sortedAppts = apptRes.data.sort((a, b) => {
                const statusA = getStatus(a.appointmentTime, a.endTime);
                const statusB = getStatus(b.appointmentTime, b.endTime);
                const score = { 'IN_PROGRESS': 1, 'UPCOMING': 2, 'COMPLETED': 3 };
                if (score[statusA] !== score[statusB]) return score[statusA] - score[statusB];
                return new Date(a.appointmentTime) - new Date(b.appointmentTime);
            });
            setAppointments(sortedAppts);
        } catch (err) { console.error("Failed to load doctor data", err); }
    };

    const fetchPhoto = async () => {
        try {
            const res = await api.get('/files/photo', { responseType: 'blob' });
            if (res.data.size > 0) setPhotoUrl(URL.createObjectURL(res.data));
        } catch (err) { }
    };

    // --- NEW: FETCH MY FILES ---
    const fetchMyFiles = async () => {
        try {
            // Using the endpoint we created to get certificates
            // If you updated backend to have /me/all, use that. 
            // Otherwise, we can re-use the generic endpoint or filter manually.
            // For now, let's assume we want to see certificates specifically.
            // You might need to update the backend endpoint to return a list for "/files/certificate" or add "/files/me/all"
            const res = await api.get('/files/me/all'); 
            setMyFiles(res.data);
        } catch (err) { 
            console.log("No files found or endpoint not ready");
        }
    };

    const handlePhotoSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);
        try {
            await api.post('/files/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
            setPhotoUrl(URL.createObjectURL(file)); 
            alert("Profile Photo Updated!");
        } catch (err) { alert("Photo upload failed"); }
    };

    const handleCertificateSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);
        try {
            await api.post('/files/certificate', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
            alert("Certificate Uploaded Successfully!");
            fetchMyFiles(); // Refresh list
        } catch (err) { alert("Certificate upload failed"); }
    };

    // --- NEW: DELETE FILE ---
    const handleDeleteFile = async (fileId) => {
        if(!window.confirm("Are you sure you want to delete this file?")) return;
        
        try {
            await api.delete(`/files/${fileId}`);
            setMyFiles(prev => prev.filter(f => f.id !== fileId)); // Remove from UI
            alert("File Deleted");
        } catch (err) {
            alert("Failed to delete file");
        }
    };

    const handleUpdate = async () => {
        try {
            await api.put('/doctors/me', editForm);
            alert("Profile Updated Successfully!");
            setIsEditing(false);
            fetchDoctorData(); 
        } catch (err) { alert("Update Failed"); }
    };

    const handleJoin = (appt) => {
        const status = getStatus(appt.appointmentTime, appt.endTime);
        if (status === 'IN_PROGRESS') {
            const patientEmail = appt.patient?.user?.email;
            if (patientEmail) navigate(`/chat/${patientEmail}`); 
            else alert("Error: Patient email not found.");
        } else if (status === 'UPCOMING') {
            alert("This meeting hasn't started yet.");
        } else {
            alert("This meeting has already ended.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (!doctor) return <div style={{padding:'20px'}}>Loading Doctor Profile...</div>;

    return (
        <div style={styles.container}>
            {/* --- HEADER --- */}
            <div style={styles.header}>
                <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
                    <div style={styles.avatarWrapper} onClick={() => photoInputRef.current.click()} title="Change photo">
                        {photoUrl ? <img src={photoUrl} alt="Profile" style={styles.avatarImg} /> : <div style={styles.avatarPlaceholder}>👨‍⚕️</div>}
                        <div style={styles.cameraIcon}>📷</div>
                    </div>
                    <input type="file" ref={photoInputRef} style={{display:'none'}} onChange={handlePhotoSelect} accept="image/*"/>

                    <div>
                        <h2 style={{margin:0}}>Dr. {doctor.fullName}</h2>
                        <p style={{margin:'5px 0', color:'#e0e0e0'}}>{doctor.specialization} • {doctor.experienceYears} Yrs Exp</p>
                        <div style={{display: 'flex', gap: '10px', marginTop:'5px'}}>
                            <div style={styles.badge}>License: {doctor.licenseNumber}</div>
                            {doctor.consultationFee && <div style={{...styles.badge, background: '#28a745'}}>₹{doctor.consultationFee} / Visit</div>}
                        </div>
                    </div>
                </div>
                <button onClick={() => setIsEditing(!isEditing)} style={styles.editBtn}>{isEditing ? "Cancel" : "Edit Profile ✏️"}</button>
            </div>

            {/* --- EDIT FORM --- */}
            {isEditing && (
                <div style={styles.editCard}>
                    <h3>Update Your Info</h3>
                    <div style={styles.formGrid}>
                        <label>Full Name: <input value={editForm.fullName || ''} onChange={e=>setEditForm({...editForm, fullName: e.target.value})} style={styles.input}/></label>
                        <label>Specialization: <input value={editForm.specialization || ''} onChange={e=>setEditForm({...editForm, specialization: e.target.value})} style={styles.input}/></label>
                        <label>Experience (Yrs): <input type="number" value={editForm.experienceYears || ''} onChange={e=>setEditForm({...editForm, experienceYears: e.target.value})} style={styles.input}/></label>
                        <label>License No: <input value={editForm.licenseNumber || ''} onChange={e=>setEditForm({...editForm, licenseNumber: e.target.value})} style={styles.input}/></label>
                        <label>Consultation Fee (₹): <input type="number" value={editForm.consultationFee || ''} onChange={e=>setEditForm({...editForm, consultationFee: e.target.value})} style={styles.input}/></label>
                    </div>
                    <label style={{display:'block', marginTop:'15px'}}>About: <textarea value={editForm.about || ''} onChange={e=>setEditForm({...editForm, about: e.target.value})} style={styles.textarea}/></label>
                    
                    {/* --- UPLOAD SECTION --- */}
                    <div style={{marginTop:'20px', padding:'15px', background:'#f8f9fa', borderRadius:'8px', border:'1px dashed #ccc'}}>
                        <h4 style={{marginTop:0, color:'#555'}}>Upload New Certificate</h4>
                        <input type="file" ref={certInputRef} onChange={handleCertificateSelect} style={{fontSize:'0.9rem'}}/>
                    </div>

                    <button onClick={handleUpdate} style={styles.saveBtn}>Save Changes</button>
                </div>
            )}

            {/* --- NEW: MY DOCUMENTS SECTION --- */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>My Documents</h3>
                {myFiles.length === 0 ? (
                    <p style={{color:'#888', fontStyle:'italic'}}>No documents uploaded yet.</p>
                ) : (
                    <div style={styles.fileGrid}>
                        {myFiles.map(file => (
                            <div key={file.id} style={styles.fileCard}>
                                <div style={{display:'flex', alignItems:'center', gap:'10px', overflow:'hidden'}}>
                                    <div style={{fontSize:'1.5rem'}}>📄</div>
                                    <div style={{flex:1}}>
                                        <div style={styles.fileName} title={file.fileName}>{file.fileName}</div>
                                        <div style={{fontSize:'0.75rem', color:'#888'}}>{file.type}</div>
                                    </div>
                                </div>
                                <div style={styles.fileActions}>
                                    <a 
                                        href={`http://localhost:8080/api/files/${file.id}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        style={styles.viewLink}
                                    >
                                        View
                                    </a>
                                    <button 
                                        onClick={() => handleDeleteFile(file.id)}
                                        style={styles.deleteFileBtn}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- SCHEDULE SECTION --- */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Your Schedule</h3>
                {appointments.length === 0 ? <p style={{color:'#666'}}>No upcoming appointments.</p> : (
                    <div style={styles.apptGrid}>
                        {appointments.map(appt => {
                            const status = getStatus(appt.appointmentTime, appt.endTime);
                            const isLive = status === 'IN_PROGRESS';
                            return (
                                <div key={appt.id} style={styles.apptCard}>
                                    <div style={styles.apptHeader}>
                                        <span style={{fontWeight:'bold'}}>{new Date(appt.appointmentTime).toLocaleDateString()}</span>
                                        <span style={{...styles.statusBadge, background: isLive ? '#d4edda' : (status === 'COMPLETED' ? '#e2e3e5' : '#fff3cd'), color: isLive ? '#155724' : (status === 'COMPLETED' ? '#383d41' : '#856404')}}>
                                            {status === 'IN_PROGRESS' ? '🔴 Live' : (status === 'COMPLETED' ? 'Done' : 'Upcoming')}
                                        </span>
                                    </div>
                                    <div style={styles.patientInfo}>
                                        <div style={styles.patientAvatar}>👤</div>
                                        <div>
                                            <strong>{appt.patient?.fullName || "Patient"}</strong>
                                            <div style={{fontSize:'0.85rem', color:'#666'}}>Time: {new Date(appt.appointmentTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                        </div>
                                    </div>
                                    <div style={styles.actions}>
                                        <button style={{...styles.joinBtn, background: isLive ? '#007bff' : '#ccc', cursor: isLive ? 'pointer' : 'not-allowed'}} onClick={() => handleJoin(appt)} disabled={!isLive}>
                                            {isLive ? "Join Call 📹" : (status === 'COMPLETED' ? "Completed" : "Wait")}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn}>Logout 🚪</button>
        </div>
    );
};

const styles = {
    container: { background: '#f4f6f8', minHeight: '100vh', fontFamily: 'sans-serif' },
    header: { background: 'linear-gradient(135deg, #2c3e50, #4ca1af)', color: 'white', padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    avatarWrapper: { position:'relative', cursor:'pointer', width:'80px', height:'80px', marginRight:'20px' },
    avatarImg: { width:'80px', height:'80px', borderRadius:'50%', objectFit:'cover', border:'3px solid white', boxShadow:'0 2px 5px rgba(0,0,0,0.2)' },
    avatarPlaceholder: { fontSize: '3rem', background: 'rgba(255,255,255,0.2)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', border:'3px solid white' },
    cameraIcon: { position:'absolute', bottom:0, right:0, background:'white', borderRadius:'50%', padding:'4px', fontSize:'0.9rem', boxShadow:'0 2px 5px rgba(0,0,0,0.3)', color:'#333' },
    badge: { background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem', color: 'white' },
    editBtn: { background: 'white', color: '#333', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    
    section: { padding: '20px' },
    sectionTitle: { borderLeft: '4px solid #007bff', paddingLeft: '10px', marginBottom: '20px', color: '#333' },
    
    // DOCUMENT STYLES
    fileGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:'15px' },
    fileCard: { background:'white', padding:'15px', borderRadius:'8px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)', border:'1px solid #eee' },
    fileName: { fontWeight:'bold', fontSize:'0.9rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
    fileActions: { display:'flex', gap:'10px', marginTop:'10px', justifyContent:'flex-end' },
    viewLink: { fontSize:'0.8rem', color:'#007bff', textDecoration:'none', border:'1px solid #007bff', padding:'4px 8px', borderRadius:'4px' },
    deleteFileBtn: { fontSize:'0.8rem', color:'#dc3545', background:'none', border:'1px solid #dc3545', padding:'4px 8px', borderRadius:'4px', cursor:'pointer' },

    editCard: { margin: '20px', padding: '20px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    input: { width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '80px', fontFamily: 'sans-serif' },
    saveBtn: { background: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginTop: '20px', fontSize: '1rem' },
    
    apptGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', paddingBottom: '30px' },
    apptCard: { background: 'white', borderRadius: '10px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderTop: '4px solid #ffc107' },
    apptHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' },
    statusBadge: { padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' },
    patientInfo: { display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' },
    patientAvatar: { width: '40px', height: '40px', background: '#e9ecef', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    actions: { display: 'flex', gap: '10px' },
    joinBtn: { width: '100%', padding: '10px', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' },
    logoutBtn: { margin:'20px', padding:'10px 20px', background:'#dc3545', color:'white', border:'none', borderRadius:'5px', cursor:'pointer' }
};

export default DoctorDashboard;