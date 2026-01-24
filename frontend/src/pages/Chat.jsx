// import { useEffect, useState, useRef } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { Client } from '@stomp/stompjs';
// import api from '../services/api';

// const peerConfiguration = {
//     iceServers: [
//         { urls: 'stun:stun.l.google.com:19302' },
//         { urls: 'stun:stun1.l.google.com:19302' },
//         { urls: 'stun:stun2.l.google.com:19302' },
//         { urls: 'stun:stun3.l.google.com:19302' },
//         { urls: 'stun:stun4.l.google.com:19302' },
//     ]
// };

// const Chat = () => {
//     const { recipientEmail } = useParams();
//     const navigate = useNavigate();
    
//     // UI State
//     const [messages, setMessages] = useState([]);
//     const [msgInput, setMsgInput] = useState("");
//     const [currentUser, setCurrentUser] = useState(null);
//     const [isAppointmentActive, setIsAppointmentActive] = useState(false);
//     const [loadingCheck, setLoadingCheck] = useState(true);

//     // Video State
//     const [isVideoActive, setIsVideoActive] = useState(false);
//     const [incomingCall, setIncomingCall] = useState(false);
//     const [remoteStreamActive, setRemoteStreamActive] = useState(false); // New: Track if video is flowing

//     // Refs
//     const stompClientRef = useRef(null);
//     const localVideoRef = useRef(null);
//     const remoteVideoRef = useRef(null);
//     const peerConnectionRef = useRef(null);
//     const iceCandidateQueue = useRef([]);

//     useEffect(() => {
//         const setupChat = async () => {
//             const token = localStorage.getItem('token');
//             if (!token) { navigate('/'); return; }
//             const payload = JSON.parse(atob(token.split('.')[1]));
//             setCurrentUser(payload.sub);

//             // 1. Check Appointment
//             try {
//                 const res = await api.get('/appointments');
//                 const now = new Date();
//                 const activeAppt = res.data.find(appt => {
//                     const otherPerson = appt.doctor?.user?.email === recipientEmail 
//                                      ? appt.doctor.user 
//                                      : appt.patient?.email === recipientEmail ? appt.patient : null;
//                     if (!otherPerson) return false;
//                     const start = new Date(appt.appointmentTime);
//                     const end = new Date(appt.endTime);
//                     return now >= start && now <= end;
//                 });
//                 setIsAppointmentActive(!!activeAppt);
//             } catch (err) { console.error(err); } finally { setLoadingCheck(false); }

//             // 2. Load Messages
//             try {
//                 const history = await api.get(`/messages/${payload.sub}/${recipientEmail}`);
//                 setMessages(history.data);
//             } catch (err) { console.error(err); }

//             // 3. Setup WebSocket
//             const client = new Client({
//                 brokerURL: 'wss://justa-preoccasioned-sharlene.ngrok-free.dev/ws-raw', // CHECK THIS URL
//                 reconnectDelay: 5000,
//                 onStompError: (frame) => console.error('Broker Error:', frame.headers['message']),
//             });

//             client.onConnect = () => {
//                 client.subscribe(`/user/${payload.sub}/queue/messages`, (msg) => {
//                     const newMessage = JSON.parse(msg.body);
//                     if (newMessage.senderEmail !== payload.sub) setMessages(prev => [...prev, newMessage]);
//                 });
//                 client.subscribe(`/user/${payload.sub}/queue/video`, (msg) => {
//                     handleVideoSignal(JSON.parse(msg.body), payload.sub);
//                 });
//             };

//             client.activate();
//             stompClientRef.current = client;
//             // --- ADD THIS BLOCK HERE ---
//             const handleTabClose = () => {
//                 if (client && client.connected) {
//                     client.publish({
//                         destination: "/app/video",
//                         body: JSON.stringify({ type: 'LEAVE', recipientEmail })
//                     });
//                 }
//             };
//             window.addEventListener('beforeunload', handleTabClose);
//             // ---------------------------
//         };

//         setupChat();

//         return () => {
//            window.removeEventListener('beforeunload', handleTabClose); // Clean listener
//             if (stompClientRef.current) stompClientRef.current.deactivate();
//             cleanupCallLogic();
//         };
//     }, [recipientEmail, navigate]);

