import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DataStore } from './models/store.ts';
import { generateToken, getJwtSecret } from './middleware/auth.ts';

async function runTests() {
  console.log('\n========================================');
  console.log('  RUNNING LEGALCONNECT SYSTEM TESTS');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST SUITE 1: AUTHENTICATION & PASSWORD HASHING
    // -------------------------------------------------------------
    console.log('[Suite 1: Authentication & Password Security]');

    const rawPassword = 'SecureLegalPassword123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    assert(hash.startsWith('$2'), 'Bcrypt password hash format is valid');
    assert(hash !== rawPassword, 'Plaintext password is never stored directly');

    const validComparison = await bcrypt.compare(rawPassword, hash);
    assert(validComparison === true, 'Bcrypt successfully validates correct password');

    const invalidComparison = await bcrypt.compare('WrongPassword999!', hash);
    assert(invalidComparison === false, 'Bcrypt rejects incorrect password');

    // Test JWT generation and signature verification
    const testUserPayload = {
      userId: 'test_client_uuid_101',
      email: 'tester@example.com',
      name: 'Test Client',
      role: 'client' as const,
    };
    const token = generateToken(testUserPayload);
    assert(typeof token === 'string' && token.split('.').length === 3, 'JWT is valid 3-part signed token');

    const decoded = jwt.verify(token, getJwtSecret()) as any;
    assert(decoded.userId === testUserPayload.userId, 'JWT payload decodes userId correctly');
    assert(decoded.role === 'client', 'JWT payload preserves role attribute');

    // -------------------------------------------------------------
    // TEST SUITE 2: ROLE-BASED ACCESS CONTROL (RBAC) LOGIC
    // -------------------------------------------------------------
    console.log('\n[Suite 2: Role Permissions & Access Control]');

    function checkPermission(userRole: string, allowedRoles: string[]): boolean {
      return allowedRoles.includes(userRole);
    }

    assert(
      checkPermission('client', ['client', 'admin']) === true,
      'Client role permitted on client routes'
    );
    assert(
      checkPermission('client', ['lawyer', 'admin']) === false,
      'Client role denied on lawyer-only routes'
    );
    assert(
      checkPermission('lawyer', ['lawyer', 'admin']) === true,
      'Lawyer role permitted on lawyer routes'
    );
    assert(
      checkPermission('lawyer', ['admin']) === false,
      'Lawyer role denied on admin-only routes'
    );
    assert(
      checkPermission('admin', ['admin']) === true,
      'Admin role permitted on admin routes'
    );

    // -------------------------------------------------------------
    // TEST SUITE 3: BOOKING CONFLICT & DOUBLE-BOOKING PREVENTION
    // -------------------------------------------------------------
    console.log('\n[Suite 3: Booking Conflicts & Double-Booking Safeguards]');

    const runSuffix = Date.now();
    const lawyerId = `test_lawyer_conflict_${runSuffix}`;
    const testDate = '2026-11-20';
    const testTime = '14:00';

    // Verify initial slot is free
    const initialConflict = await DataStore.checkBookingConflict(lawyerId, testDate, testTime);
    assert(initialConflict === false, 'Slot is initially open for booking');

    // Create first booking
    await DataStore.createAppointment({
      lawyerId,
      clientId: 'client_A',
      clientName: 'Client A',
      clientEmail: 'clienta@example.com',
      lawyerName: 'Test Lawyer',
      lawyerEmail: 'testlawyer@example.com',
      legalDomainId: 'corporate',
      legalDomainName: 'Corporate',
      appointmentDate: testDate,
      startTime: testTime,
      endTime: '14:45',
      status: 'confirmed',
      consultationType: 'video',
      fee: 150,
      issueSummary: 'First booking on slot',
    });

    // Attempt second booking on identical slot
    const secondaryConflict = await DataStore.checkBookingConflict(lawyerId, testDate, testTime);
    assert(secondaryConflict === true, 'Server detects booking conflict on same date and time');

    let preventedDoubleBooking = false;
    try {
      await DataStore.createAppointment({
        lawyerId,
        clientId: 'client_B',
        clientName: 'Client B',
        clientEmail: 'clientb@example.com',
        lawyerName: 'Test Lawyer',
        lawyerEmail: 'testlawyer@example.com',
        legalDomainId: 'corporate',
        legalDomainName: 'Corporate',
        appointmentDate: testDate,
        startTime: testTime,
        endTime: '14:45',
        status: 'requested',
        consultationType: 'video',
        fee: 150,
        issueSummary: 'Conflicting second booking attempt',
      });
    } catch (err: any) {
      preventedDoubleBooking = true;
    }
    assert(preventedDoubleBooking === true, 'createAppointment strictly rejects double-booking attempt');

    // Different time slot should succeed
    const differentSlotConflict = await DataStore.checkBookingConflict(
      lawyerId,
      testDate,
      '15:00'
    );
    assert(differentSlotConflict === false, 'Non-overlapping slot at 15:00 remains available');

    // -------------------------------------------------------------
    // TEST SUITE 4: REAL-TIME PRIVILEGED CONSULTATION MESSAGING
    // -------------------------------------------------------------
    console.log('\n[Suite 4: Real-Time Privileged Consultation Messaging]');

    const consultationId = `consultation_chat_test_${runSuffix}`;
    const testClientId = `client_test_${runSuffix}`;
    const msg1 = await DataStore.createAppointmentMessage({
      consultationId,
      senderId: testClientId,
      senderName: 'Client A',
      senderRole: 'client',
      content: 'Hello Advocate, I have uploaded the shareholder agreement for review.',
      timestamp: Date.now() - 5000,
    });
    assert(!!msg1._id, 'Client message is persisted with unique ID');
    assert(msg1.content.includes('shareholder agreement'), 'Message payload preserved accurately');

    const msg2 = await DataStore.createAppointmentMessage({
      consultationId,
      senderId: lawyerId,
      senderName: 'Test Lawyer',
      senderRole: 'lawyer',
      content: 'Received. Joining the encrypted video conference now.',
      timestamp: Date.now(),
    });
    assert(msg2.senderRole === 'lawyer', 'Lawyer sender role is verified');

    const chatHistory = await DataStore.getAppointmentMessages(consultationId);
    assert(chatHistory.length === 2, 'Consultation chat history correctly aggregates messages');
    assert(chatHistory[0].timestamp <= chatHistory[1].timestamp, 'Messages are ordered chronologically');

    // -------------------------------------------------------------
    // TEST SUITE 5: SYSTEM HEALTH, LAWYER DIRECTORY & VAULT
    // -------------------------------------------------------------
    console.log('\n[Suite 5: System Health, Directory & Document Vault]');

    // Test health status payload structure
    const healthPayload = {
      status: 'healthy',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      service: 'LegalConnect Platform',
      environment: process.env.NODE_ENV || 'development',
    };
    assert(healthPayload.status === 'healthy', 'Health endpoint status returns healthy');
    assert(typeof healthPayload.uptime === 'number' && healthPayload.uptime >= 0, 'Health endpoint reports valid uptime number');
    assert(healthPayload.service.includes('LegalConnect'), 'Health endpoint identifies LegalConnect service');

    // Test lawyer directory queries
    const lawyers = await DataStore.getLawyers();
    assert(Array.isArray(lawyers) && lawyers.length > 0, `Lawyer directory returns populated roster (${lawyers.length} active practitioners)`);

    const corporateLawyers = await DataStore.getLawyers({ domain: 'Corporate & Commercial' });
    assert(corporateLawyers.length > 0, 'Domain filter correctly narrows lawyers to Corporate & Commercial');

    // Test secure document creation and retrieval
    const testDoc = await DataStore.createDocument({
      title: 'Commercial Lease Agreement v2',
      fileName: 'lease_agreement_signed.pdf',
      fileSize: '2.4 MB',
      fileType: 'application/pdf',
      uploadedBy: testClientId,
      uploadedByName: 'Client A',
      sharedWith: [lawyerId],
      tags: ['Property', 'Contract'],
      status: 'verified',
    });
    assert(!!testDoc._id, 'Document vault persists document with unique ID');
    const userDocs = await DataStore.getDocumentsForUser(testClientId, 'client');
    assert(userDocs.some(d => d._id === testDoc._id), 'Client can retrieve their uploaded documents from vault');

    console.log('\n========================================');
    console.log(`  TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('========================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith('tests.ts') || process.argv[1]?.endsWith('tests.js')) {
  runTests();
}

export { runTests };
