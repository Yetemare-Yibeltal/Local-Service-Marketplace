// ============================================================
// JEST SETUP
// Runs before all tests to configure test environment
// ============================================================

// ============================================================
// ENVIRONMENT SETUP
// ============================================================

// Ensure test environment
process.env.NODE_ENV = 'test';

// Set test port
process.env.PORT = '5001';

// Set test JWT secrets
process.env.JWT_ACCESS_SECRET = 'test_access_secret_32_chars_minimum_1234567890';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_32_chars_minimum_1234567890';

// ============================================================
// LOGGER SILENCING
// ============================================================

// Mock logger to reduce noise in test output
jest.mock('./src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
  log: jest.fn(),
  child: jest.fn().mockReturnThis(),
}));

// ============================================================
// EXTERNAL SERVICES MOCKS
// ============================================================

// Mock email service
jest.mock('./src/config/email', () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  getWelcomeEmailTemplate: jest.fn().mockReturnValue({
    subject: 'Welcome',
    html: '<html><body>Welcome</body></html>',
  }),
  getOTPEmailTemplate: jest.fn().mockReturnValue({
    subject: 'OTP',
    html: '<html><body>OTP</body></html>',
  }),
  getPasswordResetEmailTemplate: jest.fn().mockReturnValue({
    subject: 'Reset Password',
    html: '<html><body>Reset</body></html>',
  }),
}));

// Mock Twilio SMS service
jest.mock('./src/services/external/twilio.service', () => ({
  sendSMS: jest.fn().mockResolvedValue({ success: true, messageId: 'test-sms-id' }),
  sendOTP: jest.fn().mockResolvedValue({ success: true, messageId: 'test-otp-id' }),
  validatePhoneNumber: jest.fn().mockReturnValue({ isValid: true, formattedNumber: '+251912345678' }),
  formatPhoneNumber: jest.fn().mockReturnValue('+251912345678'),
  isConfiguredFn: jest.fn().mockReturnValue(true),
}));

// Mock Cloudinary
jest.mock('./src/config/cloudinary', () => ({
  initializeCloudinary: jest.fn(),
  uploadImage: jest.fn().mockResolvedValue({
    public_id: 'test-public-id',
    secure_url: 'https://test.cloudinary.com/test.jpg',
    url: 'http://test.cloudinary.com/test.jpg',
    format: 'jpg',
    width: 100,
    height: 100,
    bytes: 1000,
  }),
  uploadAvatar: jest.fn().mockResolvedValue({
    public_id: 'avatar-test-id',
    secure_url: 'https://test.cloudinary.com/avatar.jpg',
  }),
  deleteImage: jest.fn().mockResolvedValue({ result: 'ok' }),
  isConfiguredFn: jest.fn().mockReturnValue(true),
}));

// Mock Redis
jest.mock('./src/config/redis', () => ({
  createRedisClient: jest.fn().mockReturnValue({
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(100),
    incrBy: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    flushAll: jest.fn().mockResolvedValue('OK'),
  }),
  connectRedis: jest.fn().mockResolvedValue(undefined),
  disconnectRedis: jest.fn().mockResolvedValue(undefined),
  getRedisClient: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  }),
  isRedisConnected: jest.fn().mockReturnValue(true),
  redisHealthCheck: jest.fn().mockResolvedValue(true),
}));

// ============================================================
// DATABASE SETUP
// ============================================================

// Increase timeout for database operations
jest.setTimeout(30000);

// ============================================================
// CLEANUP
// ============================================================

// Clean up after all tests
afterAll(async () => {
  // Close database connections if any
  // Any other cleanup needed
});

// ============================================================
// GLOBAL TEST HELPERS
// ============================================================

// Define global test helpers
global.createTestUser = async (overrides = {}) => {
  const defaultUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    phone: '+251912345678',
    fullName: 'Test User',
    role: 'CUSTOMER',
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return defaultUser;
};

global.createTestProvider = async (overrides = {}) => {
  const defaultProvider = {
    id: 'test-provider-id',
    userId: 'test-user-id',
    businessName: 'Test Business',
    description: 'Test description',
    category: 'Plumbing',
    isAvailable: true,
    isVerified: true,
    averageRating: 4.5,
    totalReviews: 10,
    locationLat: 9.03,
    locationLng: 38.74,
    address: 'Bole, Addis Ababa',
    city: 'Addis Ababa',
    completedJobs: 5,
    ...overrides,
  };
  return defaultProvider;
};