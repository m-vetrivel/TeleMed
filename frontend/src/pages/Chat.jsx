import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs'; // No more SockJS
import api from '../services/api';

const Chat = () => {
    const { recipientEmail } = useParams();
    const [messages, setMessages] = useState([]);
    const [msgInput, setMsgInput] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    
    // Use useRef to keep the client active across renders
    const stompClientRef = useRef(null);

    useEffect(() => {
        const setupChat = async () => {
            // 1. Get User Info
            const token = localStorage.getItem('token');
            if (!token) return;
            const payload = JSON.parse(atob(token.split('.')[1]));
            setCurrentUser(payload.sub);
            
            // 2. Load History
            try {
                const history = await api.get(`/messages/${payload.sub}/${recipientEmail}`);
                setMessages(history.data);
            } catch (err) {
                console.error("Could not load history", err);
            }

            // 3. Initialize WebSocket (Native)
            // Note: We use 'ws://' instead of 'http://'
            const client = new Client({
                brokerURL: 'ws://localhost:8080/ws-raw',
                connectHeaders: {},
                debug: (str) => {
                    console.log('STOMP: ' + str);
                },
                reconnectDelay: 5000, // Auto-reconnect if it drops
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            });

            client.onConnect = (frame) => {
                console.log('Connected to Chat! ' + frame);
                
                client.subscribe(`/user/${payload.sub}/queue/messages`, (message) => {
                    const newMessage = JSON.parse(message.body);
                    
                    // --- FIX: Ignore messages I sent myself ---
                    // (Because we already added them optimistically in sendMessage)
                    if (newMessage.senderEmail === payload.sub) {
                        return; 
                    }

                    // Only show if it matches the current conversation
                    if (newMessage.senderEmail === recipientEmail || newMessage.recipientEmail === recipientEmail) {
                        setMessages((prev) => [...prev, newMessage]);
                    }
                });
            };

            client.onStompError = (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            };

            client.activate(); // Start connection
            stompClientRef.current = client;
        };

        setupChat();

        return () => {
            // Cleanup on leave
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
        };
    }, [recipientEmail]);

    const sendMessage = () => {
        if (stompClientRef.current && stompClientRef.current.connected && msgInput) {
            const chatMessage = {
                senderEmail: currentUser,
                recipientEmail: recipientEmail,
                content: msgInput
            };

            // Send to Backend
            stompClientRef.current.publish({
                destination: "/app/chat",
                body: JSON.stringify(chatMessage),
            });
            
            // Update UI immediately (Optimistic UI)
            setMessages((prev) => [...prev, { ...chatMessage, timestamp: new Date() }]);
            setMsgInput("");
        } else {
            alert("Connection not active yet. Please wait a moment.");
        }
    };

    return (
        <div style={styles.container}>
            <h3>Chat with {recipientEmail}</h3>
            
            <div style={styles.chatBox}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={msg.senderEmail === currentUser ? styles.myMsg : styles.theirMsg}>
                        <strong>{msg.senderEmail === currentUser ? "Me" : "Them"}: </strong>
                        {msg.content}
                    </div>
                ))}
            </div>

            <div style={styles.inputArea}>
                <input 
                    value={msgInput} 
                    onChange={(e) => setMsgInput(e.target.value)} 
                    style={styles.input}
                    placeholder="Type a message..."
                />
                <button onClick={sendMessage} style={styles.button}>Send</button>
            </div>
        </div>
    );
};

const styles = {
    container: { maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' },
    chatBox: { height: '300px', overflowY: 'scroll', border: '1px solid #eee', padding: '10px', marginBottom: '10px', background: '#fff' },
    myMsg: { textAlign: 'right', color: 'blue', margin: '5px 0' },
    theirMsg: { textAlign: 'left', color: 'green', margin: '5px 0' },
    inputArea: { display: 'flex', gap: '10px' },
    input: { flex: 1, padding: '10px' },
    button: { padding: '10px 20px', background: '#007bff', color: 'white', border: 'none' }
};

export default Chat;