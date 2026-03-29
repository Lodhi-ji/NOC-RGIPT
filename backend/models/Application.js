const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  
  // Digitized Offline Form Fields
  rollNumber: { type: String, required: true },
  degreeCourse: { type: String, required: true },
  branch: { type: String, required: true },
  yearSession: { type: String, required: true },
  latestCPI: { type: Number, required: true },
  contactNo: { type: String, required: true },
  internshipType: { type: String, required: true },
  durationFrom: { type: String, required: true },
  durationTo: { type: String, required: true },
  companyName: { type: String, required: true },
  organizationAddress: { type: String, required: true },
  mentorName: { type: String, required: true },
  mentorDesignation: { type: String, required: true },
  mentorContact: { type: String, required: true },
  mentorEmail: { type: String, required: true },
  addresseeName: { type: String, required: true },
  addresseeDesignation: { type: String, required: true },
  addresseeContact: { type: String, required: true },
  addresseeEmail: { type: String, required: true },

  // Workflow tracking
  status: { 
    type: String, 
    enum: [
      'SUBMITTED', 'UNDER_REVIEW_DEPT', 'REJECTED_DEPT', 'APPROVED_DEPT', 
      'UNDER_REVIEW_HEAD', 'REJECTED_HEAD', 'APPROVED_FINAL', 'READY_FOR_COLLECTION', 'COLLECTED'
    ],
    default: 'SUBMITTED' 
  },
  currentStage: { type: String, enum: ['DEPT', 'HEAD', 'DONE'], default: 'DEPT' },
  
  // Documents
  offerLetter: { type: String, required: false },
  statementOfObjective: { type: String, required: false },
  remarks: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
