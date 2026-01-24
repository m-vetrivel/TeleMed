import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
    const navigate = useNavigate();
    
    const [role, setRole] = useState('PATIENT');
    
    const [formData, setFormData] = useState({
        email: '', 
        password: '', 
        fullName: '', // <--- MAKE SURE THIS IS INITIALIZED
        gender: 'Male',
        // Patient Fields
        preExistingConditions: '', familyMedicalHistory: '', 
        allergies: '', currentMedications: '', previousSurgeries: '',
        preferredDoctorGender: 'No Preference', preferredLanguage: 'English',
        // Doctor Fields
        specialization: '', experienceYears: '', licenseNumber: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, role };
            await api.post('/auth/register', payload);
            alert('Registration Successful! Please Login.');
            navigate('/login');
        } catch (err) {
            console.error(err);
            alert('Registration Failed: ' + (err.response?.data?.message || 'Unknown Error'));
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Create Account</h2>
                
                <form onSubmit={handleSubmit}>
                    {/* --- ROLE SELECTION --- */}
                    <div style={styles.section}>
                        <label>I am a:</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.input}>
                            <option value="PATIENT">Patient</option>
                            <option value="DOCTOR">Doctor</option>
                        </select>
                    </div>

                    {/* --- COMMON FIELDS (For Both) --- */}
                    <input 
                        name="email" 
                        type="email" 
                        placeholder="Email Address" 
                        onChange={handleChange} 
                        required 
                        style={styles.input} 
                    />
                    
                    <input 
                        name="password" 
                        type="password" 
                        placeholder="Password" 
                        onChange={handleChange} 
                        required 
                        style={styles.input} 
                    />

                    {/* --- ✅ ADDED FULL NAME FIELD HERE --- */}
                    <input 
                        name="fullName" 
                        type="text" 
                        placeholder="Full Name (e.g. John Doe)" 
                        onChange={handleChange} 
                        required 
                        style={styles.input} 
                    />
                    
                    <select name="gender" onChange={handleChange} style={styles.input}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>

                    <hr style={{margin: '20px 0', border: '0', borderTop: '1px solid #eee'}}/>

                    {/* --- PATIENT SPECIFIC FIELDS --- */}
                    {role === 'PATIENT' && (
                        <div style={styles.dynamicSection}>
                            <h4 style={styles.subtitle}>Medical Profile</h4>
                            
                            <textarea name="preExistingConditions" placeholder="Pre-existing Conditions (e.g., Diabetes)" onChange={handleChange} style={styles.textarea} />
                            <textarea name="familyMedicalHistory" placeholder="Family Medical History" onChange={handleChange} style={styles.textarea} />
                            
                            <div style={styles.row}>
                                <input name="allergies" placeholder="Allergies (comma separated)" onChange={handleChange} style={styles.input} />
                                <input name="currentMedications" placeholder="Current Meds (comma separated)" onChange={handleChange} style={styles.input} />
                            </div>

                            <textarea name="previousSurgeries" placeholder="Previous Surgeries or Procedures" onChange={handleChange} style={styles.textarea} />

                            <h4 style={styles.subtitle}>Preferences</h4>
                            <div style={styles.row}>
                                <select name="preferredDoctorGender" onChange={handleChange} style={styles.input}>
                                    <option value="No Preference">Pref. Doctor: No Preference</option>
                                    <option value="Male">Pref. Doctor: Male</option>
                                    <option value="Female">Pref. Doctor: Female</option>
                                </select>
                                <input name="preferredLanguage" placeholder="Preferred Language" onChange={handleChange} style={styles.input} />
                            </div>
                        </div>
                    )}

                    {/* --- DOCTOR SPECIFIC FIELDS --- */}
                    {role === 'DOCTOR' && (
                        <div style={styles.dynamicSection}>
                            <h4 style={styles.subtitle}>Professional Details</h4>
                            <input name="specialization" placeholder="Specialization (e.g. General, Dental)" onChange={handleChange} style={styles.input} />
                            <div style={styles.row}>
                                <input name="experienceYears" type="number" placeholder="Years of Experience" onChange={handleChange} style={styles.input} />
                                <input name="licenseNumber" placeholder="Medical License Number" onChange={handleChange} style={styles.input} />
                            </div>
                        </div>
                    )}

                    <button type="submit" style={styles.button}>Register as {role}</button>
                </form>
                <p style={{marginTop:'10px', textAlign:'center'}}>Already have an account? <a href="/login">Login</a></p>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5', padding: '20px' },
    card: { background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '500px' },
    title: { textAlign: 'center', marginBottom: '20px', color: '#333' },
    subtitle: { color: '#666', marginBottom: '10px', marginTop: '10px' },
    section: { marginBottom: '15px' },
    input: { width: '100%', padding: '10px', margin: '8px 0', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '10px', margin: '8px 0', borderRadius: '5px', border: '1px solid #ccc', minHeight: '80px' },
    button: { width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', marginTop: '20px' },
    row: { display: 'flex', gap: '10px' }
};

export default Register;