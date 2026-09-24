import React, { useContext } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function MainLayout() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // ----------------------------------------------------------------------
    // EVENT HANDLERS
    // ----------------------------------------------------------------------
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // ----------------------------------------------------------------------
    // RENDER UI
    // The main shell of the application containing the sidebar and routing outlet
    // ----------------------------------------------------------------------
    return (
        <div className="flex h-screen overflow-hidden">
            <aside className="w-64 glass-panel m-4 flex flex-col hidden md:flex">
                <div className="p-6 text-xl font-bold text-indigo-400 border-b border-white/10">
                    EduSupport
                </div>
                <nav className="flex-1 p-4 flex flex-col gap-2">
                    <Link to="/" className="p-2 rounded hover:bg-white/5">Dashboard</Link>
                    <Link to="/tickets" className="p-2 rounded hover:bg-white/5">Tickets</Link>
                    {user?.role === 'STUDENT' && (
                        <Link to="/tickets/new" className="p-2 rounded bg-indigo-600 hover:bg-indigo-500 mt-4 text-center font-medium">Create Ticket</Link>
                    )}
                </nav>
                <div className="p-4 border-t border-white/10 text-sm">
                    <div className="font-semibold">{user?.name}</div>
                    <div className="text-slate-400 text-xs mb-2">{user?.role}</div>
                    <button onClick={handleLogout} className="text-red-400 hover:text-red-300 w-full text-left font-semibold">Logout</button>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <Outlet />
            </main>
        </div>
    );
}
