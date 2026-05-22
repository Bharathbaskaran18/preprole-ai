import React, { useState } from 'react';
import './App.css';
import AnimatedBackground    from './components/AnimatedBackground';
import AnalyticsScreen       from './components/AnalyticsScreen';
import SignupScreen          from './components/SignupScreen';
import LoginScreen           from './components/LoginScreen';
import ConfirmationScreen    from './components/ConfirmationScreen';
import HomeScreen            from './components/HomeScreen';
import ProfileScreen         from './components/ProfileScreen';
import DifficultyScreen      from './components/DifficultyScreen';
import LevelScreen           from './components/LevelScreen';
import QuestionScreen        from './components/QuestionScreen';
import { AnswerRecord, Difficulty, LevelProgress, Screen, SessionScore, User } from './types';
import { saveScore, sendReport, validateJobRole } from './api/client';
import {
  cognitoSignUp,
  cognitoConfirmSignUp,
  cognitoResendCode,
  cognitoSignIn,
  cognitoSignOut,
  friendlyCognitoError,
} from './auth/cognito';

interface AppState {
  screen:          Screen;
  currentUser:     User | null;
  pendingEmail:    string;
  pendingPassword: string;
  jobRole:         string;
  difficulty:      Difficulty | null;
  selectedLevel:   number;
  levelProgress:   LevelProgress;
  sessionScores:   SessionScore[];
  questionKey:     number;
}

const initialState: AppState = {
  screen:          'login',
  currentUser:     null,
  pendingEmail:    '',
  pendingPassword: '',
  jobRole:         '',
  difficulty:      null,
  selectedLevel:   1,
  levelProgress:   {},
  sessionScores:   [],
  questionKey:     0,
};

