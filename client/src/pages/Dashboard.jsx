import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
    const { user } = useContext(AuthContext);
    const [metrics, setMetrics] = useState(null);
    const [staffData, setStaffData] = useState({ tickets: [] });
    const [studentData, setStudentData] = useState({ tickets: [], activities: [] });

    // ----------------------------------------------------------------------
    // 1. DATA FETCHING
    // Fetch data based on the user's role (Student, Staff, or Manager)
    // ----------------------------------------------------------------------
    useEffect(() => {
        if (user.role === 'STAFF') {
            // Staff members fetch their ticket queue
            api.get('/tickets')
                .then(res => setStaffData({ tickets: res.data }))
                .catch(console.error);
                
        } else if (user.role === 'STUDENT') {
            // Students fetch their own requests and recent public activities
            api.get('/tickets').then(async (res) => {
                const tickets = res.data;
                
                // Fetch activity timeline for their 3 most recent tickets
                const topTickets = tickets.slice(0, 3);
                let allActivities = [];
                
                try {
                    const detailPromises = topTickets.map(t => api.get(`/tickets/${t._id}`));
                    const details = await Promise.all(detailPromises);
                    
                    details.forEach(d => {
                        // Ensure students do not see internal staff notes
                        const publicActivities = d.data.activities.filter(a => !a.isInternal);
                        allActivities = [...allActivities, ...publicActivities];
                    });
                    
                    // Sort activities by date (newest first)
                    allActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                } catch (e) {
                    console.error("Failed to fetch activities", e);
                }
                
                setStudentData({ tickets, activities: allActivities.slice(0, 5) });
            }).catch(console.error);
            
        } else {
            // Managers fetch aggregate operational metrics
            api.get('/dashboard')
                .then(res => setMetrics(res.data))
                .catch(console.error);
        }
    }, [user.role]);

    // ----------------------------------------------------------------------
    // 2. STUDENT INTERFACE
    // Simple, reassuring UI focused on personal requests and actions required
    // ----------------------------------------------------------------------
    if (user.role === 'STUDENT') {
        const { tickets, activities } = studentData;
        const open = tickets.filter(t => t.status === 'OPEN').length;
        const inProgress = tickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length;
        const pending = tickets.filter(t => t.status === 'PENDING_STUDENT').length;
        const resolved = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
        
        const actionRequiredTickets = tickets.filter(t => t.status === 'PENDING_STUDENT');

        return (
            <div className="max-w-6xl mx-auto pb-10">
                <div className="glass-panel p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-slate-800 to-slate-900 border-l-4 border-indigo-500">
                    <div className="mb-4 md:mb-0 w-full md:w-auto">
                        <h1 className="text-3xl font-bold mb-4">Good evening, {user.name.split(' ')[0]} 👋</h1>
                        
                        {actionRequiredTickets.length > 0 ? (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mt-2 max-w-2xl">
                                <div className="flex items-center gap-2 text-amber-400 font-bold mb-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                    ACTION REQUIRED ({actionRequiredTickets.length})
                                </div>
                                <div className="text-slate-200 font-medium">{actionRequiredTickets[0].subject}</div>
                                <div className="text-sm text-amber-200/70 mb-3">We need additional information or documents from you to continue processing this request.</div>
                                <Link to={`/tickets/${actionRequiredTickets[0]._id}`} className="text-amber-400 hover:text-amber-300 text-sm font-bold flex items-center gap-1">View Request &rarr;</Link>
                            </div>
                        ) : (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mt-2 max-w-2xl flex items-start gap-3">
                                <div className="text-emerald-400 mt-0.5">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <div>
                                    <div className="text-emerald-400 font-bold mb-1">You're all caught up</div>
                                    <div className="text-sm text-emerald-200/60">No action is required from you right now. We'll notify you when something needs your attention.</div>
                                </div>
                            </div>
                        )}
                    </div>
                    <Link to="/tickets/new" className="btn-primary shrink-0 shadow-lg shadow-indigo-500/30 md:mt-0 mt-4">+ Create Ticket</Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="glass-panel p-6 text-center border-b-4 border-indigo-500 hover:bg-white/10 transition-colors">
                        <div className="text-3xl font-bold">{open}</div>
                        <div className="text-slate-400 text-sm mt-1 uppercase tracking-wider font-semibold">Open</div>
                    </div>
                    <div className="glass-panel p-6 text-center border-b-4 border-blue-500 hover:bg-white/10 transition-colors">
                        <div className="text-3xl font-bold">{inProgress}</div>
                        <div className="text-slate-400 text-sm mt-1 uppercase tracking-wider font-semibold">In Progress</div>
                    </div>
                    <div className="glass-panel p-6 text-center border-b-4 border-yellow-500 hover:bg-white/10 transition-colors">
                        <div className="text-3xl font-bold">{pending}</div>
                        <div className="text-slate-400 text-sm mt-1 uppercase tracking-wider font-semibold">Pending</div>
                    </div>
                    <div className="glass-panel p-6 text-center border-b-4 border-green-500 hover:bg-white/10 transition-colors">
                        <div className="text-3xl font-bold">{resolved}</div>
                        <div className="text-slate-400 text-sm mt-1 uppercase tracking-wider font-semibold">Resolved</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">My Recent Requests</h2>
                        <div className="glass-panel overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/10 text-sm text-slate-400 uppercase tracking-wider">
                                        <th className="p-4 font-semibold">Ticket</th>
                                        <th className="p-4 font-semibold">Subject</th>
                                        <th className="p-4 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.length === 0 && (
                                        <tr><td colSpan="3" className="p-8 text-center text-slate-400">No requests found.</td></tr>
                                    )}
                                    {tickets.slice(0, 5).map(t => (
                                        <tr key={t._id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                                            <td className="p-4 font-mono text-sm text-indigo-400 font-semibold">
                                                <Link to={`/tickets/${t._id}`} className="hover:underline">{t.ticketId}</Link>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-slate-200">{t.subject}</div>
                                                <div className="text-xs text-slate-400 mt-1">{t.category}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs rounded border font-semibold tracking-wide ${t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                                                    {t.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {tickets.length > 5 && (
                                <div className="p-3 text-center border-t border-white/5 bg-slate-800/30">
                                    <Link to="/tickets" className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold">View all tickets &rarr;</Link>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                        <div className="glass-panel p-6">
                            {activities.length === 0 ? (
                                <p className="text-slate-400 text-sm text-center py-8">No recent activity found.</p>
                            ) : (
                                <div className="flex flex-col gap-6">
                                    {activities.map(act => (
                                        <div key={act._id} className="relative pl-5 border-l-2 border-indigo-500/30 ml-2">
                                            <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                                            <div className="text-sm">
                                                {act.type === 'STATUS_CHANGE' || act.type === 'ASSIGNMENT' ? (
                                                    <span className="text-slate-200 font-medium">{act.content}</span>
                                                ) : (
                                                    <span className="text-slate-200"><span className="font-semibold text-indigo-300">{act.authorId?.name || 'Someone'}</span> added a comment</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1.5 font-medium">
                                                {new Date(act.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------------------------
    // 3. STAFF INTERFACE
    // Operational UI focused on managing personal queues and SLA deadlines
    // ----------------------------------------------------------------------
    if (user.role === 'STAFF') {
        const { tickets } = staffData;

        const myTickets = tickets.filter(t => {
            const assignedId = t.assignedTo?._id || t.assignedTo;
            return assignedId === user.id;
        });

        const unassigned = tickets.filter(t => !t.assignedTo);
        const inProgress = myTickets.filter(t => t.status === 'IN_PROGRESS');
        const pendingStudent = myTickets.filter(t => t.status === 'PENDING_STUDENT');
        const resolved = myTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');

        const now = new Date();
        const slaBreached = myTickets.filter(t => t.slaDeadline && new Date(t.slaDeadline) < now);
        const slaAtRisk = myTickets.filter(t => {
            if (!t.slaDeadline) return false;
            const diffHours = (new Date(t.slaDeadline) - now) / (1000 * 60 * 60);
            return diffHours >= 0 && diffHours < 4;
        });

        return (
            <div className="max-w-7xl mx-auto pb-10">
                <div className="glass-panel p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-slate-800 to-slate-900 border-l-4 border-indigo-500">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            Good evening, {user.name.split(' ')[0]} 👋
                        </h1>
                        <p className="text-slate-400">
                            Here's your support queue for today.
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 text-sm text-slate-400">
                        {myTickets.length} active request{myTickets.length !== 1 ? 's' : ''} assigned to you
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="glass-panel p-6 border-b-4 border-indigo-500">
                        <div className="text-3xl font-bold">{myTickets.length}</div>
                        <div className="text-slate-400 text-sm mt-1 uppercase tracking-wider font-semibold">My Queue</div>
                    </div>
                    <div className="glass-panel p-6 border-b-4 border-yellow-500">
                        <div className="text-3xl font-bold">{unassigned.length}</div>
                        <div className="text-slate-400 text-sm mt-1 uppercase tracking-wider font-semibold">Unassigned</div>
                    </div>
                    <div className="glass-panel p-6 border-b-4 border-blue-500">
                        <div className="text-3xl font-bold">{inProgress.length}</div>
                        <div className="text-slate-400 text-sm mt-1 uppercase tracking-wider font-semibold">In Progress</div>
                    </div>
                    <div className="glass-panel p-6 border-b-4 border-red-500">
                        <div className="text-3xl font-bold text-red-400">{slaAtRisk.length + slaBreached.length}</div>
                        <div className="text-slate-400 text-sm mt-1 uppercase tracking-wider font-semibold">SLA Attention</div>
                    </div>
                </div>

                {(slaAtRisk.length > 0 || slaBreached.length > 0) && (
                    <div className="glass-panel p-6 mb-8 border-l-4 border-red-500">
                        <h2 className="text-lg font-bold mb-4 text-white">SLA Attention Required</h2>
                        <div className="flex flex-col gap-3">
                            {[...slaBreached, ...slaAtRisk].slice(0, 5).map(ticket => {
                                const breached = new Date(ticket.slaDeadline) < new Date();
                                return (
                                    <div key={ticket._id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-800/50 border border-white/5 rounded-lg p-4">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-indigo-400 font-semibold">{ticket.ticketId}</span>
                                                <span className={`text-xs px-2 py-1 rounded border font-bold ${breached ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'}`}>
                                                    {breached ? 'SLA BREACHED' : 'AT RISK'}
                                                </span>
                                            </div>
                                            <div className="text-slate-200 font-medium mt-2">{ticket.subject}</div>
                                        </div>
                                        <Link to={`/tickets/${ticket._id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">
                                            View Ticket &rarr;
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-bold mb-4">My Assigned Tickets</h2>
                        <div className="glass-panel overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/10 text-sm text-slate-400 uppercase tracking-wider">
                                        <th className="p-4">Ticket</th>
                                        <th className="p-4">Student</th>
                                        <th className="p-4">Priority</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myTickets.slice(0, 8).map(ticket => (
                                        <tr key={ticket._id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                                            <td className="p-4">
                                                <Link to={`/tickets/${ticket._id}`} className="font-mono text-indigo-400 font-semibold hover:underline">
                                                    {ticket.ticketId}
                                                </Link>
                                            </td>
                                            <td className="p-4 text-slate-300">{ticket.studentId?.name || 'Student'}</td>
                                            <td className="p-4"><span className="text-xs font-bold text-red-400">{ticket.priority}</span></td>
                                            <td className="p-4"><span className="px-2 py-1 text-xs rounded border bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-semibold">{ticket.status.replace('_', ' ')}</span></td>
                                        </tr>
                                    ))}
                                    {myTickets.length === 0 && (
                                        <tr><td colSpan="4" className="p-8 text-center text-slate-400">No tickets are currently assigned to you.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold mb-4">Queue Snapshot</h2>
                        <div className="glass-panel p-6">
                            <div className="flex justify-between py-3 border-b border-white/5">
                                <span className="text-slate-400">Pending Student</span>
                                <span className="font-bold text-yellow-400">{pendingStudent.length}</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-white/5">
                                <span className="text-slate-400">Resolved</span>
                                <span className="font-bold text-green-400">{resolved.length}</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-white/5">
                                <span className="text-slate-400">SLA At Risk</span>
                                <span className="font-bold text-yellow-400">{slaAtRisk.length}</span>
                            </div>
                            <div className="flex justify-between py-3">
                                <span className="text-slate-400">SLA Breached</span>
                                <span className="font-bold text-red-400">{slaBreached.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------------------------
    // 4. MANAGER INTERFACE (Default Fallback)
    // High-density administrative console focused on analytics and oversight
    // ----------------------------------------------------------------------
    if (!metrics) return <div className="p-8 text-center text-slate-400">Loading dashboard data...</div>;

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div className="max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="glass-panel p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-slate-800 to-slate-900 border-l-4 border-indigo-500 shadow-xl shadow-indigo-900/20">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Good evening, {user.name.split(' ')[0]} 👋</h1>
                    <p className="text-slate-400 font-medium">Management Overview: Monitor support operations, SLA performance, and resolution across the institution.</p>
                </div>
            </div>

            {/* Executive Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="glass-panel p-6 border-b-4 border-indigo-500 hover:bg-white/5 transition-colors">
                    <div className="text-3xl font-bold text-white">{metrics.totalTickets}</div>
                    <div className="text-slate-400 text-sm mt-1 uppercase tracking-wider font-semibold">Total Requests</div>
                </div>
                <div className="glass-panel p-6 border-b-4 border-blue-500 hover:bg-white/5 transition-colors">
                    <div className="text-3xl font-bold text-white">{metrics.openTickets}</div>
                    <div className="text-slate-400 text-sm mt-1 uppercase tracking-wider font-semibold">Open Requests</div>
                </div>
                <div className="glass-panel p-6 border-b-4 border-green-500 hover:bg-white/5 transition-colors">
                    <div className="text-3xl font-bold text-white">{metrics.resolvedTickets}</div>
                    <div className="text-slate-400 text-sm mt-1 uppercase tracking-wider font-semibold">Resolved</div>
                </div>
                <div className="glass-panel p-6 border-b-4 border-red-500 hover:bg-white/5 transition-colors bg-red-500/5">
                    <div className="text-3xl font-bold text-red-400">{metrics.slaBreached}</div>
                    <div className="text-red-400/70 text-sm mt-1 uppercase tracking-wider font-bold">SLA Breached</div>
                </div>
            </div>

            {/* Support Health */}
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Support Health
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="glass-panel p-6 flex flex-col items-center justify-center border border-white/5 shadow-lg">
                    <div className="text-4xl mb-2 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">🟢</div>
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">On Track</div>
                    <div className="text-3xl font-bold text-emerald-400">{metrics.slaOnTrack || 0}</div>
                </div>
                <div className="glass-panel p-6 flex flex-col items-center justify-center border border-white/5 bg-amber-500/5 shadow-lg shadow-amber-900/10 border-b-2 border-b-amber-500/30">
                    <div className="text-4xl mb-2 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">🟡</div>
                    <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">At Risk</div>
                    <div className="text-3xl font-bold text-amber-400">{metrics.slaAtRisk || 0}</div>
                </div>
                <div className="glass-panel p-6 flex flex-col items-center justify-center border border-white/5 bg-red-500/5 shadow-lg shadow-red-900/10 border-b-2 border-b-red-500/30">
                    <div className="text-4xl mb-2 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]">🔴</div>
                    <div className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1">Breached</div>
                    <div className="text-3xl font-bold text-red-400">{metrics.slaBreached || 0}</div>
                </div>
            </div>

            {/* SLA Attention */}
            {metrics.slaAttentionTickets?.length > 0 && (
                <div className="glass-panel p-6 mb-8 border-l-4 border-red-500 shadow-xl shadow-red-500/10">
                    <h2 className="text-lg font-bold mb-4 text-white uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        SLA Attention Required
                    </h2>
                    <div className="flex flex-col gap-3">
                        {metrics.slaAttentionTickets.map(ticket => {
                            const breached = new Date(ticket.slaDeadline) < new Date();
                            const diffMs = Math.abs(new Date(ticket.slaDeadline) - new Date());
                            const hours = Math.floor(diffMs / (1000 * 60 * 60));
                            return (
                                <div key={ticket._id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-white/10 rounded-lg p-4 hover:bg-slate-800 transition-colors">
                                    <div className="flex items-start md:items-center gap-4">
                                        <div className="text-2xl drop-shadow-md">{breached ? '🔴' : '🟡'}</div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-mono text-indigo-400 font-bold">{ticket.ticketId}</span>
                                                <span className="text-sm font-semibold text-slate-200">{ticket.subject}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs">
                                                <span className="font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">{ticket.priority}</span>
                                                <span className="text-slate-500">•</span>
                                                <span className="text-slate-400 font-medium">{ticket.assignedTo?.name || 'Unassigned'}</span>
                                                <span className="text-slate-500">•</span>
                                                <span className={`font-bold ${breached ? 'text-red-400' : 'text-amber-400'}`}>
                                                    {breached ? `Breached by ${hours}h` : `${hours}h remaining`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Link to={`/tickets/${ticket._id}`} className="shrink-0 text-indigo-400 hover:text-indigo-300 text-sm font-bold px-4 py-2 bg-indigo-500/10 rounded border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">
                                        Review Ticket &rarr;
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Status Chart */}
                <div className="glass-panel p-6 shadow-lg">
                    <h2 className="text-lg font-bold mb-6 text-center text-slate-200">Requests by Status</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.ticketsByStatus} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="_id" type="category" width={100} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff'}} />
                                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24}>
                                    {metrics.ticketsByStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Chart */}
                <div className="glass-panel p-6 shadow-lg">
                    <h2 className="text-lg font-bold mb-6 text-center text-slate-200">Requests by Category</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={metrics.ticketsByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count" label={({_id, percent}) => `${_id} ${(percent * 100).toFixed(0)}%`} labelLine={false} stroke="none">
                                    {metrics.ticketsByCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Staff Workload */}
            {metrics.staffWorkload?.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        Staff Workload
                    </h2>
                    <div className="glass-panel overflow-hidden shadow-xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-800/80 border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider">
                                    <th className="p-5 font-bold">Staff Member</th>
                                    <th className="p-5 font-bold text-center">Total Assigned</th>
                                    <th className="p-5 font-bold text-center text-indigo-400">Active Workload</th>
                                    <th className="p-5 font-bold text-center text-emerald-400">Resolved</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.staffWorkload.map(staff => (
                                    <tr key={staff.staffId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-5 font-semibold text-slate-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-sm border border-indigo-500/30">
                                                    {staff.name.charAt(0)}
                                                </div>
                                                {staff.name}
                                            </div>
                                        </td>
                                        <td className="p-5 text-center font-bold text-slate-400 text-lg">{staff.totalAssigned}</td>
                                        <td className="p-5 text-center font-bold text-indigo-400 text-lg">{staff.active}</td>
                                        <td className="p-5 text-center font-bold text-emerald-400 text-lg">{staff.resolved}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
