import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';
import { User } from '../types';

const pool = new CognitoUserPool({
  UserPoolId: 'us-east-1_HbM4crZX9',
  ClientId:   '7qa9oh6d7c25l8894snagbpf91',
});

// ── Friendly error messages ───────────────────────────────────────────────────

export function friendlyCognitoError(err: unknown): string {
  if (!(err instanceof Error)) return 'Something went wrong. Please try again.';
  const msg = err.message;
  if (msg.includes('User does not exist') || msg.includes('UserNotFoundException'))
    return 'No account found with this email.';
  if (msg.includes('Incorrect username or password') || msg.includes('NotAuthorizedException'))
    return 'Incorrect email or password.';
  if (msg.includes('User is not confirmed') || msg.includes('UserNotConfirmedException'))
    return 'EMAIL_NOT_CONFIRMED'; // sentinel — App.tsx redirects to confirmation screen
  if (msg.includes('UsernameExistsException') || msg.includes('already exists'))
    return 'An account with this email already exists.';
  if (msg.includes('CodeMismatchException') || msg.includes('Invalid verification code'))
    return 'That code is incorrect. Please try again.';
  if (msg.includes('ExpiredCodeException') || msg.includes('expired'))
    return 'That code has expired. Please request a new one.';
  if (msg.includes('LimitExceededException') || msg.includes('Attempt limit exceeded'))
    return 'Too many attempts. Please wait a few minutes and try again.';
  if (msg.includes('InvalidPasswordException') || msg.includes('Password did not conform'))
    return 'Password must be at least 8 characters and include uppercase, lowercase, and a number.';
  return msg;
}

// ── Sign up ───────────────────────────────────────────────────────────────────

export function cognitoSignUp(
  email:     string,
  password:  string,
  firstName: string,
  lastName:  string,
  dob:       string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const attributes = [
      new CognitoUserAttribute({ Name: 'email',     Value: email }),
      new CognitoUserAttribute({ Name: 'name',      Value: `${firstName} ${lastName}` }),
      new CognitoUserAttribute({ Name: 'birthdate', Value: dob }), // already YYYY-MM-DD from date input
    ];
    pool.signUp(email, password, attributes, [], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ── Confirm sign-up ───────────────────────────────────────────────────────────

export function cognitoConfirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: pool });
    user.confirmRegistration(code.trim(), true, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ── Resend confirmation code ──────────────────────────────────────────────────

export function cognitoResendCode(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: pool });
    user.resendConfirmationCode((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ── Sign in ───────────────────────────────────────────────────────────────────

export function cognitoSignIn(email: string, password: string): Promise<User> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: pool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });

    user.authenticateUser(authDetails, {
      onSuccess(session) {
        const payload = session.getIdToken().decodePayload();
        const fullName = (payload['name'] as string) ?? '';
        const spaceIdx = fullName.indexOf(' ');
        const firstName = spaceIdx === -1 ? fullName : fullName.slice(0, spaceIdx);
        const lastName  = spaceIdx === -1 ? ''        : fullName.slice(spaceIdx + 1);
        resolve({
          userId:    payload['sub']       as string,
          firstName,
          lastName,
          dob:       (payload['birthdate'] as string) ?? '',
          email:     (payload['email']     as string) ?? email,
        });
      },
      onFailure: reject,
    });
  });
}

// ── Sign out ──────────────────────────────────────────────────────────────────

export function cognitoSignOut(): void {
  pool.getCurrentUser()?.signOut();
}
