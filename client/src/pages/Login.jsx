import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('student@edumerge.demo');
    const [password, setPassword] = useState('password123'); // Default for demo
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    // ----------------------------------------------------------------------
    // AUTHENTICATION HANDLER
    // Attempt to log the user in and redirect to the dashboard on success
    // ----------------------------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/');
        } catch (error) {
            alert('Login failed. Please check credentials.');
        }
    };

    // ----------------------------------------------------------------------
    // RENDER UI
    // ----------------------------------------------------------------------
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel p-8 w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-indigo-400">Edumerge Support</h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Email</label>
                        <select value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                            <option value="student@edumerge.demo">Student (student@edumerge.demo)</option>
                            <option value="staff@edumerge.demo">Staff (staff@edumerge.demo)</option>
                            <option value="manager@edumerge.demo">Manager (manager@edumerge.demo)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" required />
                    </div>
                    <button type="submit" className="btn-primary mt-2">Login</button>
                </form>
            </div>
        </div>
    );
}
