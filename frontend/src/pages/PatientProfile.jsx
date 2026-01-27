import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const PatientProfile = () => {
    const navigate = useNavigate();
    
    // --- STATE MANAGEMENT ---
    const [patient, setPatient] = useState({});
    const [formData, setFormData] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    
    // File States
    const [photoUrl, setPhotoUrl] = useState(null);
    const [reports, setReports] = useState([]);
    
    // Report Upload Form State
    const [newReportName, setNewReportName] = useState("");
    const [reportFile, setReportFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Refs
    const photoInputRef = useRef(null);

    // --- INITIAL DATA FETCHING ---
    useEffect(() => {
        fetchProfile();
        fetchReports();
        fetchPhoto();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/patients/me');
            const data = res.data || {};
            setPatient(data);
            setFormData(data);
        } catch (err) { console.error("Profile load error", err); }
    };

    const fetchPhoto = async () => {
        try {
            const res = await api.get('/files/photo', { responseType: 'blob' });
            if (res.data.size > 0) {
                setPhotoUrl(URL.createObjectURL(res.data));
            }
        } catch (err) { }
    };

    const fetchReports = async () => {
        try {
            const res = await api.get('/files/reports');
            setReports(res.data);
        } catch (err) { console.error("Reports load error", err); }
    };

    // --- HANDLERS: PHOTO UPLOAD ---
    const handlePhotoSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            await api.post('/files/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
            setPhotoUrl(URL.createObjectURL(file)); 
            alert("Profile Photo Updated! 📸");
        } catch (err) { alert("Photo upload failed"); }
    };

    // --- HANDLERS: REPORT UPLOAD ---
    const handleReportUpload = async () => {
        if (!newReportName || !reportFile) return alert("Please enter a name and select a file.");
        
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", reportFile);
        formData.append("reportName", newReportName);

        try {
            await api.post('/files/report', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
            alert("Report Uploaded Successfully! 📂");
            setNewReportName("");
            setReportFile(null);
            fetchReports(); 
        } catch (err) { 
            alert("Report upload failed"); 
        } finally {
            setIsUploading(false);
        }
    };

    // --- NEW: DELETE REPORT HANDLER ---
    const handleDeleteReport = async (fileId) => {
        if(!window.confirm("Are you sure you want to delete this report? This cannot be undone.")) return;

        try {
            await api.delete(`/files/${fileId}`);
            setReports(prev => prev.filter(r => r.id !== fileId)); // Remove from UI immediately
            alert("Report deleted successfully 🗑️");
        } catch (err) {
            console.error(err);
            alert("Failed to delete report.");
        }
    };

    // --- HANDLERS: PROFILE DATA UPDATE ---
    const handleUpdate = async () => {
        try {
            await api.put('/patients/me', formData);
            setPatient(formData);
            setIsEditing(false);
            alert("Profile Updated Successfully! ✅");
        } catch (err) { 
            console.error(err);
            alert("Update Failed"); 
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (!patient) return <div style={{padding:'20px'}}>Loading Profile...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>← Back</button>
                <h2 style={{color:'white', margin:0}}>My Medical Profile</h2>
                <div style={{width:'50px'}}></div>
            </div>

            <div style={styles.card}>
                
                {/* --- 1. HEADER ROW: PHOTO & EDIT BUTTON --- */}
                <div style={styles.headerRow}>
                    <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                        <div 
                            style={styles.avatarWrapper} 
                            onClick={() => photoInputRef.current.click()}
                            title="Click to change photo"
                        >
                            {photoUrl ? (
                                <img src={photoUrl} alt="Profile" style={styles.avatarImg} />
                            ) : (
                                <div style={styles.avatarPlaceholder}>👤</div>
                            )}
                            <div style={styles.cameraIcon}>📷</div>
                        </div>
                        <input 
                            type="file" 
                            ref={photoInputRef} 
                            style={{display:'none'}} 
                            onChange={handlePhotoSelect} 
                            accept="image/*"
                        />

                        <div>
                            <h3 style={{margin:0}}>{patient.fullName || "New Patient"}</h3>
                            <span style={{fontSize:'0.9rem', color:'#666'}}>
                                {patient.user?.email}
                            </span>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsEditing(!isEditing)} 
                        style={isEditing ? styles.cancelBtn : styles.editBtn}
                    >
                        {isEditing ? "Cancel" : "Edit Details ✏️"}
                    </button>
                </div>

                <hr style={{margin:'20px 0', border:'none', borderTop:'1px solid #eee'}} />

                {/* --- 2. HEALTH REPORTS SECTION --- */}
                <h4 style={styles.sectionHeader}>Health Reports & Tests</h4>
                
                <div style={styles.uploadBox}>
                    <input 
                        type="text" 
                        placeholder="Report Name (e.g. Blood Test Jan)" 
                        value={newReportName}
                        onChange={(e) => setNewReportName(e.target.value)}
                        style={styles.inputSmall}
                    />
                    <input 
                        type="file" 
                        onChange={(e) => setReportFile(e.target.files[0])}
                        style={{fontSize:'0.9rem'}}
                    />
                    <button 
                        onClick={handleReportUpload} 
                        disabled={isUploading}
                        style={styles.uploadBtn}
                    >
                        {isUploading ? "Uploading..." : "Upload Report ⬆️"}
                    </button>
                </div>

                {/* Reports List */}
                <div style={styles.reportsList}>
                    {reports.length === 0 ? <p style={{color:'#888', fontStyle:'italic'}}>No reports uploaded yet.</p> : (
                        reports.map(report => (
                            <div key={report.id} style={styles.reportItem}>
                                <div style={{flex: 1}}>
                                    <strong>{report.reportName}</strong>
                                    <div style={{fontSize:'0.8rem', color:'#666'}}>{new Date(report.uploadDate).toLocaleDateString()}</div>
                                </div>
                                
                                {/* Actions Container */}
                                <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                                    <a 
                                        href={`http://localhost:8080/api/files/${report.id}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        style={styles.viewLink}
                                    >
                                        View 📄
                                    </a>
                                    <button 
                                        onClick={() => handleDeleteReport(report.id)}
                                        style={styles.deleteIconBtn}
                                        title="Delete File"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <hr style={{margin:'25px 0', border:'none', borderTop:'1px solid #eee'}} />

                {/* --- 3. PERSONAL & CONTACT INFO --- */}
                <h4 style={styles.sectionHeader}>Personal & Contact Info</h4>
                <div style={styles.grid}>
                    <Field label="Full Name" name="fullName" value={formData.fullName} isEditing={isEditing} onChange={setFormData} formData={formData} />
                    <Field label="Age" name="age" type="number" value={formData.age} isEditing={isEditing} onChange={setFormData} formData={formData} />
                    <Field label="Gender" name="gender" value={formData.gender} isEditing={isEditing} onChange={setFormData} formData={formData} placeholder="e.g. Male/Female" />
                    <Field label="Blood Group" name="bloodGroup" value={formData.bloodGroup} isEditing={isEditing} onChange={setFormData} formData={formData} placeholder="e.g. O+" />
                    <Field label="Weight (kg)" name="weight" value={formData.weight} isEditing={isEditing} onChange={setFormData} formData={formData} />
                    <Field label="Height (cm)" name="height" value={formData.height} isEditing={isEditing} onChange={setFormData} formData={formData} />
                    <Field label="Phone Number" name="phoneNumber" value={formData.phoneNumber} isEditing={isEditing} onChange={setFormData} formData={formData} />
                    <Field label="Address" name="address" value={formData.address} isEditing={isEditing} onChange={setFormData} formData={formData} />
                </div>

                {/* --- 4. MEDICAL HISTORY --- */}
                <h4 style={styles.sectionHeader}>Medical History</h4>
                
                <TextAreaField label="General Summary" name="medicalHistory" placeholder="General overview..." value={formData.medicalHistory} isEditing={isEditing} onChange={setFormData} formData={formData} />
                <TextAreaField label="Pre-Existing Conditions" name="preExistingConditions" placeholder="e.g. Diabetes..." value={formData.preExistingConditions} isEditing={isEditing} onChange={setFormData} formData={formData} />
                <TextAreaField label="Family Medical History" name="familyMedicalHistory" placeholder="e.g. Heart disease..." value={formData.familyMedicalHistory} isEditing={isEditing} onChange={setFormData} formData={formData} />

                <div style={styles.grid}>
                    <Field label="Allergies" name="allergies" placeholder="e.g. Penicillin" value={formData.allergies} isEditing={isEditing} onChange={setFormData} formData={formData} />
                    <Field label="Medications" name="currentMedications" placeholder="e.g. Metformin" value={formData.currentMedications} isEditing={isEditing} onChange={setFormData} formData={formData} />
                </div>

                <TextAreaField label="Previous Surgeries" name="previousSurgeries" placeholder="e.g. Appendectomy..." value={formData.previousSurgeries} isEditing={isEditing} onChange={setFormData} formData={formData} />

                {/* --- 5. PREFERENCES --- */}
                <h4 style={styles.sectionHeader}>Preferences</h4>
                <div style={styles.grid}>
                    {isEditing ? (
                        <div style={{marginBottom:'15px'}}>
                            <label style={styles.label}>Preferred Doctor Gender</label>
                            <select style={styles.input} value={formData.preferredDoctorGender || ''} onChange={(e) => setFormData({...formData, preferredDoctorGender: e.target.value})}>
                                <option value="">No Preference</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                    ) : (
                        <Field label="Preferred Doctor Gender" value={formData.preferredDoctorGender || 'No Preference'} isEditing={false} />
                    )}
                    <Field label="Preferred Language" name="preferredLanguage" value={formData.preferredLanguage} isEditing={isEditing} onChange={setFormData} formData={formData} />
                </div>

                {isEditing && <button onClick={handleUpdate} style={styles.saveBtn}>Save Full Profile</button>}
                
                <hr style={{margin:'40px 0 20px 0', border:'none', borderTop:'2px dashed #eee'}} />
                <button onClick={handleLogout} style={styles.logoutBtn}>Logout 🚪</button>
            </div>
        </div>
    );
};

const Field = ({ label, name, value, isEditing, onChange, formData, placeholder, type="text" }) => (
    <div style={{marginBottom:'15px'}}>
        <label style={styles.label}>{label}</label>
        {isEditing ? <input type={type} style={styles.input} value={value || ''} placeholder={placeholder} onChange={(e) => onChange({...formData, [name]: e.target.value})} /> : <div style={styles.value}>{value || '-'}</div>}
    </div>
);

const TextAreaField = ({ label, name, value, isEditing, onChange, formData, placeholder }) => (
    <div style={{marginBottom:'15px'}}>
        <label style={styles.label}>{label}</label>
        {isEditing ? <textarea style={styles.textarea} value={value || ''} placeholder={placeholder} onChange={(e) => onChange({...formData, [name]: e.target.value})} /> : <div style={{...styles.value, minHeight:'60px', whiteSpace: 'pre-wrap'}}>{value || '-'}</div>}
    </div>
);

const styles = {
    container: { minHeight:'100vh', background:'#f0f2f5', fontFamily:'sans-serif', paddingBottom: '40px' },
    header: { background:'#007bff', padding:'20px', display:'flex', justifyContent:'space-between', alignItems:'center' },
    backBtn: { background:'rgba(255,255,255,0.2)', color:'white', border:'none', padding:'8px 15px', borderRadius:'20px', cursor:'pointer' },
    card: { maxWidth:'750px', margin:'30px auto 0', background:'white', padding:'30px', borderRadius:'15px', boxShadow:'0 4px 10px rgba(0,0,0,0.1)', position:'relative' },
    headerRow: { display:'flex', justifyContent:'space-between', alignItems:'center' },
    avatarWrapper: { position:'relative', cursor:'pointer', width:'70px', height:'70px' },
    avatarImg: { width:'70px', height:'70px', borderRadius:'50%', objectFit:'cover', border:'2px solid #007bff' },
    avatarPlaceholder: { width:'70px', height:'70px', background:'#e3f2fd', borderRadius:'50%', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'2rem' },
    cameraIcon: { position:'absolute', bottom:0, right:0, background:'white', borderRadius:'50%', padding:'2px', fontSize:'0.8rem', boxShadow:'0 2px 5px rgba(0,0,0,0.2)' },
    uploadBox: { background:'#f9f9f9', padding:'15px', borderRadius:'10px', border:'1px dashed #ccc', display:'flex', gap:'10px', alignItems:'center', marginBottom:'20px', flexWrap:'wrap' },
    inputSmall: { padding:'8px', borderRadius:'5px', border:'1px solid #ccc', flex:1 },
    uploadBtn: { background:'#28a745', color:'white', border:'none', padding:'8px 15px', borderRadius:'5px', cursor:'pointer' },
    reportsList: { display:'flex', flexDirection:'column', gap:'10px' },
    reportItem: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px', background:'white', border:'1px solid #eee', borderRadius:'8px', boxShadow:'0 2px 2px rgba(0,0,0,0.02)' },
    viewLink: { color:'#007bff', textDecoration:'none', fontWeight:'bold', fontSize:'0.9rem', border:'1px solid #007bff', padding:'5px 10px', borderRadius:'5px' },
    deleteIconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '5px' },
    sectionHeader: { color: '#007bff', borderBottom: '2px solid #e3f2fd', paddingBottom: '5px', marginTop: '25px', marginBottom: '15px' },
    grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' },
    label: { display:'block', fontSize:'0.85rem', color:'#666', marginBottom:'5px', fontWeight:'bold' },
    value: { padding:'10px', background:'#f9f9f9', borderRadius:'5px', border:'1px solid #eee', color:'#333' },
    input: { width:'100%', padding:'10px', borderRadius:'5px', border:'1px solid #ccc', boxSizing:'border-box' },
    textarea: { width:'100%', padding:'10px', borderRadius:'5px', border:'1px solid #ccc', minHeight:'80px', fontFamily:'sans-serif', boxSizing:'border-box', resize:'vertical' },
    editBtn: { background:'#f8f9fa', border:'1px solid #ddd', padding:'8px 15px', borderRadius:'5px', cursor:'pointer', fontWeight:'bold' },
    cancelBtn: { background:'#ffebee', color:'#d32f2f', border:'none', padding:'8px 15px', borderRadius:'5px', cursor:'pointer', fontWeight:'bold' },
    saveBtn: { width:'100%', padding:'12px', background:'#28a745', color:'white', border:'none', borderRadius:'5px', fontSize:'1rem', marginTop:'20px', cursor:'pointer', fontWeight:'bold' },
    logoutBtn: { width:'100%', padding: '12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' }
};

export default PatientProfile;