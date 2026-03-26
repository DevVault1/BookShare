const router = require('express').Router();
const { createReport, getMyReports, getAdminReports, updateReport } = require('../controllers/reportController');
const { auth, adminAuth } = require('../middleware/auth');

router.post('/', auth, createReport);
router.get('/me', auth, getMyReports);
router.get('/admin', adminAuth, getAdminReports);
router.put('/admin/:id', adminAuth, updateReport);

module.exports = router;
