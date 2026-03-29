import React, { useState, useEffect } from 'react';
import api from '../api';

const ExpandedDetails = ({ app }) => (
  <div className="mt-6 p-6 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm text-slate-700">
    <div className="md:col-span-2 text-indigo-800 font-extrabold pb-2 border-b border-slate-200">Requisition Details</div>
    <div><strong className="text-slate-900">Course/Branch:</strong> {app.degreeCourse} in {app.branch} ({app.yearSession})</div>
    <div><strong className="text-slate-900">CPI & Contact:</strong> {app.latestCPI} | Ph: {app.contactNo}</div>
    <div className="md:col-span-2"><strong className="text-slate-900">Internship Type:</strong> {app.internshipType}</div>
    <div className="md:col-span-2"><strong className="text-slate-900">Org Address:</strong> {app.organizationAddress}</div>
    
    <div className="pt-4 mt-2 border-t border-slate-200">
      <h4 className="font-extrabold text-slate-900 uppercase tracking-widest text-xs mb-2">Mentor Details</h4>
      <p className="font-medium">{app.mentorName} ({app.mentorDesignation})</p>
      <p className="text-slate-500">{app.mentorEmail} | {app.mentorContact}</p>
    </div>
    <div className="pt-4 mt-2 border-t border-slate-200">
      <h4 className="font-extrabold text-slate-900 uppercase tracking-widest text-xs mb-2">Addressee Details</h4>
      <p className="font-medium">{app.addresseeName} ({app.addresseeDesignation})</p>
      <p className="text-slate-500">{app.addresseeEmail} | {app.addresseeContact}</p>
    </div>
  </div>
);

const AppCard = ({ app, actionType, remarks, setRemarks, handleAction }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const getGradient = () => {
    if(actionType === 'REVIEW') return 'bg-gradient-to-b from-amber-400 to-orange-500';
    if(actionType === 'COLLECT') return 'bg-gradient-to-b from-blue-400 to-indigo-600';
    return 'bg-gradient-to-b from-slate-300 to-slate-400';
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-6 justify-between hover:shadow-lg transition-shadow overflow-hidden relative group">
      <div className={`absolute top-0 left-0 w-2 h-full ${getGradient()}`}></div>
      <div className="flex-1 pl-4">
        <div className="flex justify-between items-start">
            <h3 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
              {app.companyName}
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">{app.departmentId?.name}</span>
            </h3>
        </div>
        <p className="text-sm font-medium text-slate-600 mt-3">
           <span className="text-slate-400">Student:</span> <span className="text-slate-900 font-bold">{app.studentId?.name}</span> ({app.studentId?.email}) <span className="mx-2 text-slate-300">|</span> <span className="text-slate-400">Roll:</span> <span className="text-slate-900 font-bold">{app.rollNumber || 'N/A'}</span>
        </p>
        <p className="text-sm font-medium text-indigo-600 mt-1">
           <span className="text-slate-400">Duration:</span> {app.durationFrom} to {app.durationTo}
        </p>
        
        <button onClick={() => setShowDetails(!showDetails)} className="inline-flex items-center text-indigo-600 text-xs font-bold mt-4 uppercase tracking-widest hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg active:bg-indigo-100">
          {showDetails ? 'Minus Details ▲' : 'Expand Full Details ▼'}
        </button>
        {showDetails && <ExpandedDetails app={app} />}

        <div className="mt-6 pt-4 border-t border-slate-100 flex gap-6 text-sm">
          {app.offerLetter && <a href={`http://localhost:5000/${app.offerLetter}`} target="_blank" rel="noreferrer" className="inline-flex items-center font-bold text-indigo-600 hover:text-indigo-800 transition-colors"><svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Offer Letter</a>}
          {app.statementOfObjective && <a href={`http://localhost:5000/${app.statementOfObjective}`} target="_blank" rel="noreferrer" className="inline-flex items-center font-bold text-indigo-600 hover:text-indigo-800 transition-colors"><svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Statement</a>}
        </div>
      </div>

      {actionType === 'REVIEW' && (
        <div className="w-full md:w-80 flex flex-col justify-center bg-slate-50 p-6 rounded-2xl border border-slate-100 relative">
           <textarea 
             placeholder="Include final remarks (optional)..."
             className="w-full p-4 border border-slate-200 rounded-xl text-sm mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
             rows="3"
             value={remarks[app._id] || ''}
             onChange={e => setRemarks({...remarks, [app._id]: e.target.value})}
           ></textarea>
           <div className="flex gap-3">
             <button onClick={() => handleAction(app._id, 'APPROVE')} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-extrabold text-sm hover:bg-emerald-700 hover:-translate-y-0.5 shadow-md shadow-emerald-200 transition-all">APPROVE</button>
             <button onClick={() => handleAction(app._id, 'REJECT')} className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-extrabold text-sm hover:bg-rose-700 hover:-translate-y-0.5 shadow-md shadow-rose-200 transition-all">REJECT</button>
           </div>
        </div>
      )}

      {actionType === 'COLLECT' && (
        <div className="w-full md:w-80 flex flex-col justify-center bg-indigo-50 p-6 rounded-2xl border border-indigo-100 relative relative">
           <button onClick={() => handleAction(app._id, 'COLLECTED')} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-extrabold uppercase tracking-widest text-sm hover:bg-indigo-700 hover:-translate-y-0.5 shadow-lg shadow-indigo-200 transition-all mb-3">
             Mark Collected ✔
           </button>
           <p className="text-xs text-center font-medium text-indigo-700">Hardcopy collected by student</p>
        </div>
      )}
      
      {actionType === 'NONE' && (
          <div className="mt-2 text-sm text-slate-800 h-fit self-center flex flex-col items-end">
             <span className="uppercase tracking-widest text-xs font-extrabold bg-slate-100 px-4 py-2 border border-slate-200 rounded-full">{app.status.replace(/_/g, ' ')}</span>
             {app.remarks && <div className="mt-3 text-xs italic text-slate-500 max-w-xs text-right">"{app.remarks}"</div>}
          </div>
        )}
    </div>
  );
};

const TNPHeadDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [remarks, setRemarks] = useState({});

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/officer/applications');
      setApplications(res.data);
    } catch (e) { console.error(e); }
  };

  const handleAction = async (id, action) => {
    try {
      await api.put(`/officer/applications/${id}/status`, { action, remarks: remarks[id] || '' });
      fetchApplications();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating status');
    }
  };

  const pendingApps = applications.filter(a => a.status === 'UNDER_REVIEW_HEAD');
  const collectingApps = applications.filter(a => a.status === 'READY_FOR_COLLECTION');
  const pastApps = applications.filter(a => a.status !== 'UNDER_REVIEW_HEAD' && a.status !== 'READY_FOR_COLLECTION');

  return (
    <div className="space-y-12 pb-12 animate-fade-in-up">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">TNP Head Dashboard</h1>
        <p className="text-slate-500 mt-2 font-medium">Final approval and hardcopy collection tracking for all No Objection Certificates.</p>
      </div>
      
      <div>
        <h2 className="text-2xl font-extrabold text-indigo-900 uppercase tracking-widest mb-6 border-b-2 border-slate-200 pb-3 flex items-center">
            <span className="w-3 h-3 rounded-full bg-amber-500 mr-3 animate-pulse"></span>
            Pending Final Approval
        </h2>
        {pendingApps.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <h3 className="text-lg font-bold text-slate-600">All caught up!</h3>
            <p className="text-slate-400 mt-2">No applications waiting for final approval.</p>
          </div>
        ) : pendingApps.map(app => 
            <AppCard key={app._id} app={app} actionType="REVIEW" remarks={remarks} setRemarks={setRemarks} handleAction={handleAction} />
        )}
      </div>

      <div>
        <h2 className="text-2xl font-extrabold text-blue-900 uppercase tracking-widest mb-6 border-b-2 border-slate-200 pb-3 flex items-center">
            <span className="w-3 h-3 rounded-full bg-blue-500 mr-3 animate-pulse"></span>
            Ready for Collection
        </h2>
        {collectingApps.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <h3 className="text-lg font-bold text-slate-600">No Pending Pickups</h3>
            <p className="text-slate-400 mt-2">No students currently waiting to collect their NOC hardcopies.</p>
          </div>
        ) : collectingApps.map(app => 
            <AppCard key={app._id} app={app} actionType="COLLECT" remarks={remarks} setRemarks={setRemarks} handleAction={handleAction} />
        )}
      </div>

      <div className="pt-8 opacity-75">
        <h2 className="text-2xl font-extrabold text-slate-800 uppercase tracking-widest mb-6 border-b-2 border-slate-200 pb-3 flex items-center">
            <span className="w-3 h-3 rounded-full bg-emerald-500 mr-3"></span>
            Processed Applications Ledger
        </h2>
        {pastApps.length === 0 ? <p className="text-slate-500 italic">No historical records.</p> : pastApps.map(app => 
            <AppCard key={app._id} app={app} actionType="NONE" remarks={remarks} setRemarks={setRemarks} handleAction={handleAction} />
        )}
      </div>
    </div>
  );
};

export default TNPHeadDashboard;