//     // --- SIGNALING HANDLERS ---
//     const handleVideoSignal = async (signal, myEmail) => {
//         try {
//             if (signal.type === 'OFFER') {
//                 setIncomingCall(true);
//                 const pc = createPeerConnection(myEmail);
//                 peerConnectionRef.current = pc;
//                 await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
//                 processIceQueue(pc);
//             } else if (signal.type === 'ANSWER') {
//                 const pc = peerConnectionRef.current;
//                 if (pc && pc.signalingState !== 'closed') {
//                     await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
//                     processIceQueue(pc);
//                 }
//             } else if (signal.type === 'ICE') {
//                 const candidate = new RTCIceCandidate(signal.candidate);
//                 const pc = peerConnectionRef.current;
//                 if (pc && pc.remoteDescription && pc.signalingState !== 'closed') {
//                     await pc.addIceCandidate(candidate).catch(e => console.warn("ICE Error", e));
//                 } else {
//                     iceCandidateQueue.current.push(candidate);
//                 }
//             } else if (signal.type === 'LEAVE') {
//                 cleanupCallLogic();
//             }
//         } catch (err) {
//             console.error("Signal Error:", err);
//         }
//     };

//     const processIceQueue = async (pc) => {
//         while (iceCandidateQueue.current.length > 0) {
//             const candidate = iceCandidateQueue.current.shift();
//             if (pc.signalingState !== 'closed') await pc.addIceCandidate(candidate).catch(e => {});
//         }
//     };

//     const createPeerConnection = (myEmail) => {
//         const pc = new RTCPeerConnection(peerConfiguration);

//         pc.onicecandidate = (event) => {
//             if (event.candidate && stompClientRef.current?.connected) {
//                 stompClientRef.current.publish({
//                     destination: "/app/video",
//                     body: JSON.stringify({ type: 'ICE', candidate: event.candidate, recipientEmail })
//                 });
//             }
//         };

//         pc.ontrack = (event) => {
//             const remoteStream = event.streams[0];
//             const track = event.track;

//             // Handle "Muted" tracks (Network issues)
//             track.onunmute = () => {
//                 console.log("📺 Track Unmuted - Video receiving!");
//                 setRemoteStreamActive(true);
//                 if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
//             };

//             track.onmute = () => {
//                 console.log("📺 Track Muted - Video frozen");
//                 setRemoteStreamActive(false);
//             };

//             // Initial Play Attempt
//             if (remoteVideoRef.current) {
//                 remoteVideoRef.current.srcObject = remoteStream;
//                 remoteVideoRef.current.play().catch(e => console.log("Play catch:", e.name)); // Ignore AbortError
//             }
//         };

//         return pc;
//     };

//     // --- ACTIONS ---
//     const startCall = async () => {
//         setIsVideoActive(true);
//         const pc = createPeerConnection(currentUser);
//         peerConnectionRef.current = pc;
        
//         try {
//             const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//             if (localVideoRef.current) localVideoRef.current.srcObject = stream;
//             stream.getTracks().forEach(track => pc.addTrack(track, stream));

//             const offer = await pc.createOffer();
//             await pc.setLocalDescription(offer);

//             if (stompClientRef.current?.connected) {
//                 stompClientRef.current.publish({
//                     destination: "/app/video",
//                     body: JSON.stringify({ type: 'OFFER', sdp: offer, recipientEmail })
//                 });
//             }
//         } catch (err) {
//             console.error("Start Call Error:", err);
//             setIsVideoActive(false);
//         }
//     };

//     const answerCall = async () => {
//         setIsVideoActive(true);
//         setIncomingCall(false);
//         const pc = peerConnectionRef.current;
        
//         try {
//             const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//             if (localVideoRef.current) localVideoRef.current.srcObject = stream;
//             stream.getTracks().forEach(track => pc.addTrack(track, stream));

//             const answer = await pc.createAnswer();
//             await pc.setLocalDescription(answer);

//             if (stompClientRef.current?.connected) {
//                 stompClientRef.current.publish({
//                     destination: "/app/video",
//                     body: JSON.stringify({ type: 'ANSWER', sdp: answer, recipientEmail })
//                 });
//             }
//         } catch (err) {
//             console.error("Answer Call Error:", err);
//         }
//     };

//     const endCall = () => {
//         if (stompClientRef.current?.connected) {
//             stompClientRef.current.publish({
//                 destination: "/app/video",
//                 body: JSON.stringify({ type: 'LEAVE', recipientEmail })
//             });
//         }
//         cleanupCallLogic();
//     };

//     const cleanupCallLogic = () => {
//         setIsVideoActive(false);
//         setIncomingCall(false);
//         setRemoteStreamActive(false);
//         if (peerConnectionRef.current) {
//             peerConnectionRef.current.close();
//             peerConnectionRef.current = null;
//         }
//         if (localVideoRef.current?.srcObject) {
//             localVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
//         }
//     };

