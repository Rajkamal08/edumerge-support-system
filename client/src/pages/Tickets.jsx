import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Tickets() {
    const { user } = useContext(AuthContext);
    
    // ----------------------------------------------------------------------
    // 1. STATE: ALL TICKETS & FILTERS
    // ----------------------------------------------------------------------
    const [allTickets, setAllTickets] = useState([]);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [assignmentFilter, setAssignmentFilter] = useState('ALL'); // Accepts: ALL, MINE, UNASSIGNED

    // ----------------------------------------------------------------------
    // 2. DATA FETCHING & API ACTIONS
    // ----------------------------------------------------------------------
    const loadTickets = () => {
        api.get('/tickets')
           .then(res => setAllTickets(res.data))
           .catch(console.error);
    };

    useEffect(() => {
        loadTickets();
    }, []);

    // Allows staff to immediately assign a ticket to themselves from the queue
    const handleClaim = async (id, e) => {
        e.preventDefault();
        try {
            await api.patch(`/tickets/${id}/assign`, { assignedTo: user.id });
            loadTickets(); // Refresh the list to reflect the new assignment
        } catch(err) {
            console.error('Failed to claim ticket', err);
        }
    };

    // ----------------------------------------------------------------------
    // 3. UTILITIES & FILTERING
    // ----------------------------------------------------------------------
    
    // Quickly determine if a ticket is breached, at risk, or safely on track
    const getSlaHealth = (deadline, status) => {
        if (status === 'RESOLVED' || status === 'CLOSED') return { icon: '✓', color: 'text-slate-500', label: 'Done' };
        
        const diffHours = (new Date(deadline) - new Date()) / (1000 * 60 * 60);
        if (diffHours < 0) return { icon: '🔴', color: 'text-red-400', label: 'Breached' };
        if (diffHours < 4) return { icon: '🟡', color: 'text-amber-400', label: 'At Risk' };
        return { icon: '🟢', color: 'text-emerald-400', label: 'On Track' };
    };

    // Apply the active dashboard filters to the global ticket list
    const filteredTickets = allTickets.filter(t => {
        if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
        if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
        if (assignmentFilter === 'MINE' && t.assignedTo?._id !== user.id) return false;
        if (assignmentFilter === 'UNASSIGNED' && t.assignedTo) return false;
        
        return true;
    });

    // ----------------------------------------------------------------------
    // 4. RENDER UI
    // ----------------------------------------------------------------------
    return (
        <div className="max-w-7xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Support Queue</h1>
                    <p className="text-slate-400">View and manage support requests across the institution.</p>
                </div>
                {user.role === 'STUDENT' && (
                    <Link to="/tickets/new" className="btn-primary shrink-0 mt-4 md:mt-0 shadow-lg shadow-indigo-500/20">+ Create Ticket</Link>
                )}
            </div>

            {user.role !== 'STUDENT' && (
                <div className="glass-panel p-4 mb-6 flex flex-wrap gap-4 items-center bg-slate-800/40">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assignment:</label>
                        <select value={assignmentFilter} onChange={e => setAssignmentFilter(e.target.value)} className="bg-slate-900 border border-slate-700 rounded text-sm px-3 py-1.5 focus:ring-indigo-500/50">
                            <option value="ALL">All Tickets</option>
                            <option value="MINE">My Assigned</option>
                            <option value="UNASSIGNED">Unassigned Queue</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-900 border border-slate-700 rounded text-sm px-3 py-1.5 focus:ring-indigo-500/50">
                            <option value="ALL">All Statuses</option>
                            <option value="OPEN">Open</option>
                            <option value="ASSIGNED">Assigned</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="PENDING_STUDENT">Pending Student</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Priority:</label>
                        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="bg-slate-900 border border-slate-700 rounded text-sm px-3 py-1.5 focus:ring-indigo-500/50">
                            <option value="ALL">All Priorities</option>
                            <option value="URGENT">Urgent</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
                    </div>
                    
                    <div className="ml-auto text-sm text-slate-400 font-medium">
                        Showing {filteredTickets.length} tickets
                    </div>
                </div>
            )}

            <div className="glass-panel overflow-hidden border border-white/10 shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-800/80 border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider">
                            <th className="p-5 font-bold">Request</th>
                            {user.role !== 'STUDENT' && <th className="p-5 font-bold">Requester</th>}
                            <th className="p-5 font-bold">Status</th>
                            <th className="p-5 font-bold">SLA Health</th>
                            <th className="p-5 font-bold">Assigned To</th>
                            <th className="p-5 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTickets.length === 0 && (
                            <tr><td colSpan={user.role !== 'STUDENT' ? 6 : 5} className="p-12 text-center text-slate-400 font-medium">No tickets match these filters.</td></tr>
                        )}
                        {filteredTickets.map(t => {
                            const health = getSlaHealth(t.slaDeadline, t.status);
                            return (
                                <tr key={t._id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <td className="p-5">
                                        <div className="font-semibold text-slate-200 mb-1.5">{t.subject}</div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="font-mono text-indigo-400 font-bold">{t.ticketId}</span>
                                            <span className="text-slate-600">•</span>
                                            <span className="text-slate-400 font-medium">{t.category}</span>
                                            {(t.priority === 'HIGH' || t.priority === 'URGENT') && <span className="text-red-400 font-bold text-[10px] uppercase ml-1 px-1.5 py-0.5 bg-red-400/10 rounded">{t.priority}</span>}
                                        </div>
                                    </td>
                                    
                                    {user.role !== 'STUDENT' && (
                                        <td className="p-5">
                                            <div className="text-sm font-medium text-slate-300">{t.studentId?.name || 'Unknown'}</div>
                                            <div className="text-xs text-slate-500 mt-1">{t.department}</div>
                                        </td>
                                    )}

                                    <td className="p-5">
                                        <span className={`px-2.5 py-1.5 text-[10px] rounded border font-bold tracking-wider uppercase shadow-sm ${t.status === 'PENDING_STUDENT' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                                            {t.status.replace('_', ' ')}
                                        </span>
                                    </td>

                                    <td className="p-5">
                                        <div className={`flex items-center gap-2 text-xs font-bold ${health.color}`}>
                                            <span>{health.icon}</span>
                                            {health.label && <span>{health.label}</span>}
                                        </div>
                                    </td>

                                    <td className="p-5">
                                        {t.assignedTo ? (
                                            <div className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-[10px] font-bold text-white shadow-inner">
                                                    {t.assignedTo.name.charAt(0)}
                                                </div>
                                                {t.assignedTo.name}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-500 italic font-medium">Unassigned</span>
                                        )}
                                    </td>

                                    <td className="p-5 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {user.role !== 'STUDENT' && !t.assignedTo && t.status !== 'CLOSED' && (
                                                <button onClick={(e) => handleClaim(t._id, e)} className="text-xs bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 px-3 py-1.5 rounded font-bold transition-colors opacity-0 group-hover:opacity-100 border border-emerald-500/20">
                                                    Claim
                                                </button>
                                            )}
                                            <Link to={`/tickets/${t._id}`} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded hover:bg-indigo-500/30 transition-colors">
                                                Review &rarr;
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
