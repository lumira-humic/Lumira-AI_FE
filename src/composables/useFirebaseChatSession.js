import { signInWithCustomToken, signOut } from "firebase/auth";
import {
  ref as rtdbRef,
  onValue,
  onDisconnect,
  set as rtdbSet,
  serverTimestamp as rtdbServerTimestamp,
} from "firebase/database";

import { firebaseAuth, rtdb } from "@/lib/firebase";
import { chatService } from "@/services/chatService";


// ─────────────────────────────────────────────
// Module-level singleton state
// ─────────────────────────────────────────────

/** @type {{ uid: string, actorType: 'user'|'patient' } | null} */
let session = null;

let refreshTimer = null;
let connectedUnsub = null;
let presenceStarted = false;

/** Re-mint custom token ~10 minutes before its 3600s expiry. */
const REFRESH_INTERVAL_MS = 50 * 60 * 1000;


// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Mint a Firebase custom token via the backend, sign into Firebase Auth,
 * start RTDB self-presence, and schedule periodic re-mints.
 *
 * Idempotent: safe to call multiple times. Subsequent calls re-authenticate.
 */
export async function signIntoFirebaseAfterBackendLogin() {
  const tokenPayload = await chatService.mintFirebaseToken();
  const { customToken, uid, actorType } = tokenPayload || {};

  if (!customToken) {
    throw new Error("Backend did not return a Firebase custom token.");
  }

  await signInWithCustomToken(firebaseAuth, customToken);

  session = { uid, actorType };

  scheduleFirebaseTokenRefresh();
  startSelfPresence();

  return session;
}

/**
 * Returns the cached actorType from the most recent firebase-token mint.
 * Use this for RTDB self-presence path. May be null before first sign-in.
 */
export function getFirebaseActorType() {
  return session?.actorType ?? null;
}

/**
 * Returns the cached Firebase UID. Prefer firebaseAuth.currentUser?.uid for
 * up-to-date checks, but this mirror is convenient for cleanup paths after
 * signOut() has cleared currentUser.
 */
export function getFirebaseUid() {
  return session?.uid ?? firebaseAuth.currentUser?.uid ?? null;
}

/**
 * Cleanup before logging out of the backend:
 *   1. Mark RTDB presence as offline (best-effort).
 *   2. Cancel the token refresh timer.
 *   3. signOut(firebaseAuth).
 *
 * Backend logout (POST /auth/logout) is the caller's responsibility AFTER this.
 */
export async function performFirebaseLogoutCleanup() {
  cancelFirebaseTokenRefresh();
  stopSelfPresenceListener();

  const uid = getFirebaseUid();
  const actorType = getFirebaseActorType();

  if (uid && actorType) {
    try {
      await rtdbSet(rtdbRef(rtdb, `status/${actorType}/${uid}`), {
        state: "offline",
        last_changed: rtdbServerTimestamp(),
      });
    } catch {
      // best-effort
    }
  }

  try {
    await signOut(firebaseAuth);
  } catch {
    // best-effort
  }

  session = null;
  presenceStarted = false;
}


// ─────────────────────────────────────────────
// Internal: token refresh
// ─────────────────────────────────────────────

function scheduleFirebaseTokenRefresh() {
  cancelFirebaseTokenRefresh();
  refreshTimer = setTimeout(async () => {
    try {
      const next = await chatService.mintFirebaseToken();
      if (next?.customToken) {
        await signInWithCustomToken(firebaseAuth, next.customToken);
        session = { uid: next.uid, actorType: next.actorType };
      }
    } catch (err) {
      // Network blips happen; re-schedule and try again.
      // eslint-disable-next-line no-console
      console.warn("Firebase token refresh failed", err);
    } finally {
      scheduleFirebaseTokenRefresh();
    }
  }, REFRESH_INTERVAL_MS);
}

function cancelFirebaseTokenRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}


// ─────────────────────────────────────────────
// Internal: RTDB self-presence
// ─────────────────────────────────────────────

function startSelfPresence() {
  if (presenceStarted) return;
  const uid = getFirebaseUid();
  const actorType = getFirebaseActorType();
  if (!uid || !actorType) return;

  presenceStarted = true;

  const myStatusRef = rtdbRef(rtdb, `status/${actorType}/${uid}`);
  const offline = { state: "offline", last_changed: rtdbServerTimestamp() };
  const online = { state: "online", last_changed: rtdbServerTimestamp() };

  const connectedRef = rtdbRef(rtdb, ".info/connected");
  connectedUnsub = onValue(connectedRef, (snap) => {
    if (snap.val() === false) return;
    onDisconnect(myStatusRef)
      .set(offline)
      .then(() => {
        rtdbSet(myStatusRef, online);
      });
  });
}

function stopSelfPresenceListener() {
  if (connectedUnsub) {
    try {
      connectedUnsub();
    } catch {
      // ignore
    }
    connectedUnsub = null;
  }
}
