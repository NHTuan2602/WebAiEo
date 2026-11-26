import { test, expect, E2E_CREDENTIALS, ensureE2EBootstrap } from './fixtures.js';

test.describe('7. Security & Business Logic Regression Audit', () => {
  test.beforeAll(async ({ baseURL }) => {
    await ensureE2EBootstrap(null, baseURL);
  });

  test('Blocks Mass Assignment & SVG XSS, enforces strict payment validation, idempotent confirm, private tx ledger, and game anti-cheat', async ({
    playwright,
    baseURL
  }) => {
    const studentApi = await playwright.request.newContext({ baseURL });
    const adminApi = await playwright.request.newContext({ baseURL });
    let createdTxId = '';

    try {
      // 1. Authenticate student & admin in isolated cookie contexts
      const stuLoginRes = await studentApi.post('/api/sync/auth/login', {
        data: {
          username: E2E_CREDENTIALS.student.username,
          password: E2E_CREDENTIALS.student.password
        }
      });
      expect(stuLoginRes.status()).toBe(200);

      const admLoginRes = await adminApi.post('/api/sync/auth/login', {
        data: {
          username: E2E_CREDENTIALS.admin.username,
          password: E2E_CREDENTIALS.admin.password
        }
      });
      expect(admLoginRes.status()).toBe(200);

      const initialSnapRes = await studentApi.get('/api/sync/state');
      expect(initialSnapRes.status()).toBe(200);
      const initialSnap = await initialSnapRes.json();
      const initialStudent = initialSnap?.users?.[E2E_CREDENTIALS.student.username];
      expect(initialStudent).toBeTruthy();

      const initialRealCredits = Number(initialStudent.realExamCredits) || 0;
      const initialWishCredits = Number(initialStudent.gachaWishCredits) || 0;
      const initialRoomCredits = Number(initialStudent.roomCreateCredits) || 0;
      const initialRpgGold = Number(initialStudent.knightRpgProfile?.gold) || 0;
      const initialRpgWishes = Number(initialStudent.knightRpgProfile?.wishes) || 0;
      const initialSkins = Array.isArray(initialStudent.knightRpgProfile?.unlockedSkins)
        ? initialStudent.knightRpgProfile.unlockedSkins
        : [];

      // 2. Subsystem 5: Mass Assignment & SVG/XSS rejection in UPSERT_USER
      const massAssignRes = await studentApi.post('/api/sync/action', {
        data: {
          type: 'UPSERT_USER',
          payload: {
            username: E2E_CREDENTIALS.student.username,
            user: {
              realExamCredits: 999,
              gachaWishCredits: 999,
              roomCreateCredits: 999,
              totalPaidVnd: 99_999_999,
              paidCount: 99,
              avatarDataUrl: 'data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9ImFsZXJ0KDEpIj48L3N2Zz4=',
              knightRpgProfile: {
                gold: 9_999_999,
                wishes: 999,
                unlockedSkins: [...initialSkins, 'forged_legendary_skin']
              }
            }
          }
        }
      });
      expect(massAssignRes.status()).toBe(200);

      const postTamperRes = await studentApi.get('/api/sync/state');
      const postTamperSnap = await postTamperRes.json();
      const postTamperUser = postTamperSnap?.users?.[E2E_CREDENTIALS.student.username];

      expect(Number(postTamperUser.realExamCredits) || 0).toBe(initialRealCredits);
      expect(Number(postTamperUser.gachaWishCredits) || 0).toBe(initialWishCredits);
      expect(Number(postTamperUser.roomCreateCredits) || 0).toBe(initialRoomCredits);
      expect(String(postTamperUser.avatarDataUrl || '')).not.toMatch(/image\/svg/i);
      expect(Number(postTamperUser.knightRpgProfile?.wishes) || 0).toBe(initialRpgWishes);
      expect(Number(postTamperUser.knightRpgProfile?.gold) || 0).toBeLessThanOrEqual(initialRpgGold + 25_000);
      expect(postTamperUser.knightRpgProfile?.unlockedSkins || []).not.toContain('forged_legendary_skin');

      // 3. Subsystem 4: Strict negative / float / invalid-itemType validation
      const badDonateNegative = await studentApi.post('/api/sync/action', {
        data: { type: 'REPORT_DONATE_PAYMENT', payload: { amount: -5000 } }
      });
      expect(badDonateNegative.status()).toBe(400);

      const badDonateZero = await studentApi.post('/api/sync/action', {
        data: { type: 'REPORT_DONATE_PAYMENT', payload: { amount: 0 } }
      });
      expect(badDonateZero.status()).toBe(400);

      const badDonateFloat = await studentApi.post('/api/sync/action', {
        data: { type: 'REPORT_DONATE_PAYMENT', payload: { amount: 5000.5 } }
      });
      expect(badDonateFloat.status()).toBe(400);

      const badOrderItem = await studentApi.post('/api/sync/payment/create-order', {
        data: { itemType: 'free_vip_bypass' }
      });
      expect(badOrderItem.status()).toBe(400);

      const badOrderDonateAmount = await studentApi.post('/api/sync/payment/create-order', {
        data: { itemType: 'donate', amount: -100 }
      });
      expect(badOrderDonateAmount.status()).toBe(400);

      const badRequestUnlockType = await studentApi.post('/api/sync/action', {
        data: { type: 'REQUEST_COVER_UNLOCK', payload: { itemType: 'invalid_pkg' } }
      });
      expect(badRequestUnlockType.status()).toBe(400);

      // 4. Subsystem 4 & 5: Payment request -> non-admin confirm forbidden -> SuperAdmin double-confirm idempotency + private ledger
      const reqUnlockRes = await studentApi.post('/api/sync/action', {
        data: { type: 'REQUEST_COVER_UNLOCK', payload: { itemType: 'room_ticket' } }
      });
      expect(reqUnlockRes.status()).toBe(200);

      const afterReqSnap = await (await studentApi.get('/api/sync/state')).json();
      const myTxs = afterReqSnap?.myPaymentTransactions;
      expect(Array.isArray(myTxs)).toBe(true);
      expect(myTxs.every(t => String(t.username || '').toLowerCase() === E2E_CREDENTIALS.student.username.toLowerCase())).toBe(true);

      const reportedTx = myTxs.find(t => t.itemType === 'room_ticket' && t.status === 'reported');
      expect(reportedTx).toBeTruthy();
      createdTxId = reportedTx.id;

      // Student must NEVER be able to confirm their own transaction
      const stuConfirmAttempt = await studentApi.post('/api/sync/action', {
        data: { type: 'CONFIRM_PAYMENT_TRANSACTION', payload: { transactionId: createdTxId } }
      });
      expect(stuConfirmAttempt.status()).toBe(403);

      // SuperAdmin confirms the SAME transaction twice (testing strict idempotency)
      const admConfirm1 = await adminApi.post('/api/sync/action', {
        data: { type: 'CONFIRM_PAYMENT_TRANSACTION', payload: { transactionId: createdTxId } }
      });
      expect(admConfirm1.status()).toBe(200);

      const admConfirm2 = await adminApi.post('/api/sync/action', {
        data: { type: 'CONFIRM_PAYMENT_TRANSACTION', payload: { transactionId: createdTxId } }
      });
      expect(admConfirm2.status()).toBe(200);

      const afterConfirmSnap = await (await studentApi.get('/api/sync/state')).json();
      const confirmedUser = afterConfirmSnap?.users?.[E2E_CREDENTIALS.student.username];
      expect(Number(confirmedUser.roomCreateCredits) || 0).toBe(initialRoomCredits + 1);

      const paidTx = (afterConfirmSnap?.myPaymentTransactions || []).find(t => t.id === createdTxId);
      expect(paidTx).toBeTruthy();
      expect(paidTx.status).toBe('paid');
      expect(paidTx.confirmedBy).toBe(E2E_CREDENTIALS.admin.username);
      expect(paidTx.balanceBefore?.roomCreateCredits).toBe(initialRoomCredits);
      expect(paidTx.balanceAfter?.roomCreateCredits).toBe(initialRoomCredits + 1);

      // 5. Subsystem 3: Monthly 20k Pass Gate + Game anti-cheat bounds & matchId replay deduplication
      const uniqueTopic = 'e2e_sec_audit_topic';
      const unpaidKnightRes = await studentApi.post('/api/sync/action', {
        data: {
          type: 'SUBMIT_PRACTICE_GAME_SCORE',
          payload: {
            gameType: 'knight_rpg',
            mode: 'knight_endless',
            topicId: uniqueTopic,
            topicLabel: 'Security Audit',
            passedCount: 3,
            totalCount: 10,
            score: 1200,
            matchId: `e2e_unpaid_${Date.now()}`,
            gameCompleted: true
          }
        }
      });
      expect(unpaidKnightRes.status()).toBe(403);

      const grantVipForAudit = await adminApi.post('/api/sync/action', {
        data: {
          type: 'TOGGLE_USER_SUBSCRIPTION',
          payload: {
            username: E2E_CREDENTIALS.student.username,
            kind: 'aieo_vip',
            active: true
          }
        }
      });
      expect(grantVipForAudit.status()).toBe(200);

      const zeroPassRes = await studentApi.post('/api/sync/action', {
        data: {
          type: 'SUBMIT_PRACTICE_GAME_SCORE',
          payload: {
            gameType: 'knight_rpg',
            mode: 'knight_endless',
            topicId: uniqueTopic,
            topicLabel: 'Security Audit',
            passedCount: 0,
            totalCount: 10,
            score: 250_000,
            matchId: `e2e_zero_${Date.now()}`,
            gameCompleted: true
          }
        }
      });
      expect(zeroPassRes.status()).toBe(200);

      const snapAfterZero = await (await studentApi.get('/api/sync/state')).json();
      const zeroEntry = (snapAfterZero?.gamePracticeLeaderboard || []).find(
        e => e.username === E2E_CREDENTIALS.student.username && e.topicId === uniqueTopic && e.gameType === 'knight_rpg'
      );
      expect(zeroEntry).toBeUndefined();

      const replayMatchId = `e2e_replay_${Date.now()}`;
      const matchPayload = {
        type: 'SUBMIT_PRACTICE_GAME_SCORE',
        payload: {
          gameType: 'knight_rpg',
          mode: 'knight_endless',
          topicId: uniqueTopic,
          topicLabel: 'Security Audit',
          passedCount: 2,
          totalCount: 10,
          score: 250_000,
          matchId: replayMatchId,
          gameCompleted: true
        }
      };

      const passRun1 = await studentApi.post('/api/sync/action', { data: matchPayload });
      expect(passRun1.status()).toBe(200);

      // Duplicate replay of exact same matchId must be ignored by server
      const passRun2 = await studentApi.post('/api/sync/action', { data: matchPayload });
      expect(passRun2.status()).toBe(200);

      const snapAfterReplay = await (await studentApi.get('/api/sync/state')).json();
      const capEntry = (snapAfterReplay?.gamePracticeLeaderboard || []).find(
        e => e.username === E2E_CREDENTIALS.student.username && e.topicId === uniqueTopic && e.gameType === 'knight_rpg'
      );
      expect(capEntry).toBeTruthy();
      expect(capEntry.score).toBeLessThanOrEqual(12_000);
      expect(capEntry.runsCount).toBe(1);
    } finally {
      await adminApi
        .post('/api/sync/action', {
          data: {
            type: 'TOGGLE_USER_SUBSCRIPTION',
            payload: {
              username: E2E_CREDENTIALS.student.username,
              kind: 'aieo_vip',
              active: false
            }
          }
        })
        .catch(() => {});
      if (createdTxId) {
        await adminApi
          .post('/api/sync/action', {
            data: { type: 'DELETE_PAYMENT_TRANSACTION', payload: { transactionId: createdTxId } }
          })
          .catch(() => {});
      }
      await studentApi.dispose();
      await adminApi.dispose();
    }
  });
});
