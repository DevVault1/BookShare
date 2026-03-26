const mongoose = require('mongoose');
const Report = require('../models/Report');
const User = require('../models/User');
const Book = require('../models/Book');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { sendMail } = require('../utils/mailer');

function isValidObjectId(value) {
  return !!value && mongoose.Types.ObjectId.isValid(value);
}

async function validateReportTarget(targetType, targetId) {
  if (!targetId) return;
  if (!isValidObjectId(targetId)) {
    const error = new Error('Invalid report target.');
    error.status = 400;
    throw error;
  }

  let exists = false;
  if (targetType === 'book') exists = !!(await Book.exists({ _id: targetId }));
  if (targetType === 'user') exists = !!(await User.exists({ _id: targetId }));
  if (targetType === 'message') exists = !!(await Message.exists({ _id: targetId }));

  if ((targetType === 'book' || targetType === 'user' || targetType === 'message') && !exists) {
    const error = new Error('Report target was not found.');
    error.status = 404;
    throw error;
  }
}

function buildReportEmail(report, reporter, targetLabel) {
  return {
    subject: `[Adopt A Book] New ${report.category.replace(/_/g, ' ')} report`,
    text: [
      `A new report has been submitted on Adopt A Book.`,
      '',
      `Reporter: ${reporter.name} <${reporter.email}>`,
      `Category: ${report.category}`,
      `Target: ${report.targetType}${targetLabel ? ` - ${targetLabel}` : ''}`,
      `Priority: ${report.priority}`,
      '',
      'Description:',
      report.description,
      '',
      `Admin link: ${(process.env.FRONTEND_URL || (process.env.CLIENT_URLS || 'http://localhost:3000').split(',')[0].trim())}/admin`,
    ].join('\n'),
    html: `
      <h2>New platform report submitted</h2>
      <p><strong>Reporter:</strong> ${reporter.name} &lt;${reporter.email}&gt;</p>
      <p><strong>Category:</strong> ${report.category.replace(/_/g, ' ')}</p>
      <p><strong>Target:</strong> ${report.targetType}${targetLabel ? ` - ${targetLabel}` : ''}</p>
      <p><strong>Priority:</strong> ${report.priority}</p>
      <p><strong>Description:</strong></p>
      <p>${String(report.description).replace(/\n/g, '<br/>')}</p>
      <p><a href="${(process.env.FRONTEND_URL || (process.env.CLIENT_URLS || 'http://localhost:3000').split(',')[0].trim())}/admin">Open admin dashboard</a></p>
    `,
  };
}

async function resolveAdminEmails() {
  const adminUsers = await User.find({ role: 'admin', isActive: true }).select('email');
  const envEmails = String(process.env.ADMIN_REPORT_EMAILS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return [...new Set([...adminUsers.map((item) => item.email).filter(Boolean), ...envEmails])];
}

async function notifyAdminsAboutReport(report, reporter, targetLabel) {
  const adminEmails = await resolveAdminEmails();
  const emailPayload = buildReportEmail(report, reporter, targetLabel);

  if (adminEmails.length > 0) {
    await sendMail({
      to: adminEmails.join(','),
      subject: emailPayload.subject,
      text: emailPayload.text,
      html: emailPayload.html,
    }).catch((error) => {
      console.error('Failed to send report email:', error.message);
    });
  }

  const adminUsers = await User.find({ role: 'admin', isActive: true }).select('_id');
  if (adminUsers.length > 0) {
    await Notification.insertMany(
      adminUsers.map((admin) => ({
        userId: admin._id,
        type: 'report',
        message: `New ${report.category.replace(/_/g, ' ')} report submitted by ${reporter.name}.`,
        link: '/admin',
        relatedId: report._id,
      }))
    ).catch(() => null);
  }

  await sendMail({
    to: reporter.email,
    subject: 'We received your Adopt A Book report',
    text: `Thanks for helping keep Adopt A Book safe. We received your report about ${targetLabel || report.targetType}. Our admins will review it soon.`,
    html: `<p>Thanks for helping keep Adopt A Book safe.</p><p>We received your report about <strong>${targetLabel || report.targetType}</strong>. Our admins will review it soon.</p>`,
  }).catch(() => null);
}

exports.createReport = async (req, res) => {
  try {
    const { targetType, targetId, category, description, priority } = req.body;

    if (!targetType || !category || !description) {
      return res.status(400).json({ message: 'targetType, category, and description are required.' });
    }

    await validateReportTarget(targetType, targetId);

    const report = await Report.create({
      reporterId: req.user._id,
      targetType,
      targetId: targetId || null,
      category,
      description,
      priority: priority || 'medium',
    });

    let targetLabel = '';
    if (targetType === 'book' && targetId) {
      const book = await Book.findById(targetId).select('title');
      targetLabel = book ? book.title : '';
    }
    if (targetType === 'user' && targetId) {
      const user = await User.findById(targetId).select('name email');
      targetLabel = user ? `${user.name} (${user.email})` : '';
    }

    await notifyAdminsAboutReport(report, req.user, targetLabel);
    report.emailSentAt = new Date();
    await report.save();

    const populated = await Report.findById(report._id)
      .populate('reporterId', 'name email role')
      .populate('targetId');

    res.status(201).json(populated);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to submit report' });
  }
};

exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporterId: req.user._id })
      .populate('reporterId', 'name email role')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch reports' });
  }
};

exports.getAdminReports = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const reports = await Report.find(query)
      .populate('reporterId', 'name email role')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch reports' });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const { status, priority, adminNotes } = req.body;
    const updates = { status, priority, adminNotes };
    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

    if (status && (status === 'resolved' || status === 'dismissed')) {
      updates.resolvedAt = new Date();
      updates.resolvedBy = req.user._id;
    }

    const report = await Report.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('reporterId', 'name email role');

    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    if (status && report.reporterId?.email) {
      await sendMail({
        to: report.reporterId.email,
        subject: 'Your Adopt A Book safety report was updated',
        text: `Your report is now marked as ${status.replace(/_/g, ' ')}. ${adminNotes ? `Admin note: ${adminNotes}` : ''}`,
        html: `<p>Your report is now marked as <strong>${status.replace(/_/g, ' ')}</strong>.</p>${adminNotes ? `<p><strong>Admin note:</strong> ${adminNotes}</p>` : ''}`,
      }).catch(() => null);
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update report' });
  }
};
