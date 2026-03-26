const router = require('express').Router();
const {
  getMyAnalytics,
  getAdminReport,
  getAdminReportEmail,
  downloadAdminReportPdf,
} = require('../controllers/analyticsController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/me', auth, getMyAnalytics);
router.get('/admin/report', adminAuth, getAdminReport);
router.get('/admin/report/email', adminAuth, getAdminReportEmail);
router.get('/admin/report/pdf', adminAuth, downloadAdminReportPdf);

module.exports = router;