//     const sendMessage = () => {
//         if (!isAppointmentActive) return alert("Outside appointment time.");
//         if (stompClientRef.current?.connected && msgInput) {
//             const chatMessage = { senderEmail: currentUser, recipientEmail, content: msgInput };
//             stompClientRef.current.publish({ destination: "/app/chat", body: JSON.stringify(chatMessage) });
//             setMessages(prev => [...prev, { ...chatMessage, timestamp: new Date() }]);
//             setMsgInput("");
//         }
//     };

//     return (
//         <div style={styles.container}>
//             <div style={styles.header}>
//                 <h3>Chat with {recipientEmail}</h3>
//                 {isAppointmentActive ? (
//                     <>
//                         {!isVideoActive && !incomingCall && <button onClick={startCall} style={styles.videoBtn}>📹 Video Call</button>}
//                         {incomingCall && <button onClick={answerCall} style={styles.answerBtn}>📞 Accept Call</button>}
//                     </>
//                 ) : <span style={{color:'red'}}>Appointment inactive</span>}
//             </div>

//             {isVideoActive && (
//                 <div style={styles.videoContainer}>
//                     <video ref={localVideoRef} autoPlay playsInline muted style={styles.localVideo} />
//                     <div style={{width:'100%', height:'100%'}}>
//                         <video ref={remoteVideoRef} autoPlay playsInline style={styles.remoteVideo} />
//                         {/* New: Status Indicator */}
//                         {!remoteStreamActive && (
//                             <div style={styles.loadingOverlay}>Waiting for connection... (Weak Signal)</div>
//                         )}
//                     </div>
//                     <button onClick={endCall} style={styles.endBtn}>End Call</button>
//                 </div>
//             )}

//             <div style={styles.chatBox}>
//                 {messages.map((msg, idx) => (
//                     <div key={idx} style={msg.senderEmail === currentUser ? styles.myMsg : styles.theirMsg}>
//                         <strong>{msg.senderEmail === currentUser ? "Me" : "Them"}: </strong>{msg.content}
//                     </div>
//                 ))}
//             </div>
//             <div style={styles.inputArea}>
//                 <input value={msgInput} onChange={(e) => setMsgInput(e.target.value)} style={styles.input} />
//                 <button onClick={sendMessage} style={styles.button}>Send</button>
//             </div>
//         </div>
//     );
// };

// const styles = {
//     container: { maxWidth: '800px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' },
//     header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
//     videoBtn: { padding: '8px 15px', background: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
//     answerBtn: { padding: '8px 15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
//     videoContainer: { display: 'flex', gap: '10px', marginBottom: '20px', height: '300px', background: '#000', padding: '10px', borderRadius: '8px', position: 'relative' },
//     localVideo: { width: '150px', position: 'absolute', bottom: '20px', right: '20px', border: '2px solid white', borderRadius: '4px', zIndex: 10 },
//     remoteVideo: { width: '100%', height: '100%', objectFit: 'cover' },
//     loadingOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'rgba(0,0,0,0.7)', zIndex: 5 },
//     endBtn: { position: 'absolute', top: '10px', right: '10px', background: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', zIndex: 20 },
//     chatBox: { height: '300px', overflowY: 'scroll', border: '1px solid #eee', padding: '10px', marginBottom: '10px' },
//     myMsg: { textAlign: 'right', color: 'blue', margin: '5px 0' },
//     theirMsg: { textAlign: 'left', color: 'green', margin: '5px 0' },
//     inputArea: { display: 'flex', gap: '10px' },
//     input: { flex: 1, padding: '10px' },
//     button: { padding: '10px 20px', background: '#007bff', color: 'white', border: 'none' }
// };

// export default Chat;


import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import api from '../services/api';

