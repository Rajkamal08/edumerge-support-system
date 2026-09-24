import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function CreateTicket() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        department: 'ACADEMICS', 
        category: 'ATTENDANCE', 
        priority: 'MEDIUM', 
        subject: '', 
        description: ''
    });

    // ----------------------------------------------------------------------
    // TICKET SUBMISSION
    // Handle the creation of a new ticket and route the user to its detail page
    // ----------------------------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/tickets', form);
            navigate(`/tickets/${res.data._id}`);
        } catch (error) {
            console.error(error);
            alert('Failed to create ticket');
        }
    };

    // ----------------------------------------------------------------------
    // RENDER UI
    // ----------------------------------------------------------------------
    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Create Support Request</h1>
            <div className="glass-panel p-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Category</label>
                            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                                <option value="FEES">Fees</option>
                                <option value="ATTENDANCE">Attendance</option>
                                <option value="ID_CARD">ID Card</option>
                                <option value="DOCUMENTS">Documents</option>
                                <option value="CERTIFICATE">Certificate</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Department</label>
                            <select value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                                <option value="ACADEMICS">Academics</option>
                                <option value="ACCOUNTS">Accounts</option>
                                <option value="ADMINISTRATION">Administration</option>
                                <option value="EXAMINATION">Examination</option>
                                <option value="IT">IT</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm text-slate-400 mb-1">Priority</label>
                            <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                                <option value="LOW">Low - General query</option>
                                <option value="MEDIUM">Medium - Needs action soon</option>
                                <option value="HIGH">High - Blocking issue</option>
                                <option value="URGENT">Urgent - Immediate action required</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Subject</label>
                        <input type="text" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Description</label>
                        <textarea rows="4" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" required />
                    </div>
                    <button type="submit" className="btn-primary mt-4 self-start">Submit Ticket</button>
                </form>
            </div>
        </div>
    );
}
