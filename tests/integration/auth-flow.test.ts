import { db } from '../../lib/db';
import {
  requestStudentOtp,
  registerStudent,
  loginStudent,
  requestParentConsentOtp,
  verifyParentConsent,
} from '../../features/identity/service';
import { ClassLevel, TargetExam } from '@prisma/client';

async function runAuthIntegrationTests(): Promise<void> {
  process.stdout.write('\n=== RUNNING AUTH INTEGRATION TESTS (Checkpoint 5) ===\n');

  const testPhoneAdult = '+2348011112222';
  const testPhoneMinor = '+2348022223333';
  const testParentPhone = '+2348033334444';

  // Clean up any previous test runs
  await db.user.deleteMany({
    where: { phone: { in: [testPhoneAdult, testPhoneMinor, testParentPhone] } },
  });

  // TEST 1: Request OTP
  process.stdout.write('Test 1: Request OTP... ');
  const otpRes = await requestStudentOtp({ phone: testPhoneAdult }, '127.0.0.1');
  if (!otpRes.ok) throw new Error(`OTP request failed: ${otpRes.reason}`);
  process.stdout.write('PASSED\n');

  // TEST 2: Sign up adult student (Age >= 13)
  process.stdout.write('Test 2: Sign up adult student (Age >= 13)... ');
  const signupAdult = await registerStudent(
    {
      phone: testPhoneAdult,
      otp: '123456',
      displayName: 'Chidera Adeyemi',
      classLevel: ClassLevel.SS2,
      targetExam: TargetExam.WAEC,
      isMinorUnder13: false,
    },
    '127.0.0.1'
  );
  if (!signupAdult.ok) throw new Error(`Signup failed: ${signupAdult.message}`);
  if (signupAdult.data.isLockedMinor !== false) throw new Error('Adult student should not be locked');
  process.stdout.write('PASSED (User ID created and unlocked)\n');

  // TEST 3: Sign in adult student
  process.stdout.write('Test 3: Sign in existing student... ');
  const signinAdult = await loginStudent({ phone: testPhoneAdult, otp: '123456' }, '127.0.0.1');
  if (!signinAdult.ok) throw new Error(`Signin failed: ${signinAdult.message}`);
  if (signinAdult.data.userId !== signupAdult.data.userId) throw new Error('User ID mismatch');
  process.stdout.write('PASSED\n');

  // TEST 4: Sign up minor student (Age < 13) -> Account MUST be locked
  process.stdout.write('Test 4: Sign up minor under 13 (F1.4 lock check)... ');
  const signupMinor = await registerStudent(
    {
      phone: testPhoneMinor,
      otp: '123456',
      displayName: 'Junior Adeyemi',
      classLevel: ClassLevel.JSS1,
      targetExam: TargetExam.NONE,
      isMinorUnder13: true,
    },
    '127.0.0.1'
  );
  if (!signupMinor.ok) throw new Error(`Minor signup failed: ${signupMinor.message}`);
  if (signupMinor.data.isLockedMinor !== true) throw new Error('Under-13 account MUST be created locked');
  
  // Verify DB record
  const dbProfile = await db.studentProfile.findUnique({
    where: { userId: signupMinor.data.userId },
  });
  if (!dbProfile?.isMinorUnder13 || dbProfile.consentGrantedAt !== null) {
    throw new Error('Database integrity check failed: under-13 consent must be null');
  }
  process.stdout.write('PASSED (Account created locked)\n');

  // TEST 5: Minor consent on SAME phone number -> MUST FAIL
  process.stdout.write('Test 5: Parent consent using student own phone (security.md 8)... ');
  const samePhoneConsent = await requestParentConsentOtp(
    signupMinor.data.userId,
    { parentPhone: testPhoneMinor },
    '127.0.0.1'
  );
  if (samePhoneConsent.ok || samePhoneConsent.reason !== 'same_phone_not_allowed') {
    throw new Error('Consent with same phone MUST be rejected');
  }
  process.stdout.write('PASSED (Rejected as expected)\n');

  // TEST 6: Minor consent on DIFFERENT phone number -> Request OTP
  process.stdout.write('Test 6: Parent consent OTP to different phone number... ');
  const diffPhoneConsent = await requestParentConsentOtp(
    signupMinor.data.userId,
    { parentPhone: testParentPhone },
    '127.0.0.1'
  );
  if (!diffPhoneConsent.ok) throw new Error(`Parent OTP failed: ${diffPhoneConsent.message}`);
  process.stdout.write('PASSED\n');

  // TEST 7: Verify parent OTP -> Account MUST be unlocked & consent timestamped
  process.stdout.write('Test 7: Verify parent OTP & unlock account... ');
  const verifyConsent = await verifyParentConsent(signupMinor.data.userId, {
    parentPhone: testParentPhone,
    otp: '123456',
  });
  if (!verifyConsent.ok) throw new Error(`Consent verification failed: ${verifyConsent.message}`);

  const unlockedProfile = await db.studentProfile.findUnique({
    where: { userId: signupMinor.data.userId },
  });
  if (!unlockedProfile?.consentGrantedAt || unlockedProfile.consentPhone !== testParentPhone) {
    throw new Error('Consent event not recorded properly in database');
  }
  process.stdout.write('PASSED (Consent stored with timestamp and parent phone)\n');

  // Clean up test data
  await db.user.deleteMany({
    where: { phone: { in: [testPhoneAdult, testPhoneMinor, testParentPhone] } },
  });

  process.stdout.write('\n✅ ALL 7 AUTH INTEGRATION TESTS PASSED CLEANLY!\n\n');
}

runAuthIntegrationTests()
  .catch((err: unknown) => {
    process.stderr.write(`\n❌ TEST FAILURE: ${String(err)}\n`);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
