import { useState } from 'react';
import api from '../services/api'; 
import { useNavigate, Link } from 'react-router-dom'; // <--- Import Link

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/login', { email, password });
            
            // --- THE FIX IS HERE ---
            // Backend returns: { "token": "eyJhb..." }
            // We need to extract the .token property
            const token = response.data.token; 
            
            if (!token) {
                setError("Login successful but no token received.");
                return;
            }

            localStorage.setItem('token', token);
            // -----------------------
            
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError('Invalid Credentials. Please try again.');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2>TeleMed Login</h2>
                <form onSubmit={handleLogin}>
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        style={styles.input}
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                        required 
                    />
                    <button type="submit" style={styles.button}>Login</button>
                </form>
                
                {error && <p style={{color: 'red'}}>{error}</p>}

                {/* --- ADDED LINK TO REGISTER PAGE --- */}
                <p style={{marginTop: '15px', fontSize: '0.9rem'}}>
                    New User? <Link to="/register" style={{color: '#007bff'}}>Create Account</Link>
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' },
    card: { padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' },
    input: { display: 'block', margin: '10px auto', padding: '10px', width: '250px', borderRadius: '4px', border: '1px solid #ccc' },
    button: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default Login;