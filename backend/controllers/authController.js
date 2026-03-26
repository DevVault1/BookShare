const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { dispatchTwoFactorCode, verifyTwoFactorCode } = require('../utils/twoFactor');
const { normalizePhoneNumber } = require('../utils/sms');
const {
  buildProviderAuthUrl,
  parseOAuthState,
  exchangeCodeForProfile,
  buildFrontendCallbackUrl,
} = require('../utils/oauth');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

const generatePendingTwoFactorToken = (id, method) =>
  jwt.sign({ id, purpose: '2fa-login', method }, process.env.JWT_SECRET || 'secret', { expiresIn: '10m' });

function sanitizeInterests(interests) {
  if (Array.isArray(interests)) return interests.filter(Boolean);
  if (typeof interests === 'string' && interests.trim()) {
    return interests.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

async function updateUserProvider(user, provider, providerId, profileImage) {
  let authProvider = user.authProvider || 'local';
  if (provider === 'google') user.googleId = providerId;
  if (provider === 'facebook') user.facebookId = providerId;

  const hasLocal = !!user.password;
  const hasGoogle = !!(provider === 'google' ? providerId : user.googleId);
  const hasFacebook = !!(provider === 'facebook' ? providerId : user.facebookId);

  if ((hasLocal && (hasGoogle || hasFacebook)) || (hasGoogle && hasFacebook)) {
    authProvider = 'hybrid';
  } else if (hasGoogle) {
    authProvider = 'google';
  } else if (hasFacebook) {
    authProvider = 'facebook';
  } else {
    authProvider = 'local';
  }

  user.authProvider = authProvider;
  if (!user.profileImage && profileImage) {
    user.profileImage = profileImage;
  }
  await user.save();
  return user;
}

async function createSocialUser(profile) {
  return User.create({
    name: profile.name,
    email: profile.email || `${profile.provider}_${profile.providerId}@oauth.adoptabook.local`,
    profileImage: profile.profileImage || '',
    authProvider: profile.provider,
    googleId: profile.provider === 'google' ? profile.providerId : '',
    facebookId: profile.provider === 'facebook' ? profile.providerId : '',
    isActive: true,
  });
}

async function findOrCreateSocialUser(profile) {
  let user;
  if (profile.provider === 'google') {
    user = await User.findOne({ $or: [{ googleId: profile.providerId }, { email: profile.email }] });
  } else {
    user = await User.findOne({ $or: [{ facebookId: profile.providerId }, { email: profile.email }] });
  }

  if (!user) {
    user = await createSocialUser(profile);
  } else {
    user.name = user.name || profile.name;
    user.profileImage = user.profileImage || profile.profileImage || '';
    if (!user.email && profile.email) user.email = profile.email;
    await updateUserProvider(user, profile.provider, profile.providerId, profile.profileImage);
  }

  user.lastLoginAt = new Date();
  await user.save();
  return user;
}

async function issueSessionOrTwoFactorChallenge(user) {
  if (user.twoFactorEnabled) {
    const channel = user.twoFactorMethod || 'email';
    const destination = channel === 'sms' ? normalizePhoneNumber(user.phoneNumber) : user.email;

    if (!destination) {
      const error = new Error(`Two-factor ${channel.toUpperCase()} destination is not configured for this account.`);
      error.status = 400;
      throw error;
    }

    const delivery = await dispatchTwoFactorCode(user, {
      purpose: 'login',
      channel,
      destination,
    });

    return {
      requiresTwoFactor: true,
      pendingToken: generatePendingTwoFactorToken(user._id, channel),
      method: channel,
      destinationHint: delivery.destinationHint,
    };
  }

  user.lastLoginAt = new Date();
  await user.save();

  return {
    requiresTwoFactor: false,
    token: generateToken(user._id),
    user,
  };
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, location, phoneNumber } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: role || 'student',
      location: location || '',
      phoneNumber: normalizePhoneNumber(phoneNumber || ''),
      authProvider: 'local',
    });

    res.status(201).json({ token: generateToken(user._id), user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.password) {
      return res.status(400).json({ message: 'This account uses social login. Please continue with Google or Facebook.' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const session = await issueSessionOrTwoFactorChallenge(user);
    res.json(session);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Login failed' });
  }
};

exports.verifyLoginTwoFactor = async (req, res) => {
  try {
    const { pendingToken, code } = req.body;
    const decoded = jwt.verify(pendingToken, process.env.JWT_SECRET || 'secret');

    if (decoded.purpose !== '2fa-login') {
      return res.status(400).json({ message: 'Invalid two-factor challenge.' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found or inactive.' });
    }

    await verifyTwoFactorCode(user._id, {
      purpose: 'login',
      channel: decoded.method,
      code,
    });

    user.lastLoginAt = new Date();
    await user.save();

    res.json({ token: generateToken(user._id), user });
  } catch (err) {
    res.status(err.status || 401).json({ message: err.message || 'Failed to verify two-factor code' });
  }
};

exports.resendLoginTwoFactor = async (req, res) => {
  try {
    const { pendingToken } = req.body;
    const decoded = jwt.verify(pendingToken, process.env.JWT_SECRET || 'secret');
    if (decoded.purpose !== '2fa-login') {
      return res.status(400).json({ message: 'Invalid two-factor challenge.' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found or inactive.' });
    }

    const channel = decoded.method || user.twoFactorMethod || 'email';
    const destination = channel === 'sms' ? normalizePhoneNumber(user.phoneNumber) : user.email;
    const delivery = await dispatchTwoFactorCode(user, {
      purpose: 'login',
      channel,
      destination,
    });

    res.json({
      pendingToken: generatePendingTwoFactorToken(user._id, channel),
      method: channel,
      destinationHint: delivery.destinationHint,
      message: 'A new verification code has been sent.',
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to resend verification code' });
  }
};

exports.getMe = async (req, res) => {
  res.json(req.user);
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, location, bio, interests, phoneNumber } = req.body;
    const updates = {
      name,
      location,
      bio,
      interests: sanitizeInterests(interests),
      phoneNumber: phoneNumber !== undefined ? normalizePhoneNumber(phoneNumber) : req.user.phoneNumber,
    };

    if (req.file) updates.profileImage = req.file.path;

    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTwoFactorStatus = async (req, res) => {
  res.json({
    enabled: !!req.user.twoFactorEnabled,
    method: req.user.twoFactorMethod || 'email',
    email: req.user.email,
    phoneNumber: req.user.phoneNumber || '',
  });
};

exports.requestTwoFactorSetup = async (req, res) => {
  try {
    const method = req.body.method === 'sms' ? 'sms' : 'email';
    const updates = {};
    let destination = method === 'sms' ? normalizePhoneNumber(req.body.phoneNumber || req.user.phoneNumber) : req.user.email;

    if (method === 'sms' && !destination) {
      return res.status(400).json({ message: 'Add a phone number before enabling SMS two-factor authentication.' });
    }

    if (method === 'sms') {
      updates.phoneNumber = destination;
    }

    if (Object.keys(updates).length) {
      await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    }

    const delivery = await dispatchTwoFactorCode(req.user, {
      purpose: 'setup',
      channel: method,
      destination,
    });

    res.json({
      method,
      destinationHint: delivery.destinationHint,
      message: `Verification code sent via ${method.toUpperCase()}.`,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to start two-factor setup' });
  }
};

exports.verifyTwoFactorSetup = async (req, res) => {
  try {
    const method = req.body.method === 'sms' ? 'sms' : 'email';
    await verifyTwoFactorCode(req.user._id, {
      purpose: 'setup',
      channel: method,
      code: req.body.code,
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        twoFactorEnabled: true,
        twoFactorMethod: method,
      },
      { new: true }
    );

    res.json({
      message: `${method.toUpperCase()} two-factor authentication enabled.`,
      user,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to verify setup code' });
  }
};

exports.disableTwoFactor = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { twoFactorEnabled: false, twoFactorMethod: 'email' },
      { new: true }
    );
    res.json({ message: 'Two-factor authentication disabled.', user });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to disable two-factor authentication' });
  }
};

exports.startSocialAuth = async (req, res) => {
  try {
    const provider = req.params.provider;
    const next = req.query.next || '/dashboard';
    const url = buildProviderAuthUrl(provider, next);
    res.redirect(url);
  } catch (err) {
    const redirectUrl = buildFrontendCallbackUrl({ error: err.message || 'Failed to start social login.' });
    res.redirect(redirectUrl);
  }
};

exports.socialAuthCallback = async (req, res) => {
  try {
    const provider = req.params.provider;
    const { code, state } = req.query;

    if (!code || !state) {
      throw new Error('Missing OAuth code or state.');
    }

    const parsedState = parseOAuthState(state);
    if (parsedState.provider !== provider) {
      throw new Error('OAuth state validation failed.');
    }

    const profile = await exchangeCodeForProfile(provider, String(code));
    const user = await findOrCreateSocialUser(profile);
    const session = await issueSessionOrTwoFactorChallenge(user);

    if (session.requiresTwoFactor) {
      return res.redirect(buildFrontendCallbackUrl({
        requiresTwoFactor: 'true',
        pendingToken: session.pendingToken,
        method: session.method,
        destinationHint: session.destinationHint,
        next: parsedState.next || '/dashboard',
      }));
    }

    return res.redirect(buildFrontendCallbackUrl({ token: session.token, next: parsedState.next || '/dashboard' }));
  } catch (err) {
    return res.redirect(buildFrontendCallbackUrl({ error: err.message || 'Social login failed.' }));
  }
};
