const jwt = require('jsonwebtoken');

function getBaseFrontendUrl() {
  return process.env.FRONTEND_URL || (process.env.CLIENT_URLS || 'http://localhost:3000').split(',')[0].trim() || 'http://localhost:3000';
}

function getOAuthConfig(provider) {
  if (provider === 'google') {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      userInfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
      scope: 'openid email profile',
    };
  }

  if (provider === 'facebook') {
    const version = process.env.FACEBOOK_GRAPH_VERSION || 'v22.0';
    return {
      clientId: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      redirectUri: process.env.FACEBOOK_REDIRECT_URI,
      authorizationEndpoint: `https://www.facebook.com/${version}/dialog/oauth`,
      tokenEndpoint: `https://graph.facebook.com/${version}/oauth/access_token`,
      userInfoEndpoint: `https://graph.facebook.com/${version}/me`,
      scope: 'email,public_profile',
    };
  }

  return null;
}

function createOAuthState(provider, next = '/dashboard') {
  return jwt.sign({ provider, next }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
}

function parseOAuthState(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'secret');
}

function buildFrontendCallbackUrl(params = {}) {
  const base = `${getBaseFrontendUrl().replace(/\/$/, '')}/auth/oauth/callback`;
  const hash = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      hash.set(key, String(value));
    }
  });
  return `${base}#${hash.toString()}`;
}

function buildProviderAuthUrl(provider, next) {
  const config = getOAuthConfig(provider);
  if (!config?.clientId || !config?.clientSecret || !config?.redirectUri) {
    const error = new Error(`${provider} OAuth is not configured.`);
    error.status = 500;
    throw error;
  }

  const state = createOAuthState(provider, next);
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    state,
  });

  if (provider === 'google') {
    params.set('scope', config.scope);
    params.set('access_type', 'online');
    params.set('prompt', 'select_account');
  } else {
    params.set('scope', config.scope);
  }

  return `${config.authorizationEndpoint}?${params.toString()}`;
}

async function exchangeCodeForProfile(provider, code) {
  const config = getOAuthConfig(provider);
  if (!config?.clientId || !config?.clientSecret || !config?.redirectUri) {
    const error = new Error(`${provider} OAuth is not configured.`);
    error.status = 500;
    throw error;
  }

  const tokenBody = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code,
  });

  if (provider === 'google') {
    tokenBody.set('grant_type', 'authorization_code');
  }

  const tokenResponse = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: tokenBody,
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) {
    const error = new Error(tokenData.error_description || tokenData.error?.message || `Failed to exchange ${provider} code.`);
    error.status = tokenResponse.status || 500;
    throw error;
  }

  if (provider === 'google') {
    const profileResponse = await fetch(config.userInfoEndpoint, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.sub) {
      const error = new Error(profile.error_description || 'Failed to load Google profile.');
      error.status = profileResponse.status || 500;
      throw error;
    }
    return {
      provider,
      providerId: profile.sub,
      email: profile.email,
      name: profile.name || profile.given_name || 'Google User',
      profileImage: profile.picture || '',
    };
  }

  const userInfoUrl = new URL(config.userInfoEndpoint);
  userInfoUrl.searchParams.set('fields', 'id,name,email,picture.type(large)');
  userInfoUrl.searchParams.set('access_token', tokenData.access_token);

  const profileResponse = await fetch(userInfoUrl.toString());
  const profile = await profileResponse.json();
  if (!profileResponse.ok || !profile.id) {
    const error = new Error(profile.error?.message || 'Failed to load Facebook profile.');
    error.status = profileResponse.status || 500;
    throw error;
  }

  return {
    provider,
    providerId: profile.id,
    email: profile.email || '',
    name: profile.name || 'Facebook User',
    profileImage: profile.picture?.data?.url || '',
  };
}

module.exports = {
  getBaseFrontendUrl,
  getOAuthConfig,
  buildProviderAuthUrl,
  parseOAuthState,
  exchangeCodeForProfile,
  buildFrontendCallbackUrl,
};
