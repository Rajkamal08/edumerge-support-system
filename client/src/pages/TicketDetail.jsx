import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function TicketDetail() {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    
    // ----------------------------------------------------------------------
    // 1. STATE MANAGEMENT
    // ----------------------------------------------------------------------
    const [data, setData] = useState(null);
    const [comment, setComment] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [error, setError] = useState('');
    const [staffList, setStaffList] = useState([]);

    // ----------------------------------------------------------------------
    // 2. DATA FETCHING
    // Fetch the ticket details and activity timeline
    // ----------------------------------------------------------------------
    const loadData = () => {
        api.get(`/tickets/${id}`).then(res => {
            setData(res.data);
            setNewStatus(res.data.ticket.status);
            setError('');
        }).catch(err => setError(err.response?.data?.message || 'Error loading ticket'));
    };

    useEffect(() => { 
        loadData();
        if (user.role === 'MANAGER') {
            api.get('/staff').then(res => setStaffList(res.data)).catch(console.error);
        }
    }, [id, user.role]);

    // ----------------------------------------------------------------------
    // 3. ACTION HANDLERS
    // Functions for submitting comments, changing status, and assigning tickets
    // ----------------------------------------------------------------------
    const handleComment = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/tickets/${id}/activity`, { content: comment, isInternal });
            setComment('');
            setIsInternal(false);
            loadData(); // Reload to fetch the new comment
        } catch (err) {
            setError('Failed to post comment');
        }
    };

    const handleStatusChange = async () => {
        try {
            await api.patch(`/tickets/${id}/status`, { status: newStatus });
            loadData(); // Reload to reflect status and new activity log
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handleAssign = async (assignedToId) => {
        try {
            await api.patch(`/tickets/${id}/assign`, { assignedTo: assignedToId || user.id });
            loadData(); // Reload to reflect assignment
        } catch (err) {
            setError('Failed to assign ticket');
        }
    };

    // ----------------------------------------------------------------------
    // 4. UTILITY FUNCTIONS
    // Helpers for calculating SLA health and formatting dates
    // ----------------------------------------------------------------------
    const getTicketAge = (createdAt) => {
        const diffMs = Math.max(0, Date.now() - new Date(createdAt).getTime());

        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const days = Math.floor(totalMinutes / (60 * 24));
        const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
        const minutes = totalMinutes % 60;

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const getSlaHealth = (deadline) => {
        const now = new Date();
        const end = new Date(deadline);
        const diffMs = end - now;
        if (diffMs < 0) return { color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30', text: '🔴 Delayed - SLA Breached' };
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours < 4) return { color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30', text: `🟡 Attention - ${Math.floor(diffHours)}h remaining` };
        return { color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30', text: `🟢 On track - ${Math.floor(diffHours)}h remaining` };
    };

    const getNextSteps = (status) => {
        switch (status) {
            case 'OPEN': return "Your request is in the queue and will be assigned to a staff member shortly.";
            case 'ASSIGNED': return "Staff will review your request and begin processing it.";
            case 'IN_PROGRESS': return "Staff is actively working on resolving your request.";
            case 'PENDING_STUDENT': return "Action required: Please provide the requested information or document so we can continue processing.";
            case 'RESOLVED': return "Your request has been resolved. If you have further issues, you may reopen it.";
            case 'CLOSED': return "This request is closed. No further action will be taken.";
            case 'REOPENED': return "Request reopened. Staff will review the issue again.";
            default: return "Pending review.";
        }
    };

    const renderProgress = (currentStatus) => {
        const steps = [
            'OPEN',
            'ASSIGNED',
            'IN_PROGRESS',
            'PENDING_STUDENT',
            'RESOLVED',
            'CLOSED'
        ];
        let currentIndex = steps.indexOf(currentStatus);
        if (currentStatus === 'REOPENED') currentIndex = 2;

        return (
            <div className="flex items-center gap-1 mt-6 text-xs font-semibold overflow-x-auto pb-2">
                {steps.map((step, idx) => (
                    <React.Fragment key={step}>
                        <div className={`flex flex-col items-center gap-1.5 min-w-[65px] ${idx <= currentIndex ? 'text-indigo-400' : 'text-slate-500'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${idx <= currentIndex ? 'border-indigo-400 bg-indigo-400/20' : 'border-slate-600 bg-transparent'}`}>
                                {idx < currentIndex && <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                {idx === currentIndex && <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>}
                            </div>
                            <span className="text-[10px] tracking-wide">{step.replace('_', ' ')}</span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`h-px w-6 shrink-0 mb-3 ${idx < currentIndex ? 'bg-indigo-400/50' : 'bg-slate-700'}`}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    if (!data) return <div className="p-8 text-center text-slate-400">Loading...</div>;
    
    // ----------------------------------------------------------------------
    // 5. RENDER LOGIC
    // ----------------------------------------------------------------------
    const { ticket, activities } = data;
    const slaHealth = getSlaHealth(ticket.slaDeadline);
    const ticketAge = getTicketAge(ticket.createdAt);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            <div className="lg:col-span-2 flex flex-col gap-6">
                {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded">{error}</div>}

                <div className="glass-panel p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-white">{ticket.ticketId}: {ticket.subject}</h1>
                            <p className="text-slate-400 text-sm mt-1">
                                Category: <span className="font-medium text-slate-300">{ticket.category}</span> |
                                Priority: <span className="text-red-400 font-bold ml-1">{ticket.priority}</span>
                            </p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-xs border font-bold tracking-wide uppercase shadow-sm ${ticket.status === 'PENDING_STUDENT' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'}`}>
                            {ticket.status.replace('_', ' ')}
                        </span>
                    </div>

                    <div className="bg-slate-800/50 p-5 rounded-lg border border-white/5 mb-6 text-slate-200">
                        <p className="whitespace-pre-wrap">{ticket.description}</p>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Workflow Progress</h3>
                        {renderProgress(ticket.status)}
                    </div>
                </div>

                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Activity Timeline
                    </h3>
                    <div className="flex flex-col gap-6">
                        {activities.map(act => (
                            <div key={act._id} className="flex gap-4">
                                <div className="w-2.5 h-2.5 mt-2 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                                <div className="flex-1">
                                    <div className="text-sm text-slate-400">
                                        <span className="font-semibold text-slate-200">{act.authorId?.name || 'System'}</span>
                                        {act.authorId?.role ? <span className="text-xs ml-1 px-1.5 py-0.5 bg-slate-800 rounded">({act.authorId.role})</span> : ''}
                                        <span className="mx-2 text-slate-600">•</span>
                                        <span className="text-xs">{new Date(act.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                        {act.type === 'NOTE' && <span className="ml-2 text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">Internal Staff Note</span>}
                                    </div>
                                    <div className={`mt-2 p-3 rounded-md border ${act.type === 'STATUS_CHANGE' || act.type === 'ASSIGNMENT' ? 'bg-indigo-900/10 border-indigo-500/20 text-indigo-300 text-sm font-medium' : act.type === 'NOTE' ? 'bg-amber-900/10 border-amber-500/20 text-amber-100 text-sm italic' : 'bg-slate-800/50 border-white/5 text-slate-200'}`}>
                                        {act.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleComment} className="mt-8 flex flex-col gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                        <div className="flex gap-3">
                            <input type="text" value={comment} onChange={e => setComment(e.target.value)} className="flex-1 bg-transparent border-none focus:ring-0 p-1 text-white placeholder-slate-500" placeholder="Type a comment or reply..." required />
                            <button type="submit" className="btn-primary whitespace-nowrap px-6 py-2">Post Reply</button>
                        </div>
                        {user.role !== 'STUDENT' && (
                            <div className="flex items-center gap-2 px-2 border-t border-white/5 pt-2 mt-1">
                                <input type="checkbox" id="internalNote" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/30" />
                                <label htmlFor="internalNote" className="text-xs text-slate-400 cursor-pointer font-medium hover:text-slate-300">Save as internal staff note (hidden from student)</label>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {/* WHAT HAPPENS NEXT CARD */}
                <div className={`glass-panel p-5 border-l-4 ${ticket.status === 'PENDING_STUDENT' ? 'border-amber-500' : 'border-indigo-500'}`}>
                    <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                        {ticket.status === 'PENDING_STUDENT' ? (
                            <><svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> Action Required</>
                        ) : (
                            <><svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> What happens next?</>
                        )}
                    </h3>
                    <p className={`text-sm leading-relaxed ${ticket.status === 'PENDING_STUDENT' ? 'text-amber-200/80 font-medium' : 'text-slate-300'}`}>
                        {getNextSteps(ticket.status)}
                    </p>
                </div>

                <div className="glass-panel p-6">
                    <h3 className="font-bold text-white mb-4 uppercase tracking-wider text-xs border-b border-white/10 pb-2">Ticket Summary</h3>

                    <div className="mb-4">
                        <div className="text-xs text-slate-500 mb-1">Created Date</div>
                        <div className="text-sm font-medium">{new Date(ticket.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                    </div>

                    <div className="mb-4">
                        <div className="text-xs text-slate-500 mb-1">Ticket Age</div>
                        <div className="text-sm font-semibold text-indigo-300">{ticketAge}</div>
                    </div>

                    <div className="mb-4">
                        <div className="text-xs text-slate-500 mb-1">Department Routing</div>
                        <div className="text-sm font-medium">{ticket.department}</div>
                    </div>

                    <div className="mb-4">
                        <div className="text-xs text-slate-500 mb-1">Assigned Staff</div>
                        <div className="flex gap-2 items-center text-sm font-medium">
                            {ticket.assignedTo?.name || <span className="text-slate-500 italic">Unassigned</span>}
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10">
                        <div className="text-xs text-slate-500 mb-2">Service Level Agreement (SLA)</div>
                        <div className={`text-sm font-bold p-2.5 rounded border ${slaHealth.bg} ${slaHealth.color}`}>
                            {slaHealth.text}
                        </div>
                        {ticket.totalPausedDuration > 0 && (
                            <div className="text-xs text-slate-400 mt-2">
                                * SLA was paused for {Math.round(ticket.totalPausedDuration / 60000)} minutes while waiting for student input.
                            </div>
                        )}
                    </div>
                </div>

                {user.role !== 'STUDENT' && (
                    <div className="glass-panel p-6 border-t-4 border-emerald-500">
                        <h3 className="font-bold text-white mb-4 uppercase tracking-wider text-xs border-b border-white/10 pb-2">Staff Operations</h3>

                        <div className="mb-5">
                            <label className="block text-xs text-slate-400 mb-2">Ticket Ownership</label>
                            <div className="flex gap-2 items-center">
                                {!ticket.assignedTo ? (
                                    <button onClick={() => handleAssign()} className="w-full text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded transition-colors shadow-lg shadow-emerald-500/20">Claim this Ticket</button>
                                ) : (
                                    <div className="w-full">
                                        <div className="text-sm px-3 py-2 bg-slate-800 rounded border border-slate-700 flex justify-between mb-2">
                                            <span className="text-slate-400">Owner:</span>
                                            <span className="font-semibold text-emerald-400">{ticket.assignedTo.name}</span>
                                        </div>
                                        {user.role === 'MANAGER' && staffList.length > 0 && (
                                            <div className="flex gap-2">
                                                <select id="reassignSelect" className="flex-1 bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white">
                                                    <option value="">-- Reassign to --</option>
                                                    {staffList.filter(s => s._id !== ticket.assignedTo._id).map(s => (
                                                        <option key={s._id} value={s._id}>{s.name}</option>
                                                    ))}
                                                </select>
                                                <button onClick={() => {
                                                    const select = document.getElementById('reassignSelect');
                                                    if(select.value) handleAssign(select.value);
                                                }} className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors text-white font-bold">Reassign</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-slate-400 mb-2">Update Workflow Status</label>
                            <div className="flex flex-col gap-2">
                                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                                    <option value="OPEN">OPEN</option>
                                    <option value="ASSIGNED">ASSIGNED</option>
                                    <option value="IN_PROGRESS">IN PROGRESS</option>
                                    <option value="PENDING_STUDENT">PENDING STUDENT</option>
                                    <option value="RESOLVED">RESOLVED</option>
                                    <option value="CLOSED">CLOSED</option>
                                    <option value="REOPENED">REOPENED</option>
                                </select>
                                <button onClick={handleStatusChange} className="w-full btn-primary py-2 mt-1">Apply Status Change</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
