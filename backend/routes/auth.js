const router = require('express').Router();
const {
  register,
  login,
  verifyLoginTwoFactor,
  resendLoginTwoFactor,
  getMe,
  updateProfile,
  getTwoFactorStatus,
  requestTwoFactorSetup,
  verifyTwoFactorSetup,
  disableTwoFactor,
  startSocialAuth,
  socialAuthCallback,
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.post('/register', register);
router.post('/login', login);
router.post('/login/verify-2fa', verifyLoginTwoFactor);
router.post('/login/resend-2fa', resendLoginTwoFactor);
router.get('/oauth/:provider/start', startSocialAuth);
router.get('/oauth/:provider/callback', socialAuthCallback);
router.get('/me', auth, getMe);
router.put('/profile', auth, upload.single('profileImage'), updateProfile);
router.get('/2fa/status', auth, getTwoFactorStatus);
router.post('/2fa/setup/request', auth, requestTwoFactorSetup);
router.post('/2fa/setup/verify', auth, verifyTwoFactorSetup);
router.post('/2fa/disable', auth, disableTwoFactor);

module.exports = router;