const Chat = () => {
    const { recipientEmail } = useParams();
    const navigate = useNavigate();
    
    // --- STATE ---
    const [messages, setMessages] = useState([]);
    const [msgInput, setMsgInput] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [isAppointmentActive, setIsAppointmentActive] = useState(false);
    const [loadingCheck, setLoadingCheck] = useState(true);
    const [activeAppointmentId, setActiveAppointmentId] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // --- NEW: MENTION SYSTEM STATE ---
    const [showMentions, setShowMentions] = useState(false);
    const [myReports, setMyReports] = useState([]);
    const [mentionFilter, setMentionFilter] = useState("");

    // --- REFS ---
    const stompClientRef = useRef(null);
    const jitsiContainerRef = useRef(null); 
    const jitsiApiRef = useRef(null);
    const fileInputRef = useRef(null); 

    // --- HELPER: FORMAT TIME ---
    const formatTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        return date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    };

    // 1. DATA FETCHING & WEBSOCKET SETUP
    useEffect(() => {
        let mounted = true;
        const setupPage = async () => {
            const token = localStorage.getItem('token');
            if (!token) { navigate('/'); return; }

            let payload;
            try {
                const parts = token.split('.');
                payload = JSON.parse(atob(parts[1]));
                if (mounted) setCurrentUser(payload.sub);
            } catch (e) {
                localStorage.removeItem('token'); navigate('/'); return;
            }

            // --- FETCH REPORTS (For @mentions) ---
            try {
                const reportRes = await api.get('/files/reports');
                setMyReports(reportRes.data);
            } catch (err) { console.error("Failed to load reports"); }

            // --- CHECK APPOINTMENT STATUS ---
            try {
                const res = await api.get('/appointments');
                const now = new Date();
                
                const activeAppt = res.data.find(appt => {
                    const patientEmail = appt.patient?.user?.email || appt.patient?.email;
                    const doctorEmail = appt.doctor?.user?.email || appt.doctor?.email;
                    const isMyDoctor = doctorEmail === recipientEmail && patientEmail === payload.sub;
                    const isMyPatient = patientEmail === recipientEmail && doctorEmail === payload.sub;

                    if (!isMyDoctor && !isMyPatient) return false;

                    const start = new Date(appt.appointmentTime);
                    const isSameDay = now.toDateString() === start.toDateString();
                    return isSameDay; 
                });
                
                if (mounted && activeAppt) {
                    setIsAppointmentActive(true);
                    setActiveAppointmentId(activeAppt.id);
                }
            } catch (err) { console.error(err); } finally { if (mounted) setLoadingCheck(false); }

            // --- FETCH CHAT HISTORY ---
            try {
                const history = await api.get(`/messages/${payload.sub}/${recipientEmail}`);
                if (mounted) setMessages(history.data);
            } catch (err) { console.error(err); }

            // --- WEBSOCKET SETUP ---
            if (stompClientRef.current) stompClientRef.current.deactivate();
            const client = new Client({
                brokerURL: 'ws://localhost:8080/ws-raw', 
                reconnectDelay: 5000,
            });

            client.onConnect = () => {
                client.subscribe(`/user/${payload.sub}/queue/messages`, (msg) => {
                    if (!mounted) return;
                    const newMessage = JSON.parse(msg.body);
                    if (newMessage.senderEmail === recipientEmail) {
                        setMessages(prev => [...prev, newMessage]);
                    }
                });
            };
            client.activate();
            stompClientRef.current = client;
        };
        setupPage();
        return () => {
            mounted = false;
            if (stompClientRef.current) stompClientRef.current.deactivate();
            if (jitsiApiRef.current) jitsiApiRef.current.dispose();
        };
    }, [recipientEmail, navigate]);

    // 2. JITSI LAUNCHER (Video)
    useEffect(() => {
        if (isAppointmentActive && !loadingCheck && currentUser && jitsiContainerRef.current && activeAppointmentId) {
            if (jitsiApiRef.current) return;
            const loadJitsiScript = () => {
                if (window.JitsiMeetExternalAPI) { startJitsiMeeting(); return; }
                const script = document.createElement("script");
                script.src = "https://meet.guifi.net/external_api.js";
                script.async = true;
                script.onload = () => startJitsiMeeting();
                document.body.appendChild(script);
            };
            const startJitsiMeeting = () => {
                if (!jitsiContainerRef.current) return;
                const domain = "meet.guifi.net";
                const safeRoomName = `TeleMed_Appt_${activeAppointmentId}`;
                const options = {
                    roomName: safeRoomName,
                    width: "100%",
                    height: "100%",
                    parentNode: jitsiContainerRef.current,
                    userInfo: { displayName: currentUser },
                    configOverwrite: { startWithAudioMuted: false, startWithVideoMuted: false, prejoinPageEnabled: false, enableLobby: false },
                    interfaceConfigOverwrite: { TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'hangup', 'tileview'], SHOW_JITSI_WATERMARK: false }
                };
                const api = new window.JitsiMeetExternalAPI(domain, options);
                jitsiApiRef.current = api;
                api.addEventListeners({
                    videoConferenceLeft: () => { navigate('/dashboard'); api.dispose(); jitsiApiRef.current = null; }
                });
            };
            loadJitsiScript();
        }
    }, [isAppointmentActive, loadingCheck, currentUser, activeAppointmentId, navigate]);

    // --- NEW: HANDLE INPUT CHANGE (DETECT @) ---
    const handleInputChange = (e) => {
        const val = e.target.value;
        setMsgInput(val);

        // Check if the last word starts with @
        const lastWord = val.split(" ").pop();
        if (lastWord.startsWith("@")) {
            setShowMentions(true);
            setMentionFilter(lastWord.substring(1).toLowerCase()); // Remove @ for searching
        } else {
            setShowMentions(false);
        }
    };

    // --- NEW: SEND EXISTING REPORT VIA MENTION ---
    const sendReport = (report) => {
        if (!stompClientRef.current) return;

        const chatMessage = {
            senderEmail: currentUser,
            recipientEmail: recipientEmail,
            content: `Shared report: ${report.reportName}`, 
            fileUrl: `/api/files/${report.id}`, // Use existing ID
            fileName: report.fileName,
            type: 'FILE', 
            timestamp: new Date().toISOString()
        };
        
        stompClientRef.current.publish({ destination: "/app/chat", body: JSON.stringify(chatMessage) });
        setMessages(prev => [...prev, chatMessage]);
        
        // Clear input and hide menu
        setMsgInput(""); 
        setShowMentions(false);
    };

    // --- STANDARD SEND ---
    const sendMessage = () => {
        if (!isAppointmentActive) return alert("Appointment is not active.");
        if (stompClientRef.current && msgInput) {
            const chatMessage = {
                senderEmail: currentUser,
                recipientEmail: recipientEmail,
                content: msgInput,
                type: 'TEXT', 
                timestamp: new Date().toISOString()
            };
            stompClientRef.current.publish({ destination: "/app/chat", body: JSON.stringify(chatMessage) });
            setMessages(prev => [...prev, chatMessage]);
            setMsgInput("");
            setShowMentions(false);
        }
    };

    // --- FILE UPLOAD (New Files) ---
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("reportName", "Chat Doc: " + file.name);

        try {
            const uploadRes = await api.post('/files/report', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
            const savedFile = uploadRes.data; 
            if (stompClientRef.current) {
                const chatMessage = {
                    senderEmail: currentUser,
                    recipientEmail: recipientEmail,
                    content: `Shared a document: ${file.name}`, 
                    fileUrl: `/api/files/${savedFile.id}`, 
                    fileName: file.name,
                    type: 'FILE', 
                    timestamp: new Date().toISOString()
                };
                stompClientRef.current.publish({ destination: "/app/chat", body: JSON.stringify(chatMessage) });
                setMessages(prev => [...prev, chatMessage]);
            }
        } catch (err) { alert("File upload failed!"); } finally { setIsUploading(false); e.target.value = null; }
    };

    // --- RENDER MESSAGE CONTENT ---
    const renderMessageContent = (msg) => {
        if (msg.type === 'FILE' || msg.fileUrl) {
            const fullUrl = `http://localhost:8080${msg.fileUrl}`;
            const isImage = msg.fileName?.match(/\.(jpeg|jpg|png|gif)$/i);
            return (
                <div>
                    {isImage ? <img src={fullUrl} alt="attachment" style={{maxWidth: '200px', borderRadius: '8px', border:'1px solid #ddd'}} /> : <div style={{fontSize: '30px'}}>📄</div>}
                    <a href={fullUrl} target="_blank" rel="noreferrer" style={{color: '#007bff', textDecoration: 'underline'}}>Download {msg.fileName || "File"}</a>
                </div>
            );
        }
        return msg.content;
    };

    // Filter reports for the dropdown
    const filteredReports = myReports.filter(r => r.reportName.toLowerCase().includes(mentionFilter));

    return (
        <div style={styles.container}>
            <div style={styles.videoSection}>
                {loadingCheck ? <div style={{color:'white'}}>Checking...</div> : isAppointmentActive ? 
                    <div ref={jitsiContainerRef} style={{ width: '100%', height: '100%' }} /> : 
                    <div style={styles.inactiveMsg}><h2>🚫 Not Active</h2><button onClick={() => navigate('/dashboard')} style={styles.backBtn}>Back</button></div>}
            </div>

            <div style={styles.chatSection}>
                <div style={styles.chatHeader}><h4>Chat with {recipientEmail}</h4></div>
                <div style={styles.chatBox}>
                    {messages.map((msg, idx) => (
                        <div key={msg.timestamp || idx} style={msg.senderEmail === currentUser ? styles.myMsg : styles.theirMsg}>
                            <div style={styles.msgContent}>
                                <strong>{msg.senderEmail === currentUser ? "Me" : "Them"}: </strong>
                                {renderMessageContent(msg)}
                            </div>
                            <div style={styles.timestamp}>{formatTime(msg.timestamp)}</div>
                        </div>
                    ))}
                    {isUploading && <div style={{textAlign: 'center', color: '#888'}}>Uploading to Health Records... ⏳</div>}
                </div>

                <div style={styles.inputArea}>
                    
                    {/* --- MENTION POPUP (New) --- */}
                    {showMentions && (
                        <div style={styles.mentionPopup}>
                            <div style={styles.mentionHeader}>
                                Select a Report to Send
                                <button 
                                    onClick={() => setShowMentions(false)}
                                    style={{float:'right', background:'none', border:'none', cursor:'pointer', fontSize:'0.8rem'}}
                                >❌</button>
                            </div>
                            
                            {filteredReports.length > 0 ? (
                                filteredReports.map(report => (
                                    <div 
                                        key={report.id} 
                                        style={styles.mentionItem}
                                        onClick={() => sendReport(report)}
                                    >
                                        📄 {report.reportName}
                                    </div>
                                ))
                            ) : (
                                <div style={{padding:'10px', color:'#999', fontStyle:'italic', fontSize:'0.85rem'}}>
                                    No reports found matching "{mentionFilter}".<br/>
                                    <small>Upload reports in your Profile first.</small>
                                </div>
                            )}
                        </div>
                    )}

                    <input type="file" ref={fileInputRef} style={{display: 'none'}} onChange={handleFileSelect}/>
                    
                    <button 
                        onClick={() => fileInputRef.current.click()} 
                        style={styles.attachBtn} 
                        disabled={!isAppointmentActive || isUploading}
                        title="Attach File"
                    >
                        📎
                    </button>

                    <input 
                        value={msgInput} 
                        onChange={handleInputChange} // <--- UPDATED HANDLER
                        style={styles.input} 
                        disabled={!isAppointmentActive}
                        placeholder="Type message or @ to send report..."
                    />
                    <button onClick={sendMessage} style={styles.sendBtn} disabled={!isAppointmentActive}>Send</button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' },
    videoSection: { flex: 7, background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRight: '1px solid #333' },
    chatSection: { flex: 3, display: 'flex', flexDirection: 'column', background: '#f8f9fa', position: 'relative' }, 
    chatHeader: { padding: '15px', background: '#007bff', color: 'white' },
    chatBox: { flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' },
    myMsg: { alignSelf: 'flex-end', background: '#dcf8c6', padding: '8px 12px', borderRadius: '10px 10px 0 10px', maxWidth: '80%', boxShadow: '0 1px 1px rgba(0,0,0,0.1)' },
    theirMsg: { alignSelf: 'flex-start', background: '#fff', padding: '8px 12px', borderRadius: '10px 10px 10px 0', border: '1px solid #ddd', maxWidth: '80%', boxShadow: '0 1px 1px rgba(0,0,0,0.1)' },
    msgContent: { marginBottom: '4px' },
    timestamp: { fontSize: '0.75rem', color: '#666', textAlign: 'right', marginTop: '2px' },
    inputArea: { padding: '15px', display: 'flex', gap: '10px', background: '#eee', alignItems: 'center', position: 'relative' }, 
    input: { flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' },
    sendBtn: { padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    attachBtn: { padding: '10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1.2rem' },
    inactiveMsg: { textAlign: 'center', color: 'white' },
    backBtn: { marginTop: '20px', padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px'},
    
    // --- NEW POPUP STYLES ---
    mentionPopup: {
        position: 'absolute',
        bottom: '70px',
        left: '20px',
        width: '250px',
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 -4px 15px rgba(0,0,0,0.2)',
        zIndex: 9999,
        maxHeight: '200px',
        overflowY: 'auto'
    },
    mentionHeader: {
        padding: '8px',
        fontSize: '0.8rem',
        color: '#666',
        background: '#f8f9fa',
        borderBottom: '1px solid #eee'
    },
    mentionItem: {
        padding: '10px',
        cursor: 'pointer',
        borderBottom: '1px solid #eee',
        fontSize: '0.9rem',
        transition: 'background 0.2s',
        ':hover': { background: '#f0f0f0' }
    }
};

export default Chat;