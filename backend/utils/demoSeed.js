/**
 * Demo data seeder.
 *
 * Creates departments, one account per role, and a handful of sample NOC
 * applications spread across every workflow stage so each dashboard has
 * something to show. Used by:
 *   - index.js  (auto-runs on startup when DEMO_MODE=true and the DB is empty)
 *   - seed.js   (`npm run seed` — wipes and re-seeds)
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Department = require('../models/Department');
const RoutingConfig = require('../models/RoutingConfig');
const Application = require('../models/Application');
const ApplicationLog = require('../models/ApplicationLog');
const OTP = require('../models/OTP');

const DEMO_PASSWORD = 'password123';

const DEPARTMENTS = [
  { name: 'Chemical and Biochemical Engineering', code: 'CBE' },
  { name: 'Computer Science and Engineering', code: 'CSE' },
  { name: 'Electrical and Electronics Engineering', code: 'EEE' },
  { name: 'Mathematical Sciences', code: 'MS' },
  { name: 'Mechanical Engineering', code: 'ME' },
  { name: 'Petroleum Engineering and Geoengineering', code: 'PEG' },
];

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@rgipt.ac.in', name: 'Portal Administrator' },
  { role: 'TNPHead', email: 'tnphead@rgipt.ac.in', name: 'Chairman T&P' },
  { role: 'TNPOffice', email: 'tnpoffice@rgipt.ac.in', name: 'TNP Office' },
  { role: 'CDCChairperson', email: 'cdc@rgipt.ac.in', name: 'CDC Chairperson' },
  { role: 'DeptOfficer', email: 'officer@rgipt.ac.in', name: 'CSE Dept. Officer', dept: 'CSE' },
  { role: 'DeptOfficer', email: 'peg.officer@rgipt.ac.in', name: 'PEG Dept. Officer', dept: 'PEG' },
  { role: 'Student', email: 'student@rgipt.ac.in', name: 'Aarav Sharma', dept: 'CSE', rollNumber: '23CS1001' },
  { role: 'Student', email: 'priya@rgipt.ac.in', name: 'Priya Verma', dept: 'CSE', rollNumber: '23CS1042' },
  { role: 'Student', email: 'rohan@rgipt.ac.in', name: 'Rohan Gupta', dept: 'PEG', rollNumber: '23PE1017' },
];

/** Builds a tiny but valid one-page PDF containing the given lines of text. */
const buildPdf = (lines) => {
  const esc = (t) => String(t).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const content = ['BT', '/F1 13 Tf', '16 TL', '60 780 Td']
    .concat(lines.map((l, i) => (i === 0 ? `/F1 18 Tf (${esc(l)}) Tj /F1 12 Tf T* T*` : `(${esc(l)}) Tj T*`)))
    .concat(['ET'])
    .join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => { pdf += `${String(o).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
};

const writeSamplePdf = (fileName, lines) => {
  const dir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), buildPdf(lines));
  return `uploads/${fileName}`;
};

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const isoDate = (d) => d.toISOString().slice(0, 10);

const seedDemoData = async ({ reset = false } = {}) => {
  if (reset) {
    await Promise.all([
      User.deleteMany(), Department.deleteMany(), RoutingConfig.deleteMany(),
      Application.deleteMany(), ApplicationLog.deleteMany(), OTP.deleteMany(),
    ]);
  }

  const deptByCode = {};
  for (const d of DEPARTMENTS) {
    deptByCode[d.code] = await Department.findOneAndUpdate(
      { code: d.code }, { $set: d }, { upsert: true, returnDocument: 'after' }
    );
  }

  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = {};
  for (const acc of DEMO_ACCOUNTS) {
    users[acc.email] = await User.findOneAndUpdate(
      { email: acc.email },
      {
        $set: {
          name: acc.name, email: acc.email, password, role: acc.role,
          departmentId: acc.dept ? deptByCode[acc.dept]._id : undefined,
          rollNumber: acc.rollNumber,
          isPending: false,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  await RoutingConfig.findOneAndUpdate(
    { departmentId: deptByCode.CSE._id },
    { departmentId: deptByCode.CSE._id, primaryApproverEmail: 'officer@rgipt.ac.in', roleType: 'tnp_coordinator' },
    { upsert: true }
  );
  await RoutingConfig.findOneAndUpdate(
    { departmentId: deptByCode.PEG._id },
    { departmentId: deptByCode.PEG._id, primaryApproverEmail: 'peg.officer@rgipt.ac.in', roleType: 'hod' },
    { upsert: true }
  );

  // Only create sample applications once.
  if ((await Application.countDocuments()) > 0) return;

  const officer = users['officer@rgipt.ac.in'];
  const pegOfficer = users['peg.officer@rgipt.ac.in'];
  const head = users['tnphead@rgipt.ac.in'];
  const tnpOffice = users['tnpoffice@rgipt.ac.in'];

  const samples = [
    {
      student: 'priya@rgipt.ac.in', dept: 'CSE', company: 'Amazon Development Centre', status: 'COLLECTED',
      address: 'World Trade Center, Brigade Gateway, Bengaluru 560055', mentor: ['Ms. Kavya Menon', 'SDE II', '9876500077', 'kavya.menon@amazon.com'],
      type: 'Regular Internship (6 weeks duration)', start: 20, applied: 30,
      trail: [[officer, 'DeptOfficer', 'APPROVE', 'Verified.', 28], [head, 'TNPHead', 'APPROVE', 'Approved.', 25], [tnpOffice, 'TNPOffice', 'COLLECTED', '', 22]],
    },
    {
      student: 'student@rgipt.ac.in', dept: 'CSE', company: 'Indian Oil Corporation Ltd.', status: 'READY_FOR_COLLECTION',
      address: 'IOCL Panipat Refinery, Panipat, Haryana 132140', mentor: ['Mr. R. K. Mehta', 'Chief Manager (IT)', '9876500011', 'rk.mehta@indianoil.in'],
      type: 'Regular Internship (6 weeks duration)', start: 40, applied: 20,
      trail: [[officer, 'DeptOfficer', 'APPROVE', 'Documents verified. Recommended.', 18], [head, 'TNPHead', 'APPROVE', 'Approved. Collect from TNP cell.', 15]],
    },
    {
      student: 'student@rgipt.ac.in', dept: 'CSE', company: 'Google India Pvt. Ltd.', status: 'UNDER_REVIEW_HEAD',
      address: 'RMZ Infinity, Old Madras Road, Bengaluru 560016', mentor: ['Ms. Ananya Rao', 'Senior Software Engineer', '9876500022', 'ananya.rao@google.com'],
      type: 'Embedded Internship (14 weeks duration)', start: 60, applied: 6,
      trail: [[officer, 'DeptOfficer', 'APPROVE', 'All documents in order.', 3]],
    },
    {
      student: 'priya@rgipt.ac.in', dept: 'CSE', company: 'Microsoft IDC', status: 'UNDER_REVIEW_DEPT',
      address: 'Microsoft Campus, Gachibowli, Hyderabad 500032', mentor: ['Mr. Vikram Singh', 'Principal Engineer', '9876500033', 'vikram.singh@microsoft.com'],
      type: 'Regular Internship (6 weeks duration)', start: 45, applied: 2, trail: [],
    },
    {
      student: 'priya@rgipt.ac.in', dept: 'CSE', company: 'Tata Consultancy Services', status: 'REJECTED_DEPT',
      address: 'TCS House, Raveline Street, Fort, Mumbai 400001', mentor: ['Mr. S. Iyer', 'Project Lead', '9876500044', 's.iyer@tcs.com'],
      type: 'Regular Internship (6 weeks duration)', start: 30, applied: 12,
      trail: [[officer, 'DeptOfficer', 'REJECT', 'Offer letter is unsigned. Please re-apply with a signed copy.', 10]],
    },
    {
      student: 'rohan@rgipt.ac.in', dept: 'PEG', company: 'ONGC Ltd.', status: 'UNDER_REVIEW_DEPT',
      address: 'ONGC Tel Bhavan, Dehradun, Uttarakhand 248003', mentor: ['Dr. P. Nair', 'Deputy General Manager', '9876500055', 'p.nair@ongc.co.in'],
      type: 'Regular Internship (6 weeks duration)', start: 35, applied: 1, trail: [],
    },
    {
      student: 'rohan@rgipt.ac.in', dept: 'PEG', company: 'Reliance Industries Ltd.', status: 'UNDER_REVIEW_HEAD',
      address: 'Reliance Corporate Park, Navi Mumbai 400701', mentor: ['Mr. A. Kulkarni', 'Manager - Upstream', '9876500066', 'a.kulkarni@ril.com'],
      type: 'Regular Internship (6 weeks duration)', start: 50, applied: 5,
      trail: [[pegOfficer, 'DeptOfficer', 'APPROVE', 'Recommended for approval.', 4]],
    },
  ];

  for (const [i, s] of samples.entries()) {
    const student = users[s.student];
    const from = new Date(Date.now() + s.start * 86400000);
    const to = new Date(from.getTime() + (s.type.startsWith('Embedded') ? 98 : 42) * 86400000);
    const slug = s.company.replace(/[^a-zA-Z]/g, '').slice(0, 12).toLowerCase();

    const offerLetter = writeSamplePdf(`demo-${i}-${slug}-offer-letter.pdf`, [
      `${s.company} - Internship Offer Letter`, '', `Dear ${student.name},`, '',
      `We are pleased to offer you an internship at ${s.company}.`,
      `Duration: ${isoDate(from)} to ${isoDate(to)}`, `Reporting mentor: ${s.mentor[0]} (${s.mentor[1]})`,
      '', '(Sample document generated for the NOC Portal demo)',
    ]);
    const mandatoryDocument = writeSamplePdf(`demo-${i}-${slug}-noc-request.pdf`, [
      'Request for No Objection Certificate', '', `Name: ${student.name}`, `Roll No: ${student.rollNumber}`,
      `Organisation: ${s.company}`, `Address: ${s.address}`, '', '(Sample document generated for the NOC Portal demo)',
    ]);

    const marksheet = writeSamplePdf(`demo-${i}-${slug}-marksheet.pdf`, [
      'RGIPT - Semester Grade Card', '', `Name: ${student.name}`, `Roll No: ${student.rollNumber}`,
      'Semester: V (2025-2026)', 'SGPA: 8.62    CPI: 8.70', '', '(Sample document generated for the NOC Portal demo)',
    ]);

    const appliedAt = daysAgo(s.applied);
    const app = new Application({
      studentId: student._id, departmentId: deptByCode[s.dept]._id,
      rollNumber: student.rollNumber, degreeCourse: 'B.Tech',
      branch: s.dept === 'CSE' ? 'Computer Science and Engineering' : 'Petroleum Engineering',
      currentYear: '3rd Year', yearSession: '2025-2026', latestCPI: [8.7, 9.1, 7.9, 8.2, 8.4, 8.9, 8.3][i],
      contactNo: `98100000${10 + i}`, internshipType: s.type,
      durationFrom: isoDate(from), durationTo: isoDate(to),
      companyName: s.company, organizationAddress: s.address,
      mentorName: s.mentor[0], mentorDesignation: s.mentor[1], mentorContact: s.mentor[2], mentorEmail: s.mentor[3],
      addresseeName: 'HR Manager', addresseeDesignation: 'Human Resources', addresseeContact: s.mentor[2], addresseeEmail: s.mentor[3],
      status: s.status, currentStage: ['READY_FOR_COLLECTION', 'COLLECTED'].includes(s.status) ? 'DONE' : s.status === 'UNDER_REVIEW_HEAD' ? 'HEAD' : 'DEPT',
      offerLetter, mandatoryDocument, marksheet,
      sopText: `I wish to undertake this internship at ${s.company} to gain hands-on industry experience in my field, apply concepts learnt in coursework, and build skills relevant to my career goals.`,
      studentMessage: 'Kindly process my NOC at the earliest. Thank you.',
      remarks: s.trail.length ? s.trail[s.trail.length - 1][3] : '',
      appliedAt,
    });

    for (const [actor, role, action, , ago] of s.trail) {
      const when = daysAgo(ago);
      if (role === 'TNPOffice') continue;
      if (action === 'REJECT') { app.rejectedAt = when; app.rejectedBy = actor._id; }
      else if (role === 'TNPHead') { app.approvedAt = when; app.approvedBy = actor._id; }
      else { app.recommendedAt = when; app.recommendedBy = actor._id; }
    }
    await app.save();

    // Backdate timestamps (mongoose would otherwise stamp "now") so the demo looks realistic.
    const lastActivity = s.trail.length ? daysAgo(s.trail[s.trail.length - 1][4]) : appliedAt;
    await Application.collection.updateOne({ _id: app._id }, { $set: { createdAt: appliedAt, updatedAt: lastActivity } });

    const logs = [{ applicationId: app._id, actionBy: student._id, role: 'Student', action: 'Submitted Application', remarks: '', when: appliedAt }]
      .concat(s.trail.map(([actor, role, action, remarks, ago]) => ({ applicationId: app._id, actionBy: actor._id, role, action, remarks, when: daysAgo(ago) })));
    await ApplicationLog.collection.insertMany(logs.map(({ when, ...l }) => ({ ...l, createdAt: when, updatedAt: when })));
  }
};

module.exports = { seedDemoData, DEMO_ACCOUNTS, DEMO_PASSWORD };
