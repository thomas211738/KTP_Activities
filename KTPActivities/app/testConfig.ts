/**
 * Test configuration for Apple TestFlight review only.
 * 
 * This file allows specific test accounts to bypass the .edu email restriction
 * during App Review. This is TEMPORARY and must be disabled before public release.
 * 
 * Currently enabled via Firebase Remote Config: TEST_MODE_ENABLED = true
 */

import Constants from 'expo-constants';

const extra = Constants?.expoConfig?.extra || {};

// Read from Firebase Remote Config (you set this in the Firebase console)
export const TEST_MODE_ENABLED = extra.testModeEnabled === true 
  || extra.TEST_MODE_ENABLED === true;

// Allowed test emails for Apple review
export const ALLOWED_TEST_EMAILS = [
  'bostonktp.review@gmail.com',     // Primary test account for Apple
  'testktpapp@gmail.com',           // Backup (existing)
  // Add more test emails here if needed during review
] as const;

export const isTestEmail = (email: string): boolean => {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return ALLOWED_TEST_EMAILS.some(testEmail => 
    testEmail.toLowerCase() === normalized
  );
};

// Loud warning when test mode is active
if (TEST_MODE_ENABLED) {
  console.warn(
    '🚨 TEST MODE ENABLED FOR APPLE REVIEW\n' +
    'Allowed test emails: ' + ALLOWED_TEST_EMAILS.join(', ') + '\n' +
    'This bypasses the .edu email requirement.\n' +
    'Make sure to disable TEST_MODE_ENABLED in Firebase Remote Config before public release.'
  );
}
