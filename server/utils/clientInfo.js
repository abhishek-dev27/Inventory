const ActivityLog = require('../models/ActivityLog');

/**
 * Extract clean IP address from Express request
 */
const getClientIp = (req) => {
  let ip =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.ip ||
    'Unknown';

  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  if (ip === '::1') {
    ip = '127.0.0.1';
  }

  return ip;
};

/**
 * Determine location info from IP
 */
const getLocationFromIp = (ip) => {
  if (
    !ip ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.31.')
  ) {
    return 'Local Device / Network';
  }

  return 'Remote Client';
};

/**
 * Parse User-Agent string to extract Browser, OS, and Device type
 */
const parseUserAgent = (uaString = '') => {
  const ua = uaString || '';
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let device = 'Desktop';

  // Device
  if (/mobile/i.test(ua)) {
    device = 'Mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    device = 'Tablet';
  } else {
    device = 'Desktop';
  }

  // OS
  if (/windows nt 10/i.test(ua)) {
    os = 'Windows 10/11';
  } else if (/windows nt/i.test(ua)) {
    os = 'Windows';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
  } else if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  // Browser
  if (/edg\//i.test(ua)) {
    const match = ua.match(/edg\/([\d.]+)/i);
    browser = `Edge ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/opr\/|opera/i.test(ua)) {
    const match = ua.match(/(?:opr|opera)[\/\s]([\d.]+)/i);
    browser = `Opera ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/chrome\//i.test(ua)) {
    const match = ua.match(/chrome\/([\d.]+)/i);
    browser = `Chrome ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/firefox\//i.test(ua)) {
    const match = ua.match(/firefox\/([\d.]+)/i);
    browser = `Firefox ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/safari\//i.test(ua) && !/chrome/i.test(ua)) {
    const match = ua.match(/version\/([\d.]+)/i);
    browser = `Safari ${match ? match[1].split('.')[0] : ''}`.trim();
  }

  return { browser, os, device };
};

/**
 * Safely record an activity / login event
 */
const recordActivity = async (req, data = {}) => {
  try {
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const { browser, os, device } = parseUserAgent(userAgent);
    const location = getLocationFromIp(ipAddress);

    await ActivityLog.create({
      userId: data.userId || null,
      userName: data.userName || null,
      userEmail: data.userEmail || 'unknown',
      role: data.role || null,
      action: data.action || 'LOGIN',
      status: data.status || 'SUCCESS',
      ipAddress,
      location: data.location || location,
      device,
      browser,
      os,
      userAgent,
      details: data.details || null,
    });
  } catch (error) {
    console.error('⚠️ Failed to record activity log:', error.message);
  }
};

module.exports = {
  getClientIp,
  getLocationFromIp,
  parseUserAgent,
  recordActivity,
};