function App() {
  const [state, setState] = useState<AppState>(initialState);

  const patch = (update: Partial<AppState>) =>
    setState((prev) => ({ ...prev, ...update }));

  // ── Auth ────────────────────────────────────────────────────────────────────

  const handleSignup = async (
    firstName: string,
    lastName:  string,
    dob:       string,
    email:     string,
    password:  string,
  ): Promise<string | null> => {
    try {
      await cognitoSignUp(email, password, firstName, lastName, dob);
      patch({ pendingEmail: email, pendingPassword: password, screen: 'confirmation' });
      return null;
    } catch (err) {
      return friendlyCognitoError(err);
    }
  };

  const handleConfirm = async (code: string): Promise<string | null> => {
    try {
      await cognitoConfirmSignUp(state.pendingEmail, code);
      // Auto-login after confirmation
      const user = await cognitoSignIn(state.pendingEmail, state.pendingPassword);
      setState((prev) => ({
        ...prev,
        currentUser:     user,
        pendingEmail:    '',
        pendingPassword: '', // clear from memory
        screen:          'home',
      }));
      return null;
    } catch (err) {
      return friendlyCognitoError(err);
    }
  };

  const handleResendCode = async (): Promise<void> => {
    await cognitoResendCode(state.pendingEmail);
  };

  const handleLogin = async (email: string, password: string): Promise<string | null> => {
    try {
      const user = await cognitoSignIn(email, password);
      patch({ currentUser: user, screen: 'home' });
      return null;
    } catch (err) {
      const msg = friendlyCognitoError(err);
      if (msg === 'EMAIL_NOT_CONFIRMED') {
        // User signed up but never confirmed — send them to confirmation screen
        patch({ pendingEmail: email, pendingPassword: password, screen: 'confirmation' });
        return null;
      }
      return msg;
    }
  };

  const handleLogout = () => {
    cognitoSignOut();
    setState({
      ...initialState,
      screen: 'login',
    });
  };

  // ── App navigation ──────────────────────────────────────────────────────────

  const handleStart = async (jobRole: string): Promise<string | null> => {
    const err = await validateJobRole(jobRole);
    if (err) return err;
    patch({ jobRole, screen: 'difficulty' });
    return null;
  };

  const handleSelectDifficulty = (difficulty: Difficulty) =>
    patch({ difficulty, screen: 'level' });

  const handleSelectLevel = (level: number) =>
    patch({ selectedLevel: level, screen: 'question', questionKey: Date.now() });

  const handleQuizComplete = (score: number, answers: AnswerRecord[]) => {
    if (!state.difficulty || !state.currentUser) return;
    const { difficulty, selectedLevel: level, jobRole, currentUser } = state;

    // Update level progress (best score) and append to session history in one setState
    setState((s) => {
      const prev = s.levelProgress[difficulty]?.[level] ?? -1;
      const newLevelProgress = score > prev
        ? { ...s.levelProgress, [difficulty]: { ...s.levelProgress[difficulty], [level]: score } }
        : s.levelProgress;
      return {
        ...s,
        levelProgress: newLevelProgress,
        sessionScores: [...s.sessionScores, { difficulty, level, score, jobRole }],
      };
    });

    // Persist score — use real Cognito userId (sub)
    const sessionId = `${jobRole}-${difficulty}-${Date.now()}`;
    saveScore({
      userId: currentUser.userId,
      sessionId,
      jobRole,
      difficulty,
      level,
      score,
      answers,
    }).catch((e: unknown) => console.error('save-score failed:', e));

    // Send report after every level completion
    sendReport({
      userId:    currentUser.userId,
      userEmail: currentUser.email,
      userName:  `${currentUser.firstName} ${currentUser.lastName}`,
      jobRole,
      difficulty,
    }).catch((e: unknown) => console.error('send-report failed:', e));
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const { screen, currentUser, jobRole, difficulty, selectedLevel, levelProgress, sessionScores, questionKey } = state;

  const renderScreen = (): React.ReactNode => {
    // ── Unauthenticated screens ───────────────────────────────────────────────
    if (screen === 'signup') {
      return (
        <SignupScreen
          onSignup={handleSignup}
          onGoToLogin={() => patch({ screen: 'login' })}
        />
      );
    }

    if (screen === 'confirmation') {
      return (
        <ConfirmationScreen
          email={state.pendingEmail}
          onConfirm={handleConfirm}
          onResend={handleResendCode}
          onGoToLogin={() => patch({ screen: 'login', pendingEmail: '', pendingPassword: '' })}
        />
      );
    }

    if (screen === 'login') {
      return (
        <LoginScreen
          onLogin={handleLogin}
          onGoToSignup={() => patch({ screen: 'signup' })}
        />
      );
    }

    // ── Guard: all screens below require a logged-in user ─────────────────────
    if (!currentUser) {
      return (
        <LoginScreen
          onLogin={handleLogin}
          onGoToSignup={() => patch({ screen: 'signup' })}
        />
      );
    }

    // ── Authenticated screens ─────────────────────────────────────────────────
    if (screen === 'profile') {
      return (
        <ProfileScreen
          user={currentUser}
          onBack={() => patch({ screen: 'home' })}
          onLogout={handleLogout}
          onAnalytics={() => patch({ screen: 'analytics' })}
        />
      );
    }

    if (screen === 'analytics') {
      return (
        <AnalyticsScreen
          userId={currentUser.userId}
          sessionScores={sessionScores}
          onBack={() => patch({ screen: 'profile' })}
        />
      );
    }

    if (screen === 'home') {
      return (
        <HomeScreen
          user={currentUser}
          onStart={handleStart}
          onProfile={() => patch({ screen: 'profile' })}
        />
      );
    }

    if (screen === 'difficulty') {
      return (
        <DifficultyScreen
          jobRole={jobRole}
          onSelect={handleSelectDifficulty}
          onBack={() => patch({ screen: 'home' })}
        />
      );
    }

    if (screen === 'level' && difficulty) {
      return (
        <LevelScreen
          difficulty={difficulty}
          jobRole={jobRole}
          levelProgress={levelProgress}
          onSelectLevel={handleSelectLevel}
          onBack={() => patch({ screen: 'difficulty' })}
        />
      );
    }

    if (screen === 'question' && difficulty) {
      return (
        <QuestionScreen
          key={questionKey}
          difficulty={difficulty}
          level={selectedLevel}
          jobRole={jobRole}
          onComplete={handleQuizComplete}
          onBack={() => patch({ screen: 'level' })}
        />
      );
    }

    return null;
  };

  return (
    <>
      <AnimatedBackground />
      {renderScreen()}
    </>
  );
}

export default App;
