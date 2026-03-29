const Application = require('../models/Application');
const ApplicationLog = require('../models/ApplicationLog');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');

const getOfficerApplications = async (req, res) => {
  // If user is TNP Head, fetch all applications
  if (req.user.role === 'TNPHead') {
    const applications = await Application.find({ status: { $in: ['UNDER_REVIEW_HEAD', 'APPROVED_FINAL', 'REJECTED_HEAD', 'READY_FOR_COLLECTION', 'COLLECTED'] } })
      .populate('studentId', 'name email rollNumber')
      .populate('departmentId', 'name')
      .sort({ updatedAt: -1 });
    return res.json(applications);
  }

  // If user is Dept Officer, fetch applications for their department
  const applications = await Application.find({ departmentId: req.user.departmentId })
    .populate('studentId', 'name email rollNumber')
    .populate('departmentId', 'name')
    .sort({ updatedAt: -1 });
  res.json(applications);
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body; // action: 'APPROVE', 'REJECT', 'COLLECTED'
    
    const application = await Application.findById(id).populate('studentId', 'email');
    if (!application) return res.status(404).json({ message: 'Not found' });

    let newStatus = application.status;
    const isHead = req.user.role === 'TNPHead';

    if (action === 'REJECT') {
      newStatus = isHead ? 'REJECTED_HEAD' : 'REJECTED_DEPT';
    } else if (action === 'APPROVE') {
      newStatus = isHead ? 'APPROVED_FINAL' : 'UNDER_REVIEW_HEAD';
      if(isHead) application.currentStage = 'DONE';
    } else if (action === 'COLLECTED') {
      newStatus = 'COLLECTED';
    }

    application.status = newStatus;
    application.remarks = remarks || application.remarks;
    
    if (!application.rollNumber) application.rollNumber = 'N/A';
    
    if(newStatus === 'APPROVED_FINAL') {
      application.status = 'READY_FOR_COLLECTION'; // Direct transition
    }

    await application.save();

    await ApplicationLog.create({
      applicationId: id,
      actionBy: req.user._id,
      role: req.user.role,
      action,
      remarks
    });

    // Notify student
    try {
      await sendEmail({
        email: application.studentId.email,
        subject: `NOC Application Status Update: ${newStatus}`,
        message: `Your NOC Application status has been updated to ${newStatus}. Remarks: ${remarks || 'None'}`
      });
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError.message);
    }

    res.json(application);
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

module.exports = { getOfficerApplications, updateApplicationStatus };
