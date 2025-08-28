const jwt = require('jsonwebtoken');
const logger = require('./logger');
  try {
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '15m' } 
    );
    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' } 
    return {
      accessToken,
      refreshToken
    };
  } catch (error) {
    logger.error('Token generation error:', error);
    throw new Error('令牌生成失败');
  }
};
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.warn('Access token verification failed:', error.message);
    return null;
  }
};
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  } catch (error) {
    logger.warn('Refresh token verification failed:', error.message);
    return null;
  }
};
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Token decode error:', error);
    return null;
  }
};
const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    logger.error('Get token expiration error:', error);
    return null;
  }
};
const isTokenExpiringSoon = (token) => {
  try {
    const expiration = getTokenExpiration(token);
    if (!expiration) {
      return false;
    }
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return expiration <= fiveMinutesFromNow;
  } catch (error) {
    logger.error('Check token expiring soon error:', error);
    return false;
  }
};
module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getTokenExpiration,
  isTokenExpiringSoon
}; 
