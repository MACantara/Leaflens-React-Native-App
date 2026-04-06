import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { login, register } from '../api/auth';
import { ApiError } from '../api/client';
import { Session } from '../types/models';

type AuthMode = 'login' | 'register';

interface AuthScreenProps {
  onAuthenticated: (session: Session) => void;
}

function parseApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (typeof error.payload === 'object' && error.payload && 'error' in error.payload) {
      return String((error.payload as { error: unknown }).error);
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unexpected error occurred.';
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps): React.JSX.Element {
  const [mode, setMode] = useState<AuthMode>('login');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const title = useMemo(() => (mode === 'login' ? 'Sign In' : 'Create Account'), [mode]);

  async function onSubmit(): Promise<void> {
    setLoading(true);
    setError('');

    try {
      const response =
        mode === 'login'
          ? await login(email.trim(), password)
          : await register(userName.trim(), email.trim(), password);

      onAuthenticated({
        token: response.token,
        userId: response.userId,
        userName: response.userName,
        email: response.email
      });
    } catch (submitError) {
      setError(parseApiError(submitError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Leaflens MVP</Text>
      <Text style={styles.subheading}>Identify and manage medicinal leaves</Text>

      <View style={styles.modeRow}>
        <Pressable style={[styles.modeButton, mode === 'login' && styles.modeButtonActive]} onPress={() => setMode('login')}>
          <Text style={[styles.modeLabel, mode === 'login' && styles.modeLabelActive]}>Login</Text>
        </Pressable>
        <Pressable
          style={[styles.modeButton, mode === 'register' && styles.modeButtonActive]}
          onPress={() => setMode('register')}
        >
          <Text style={[styles.modeLabel, mode === 'register' && styles.modeLabelActive]}>Register</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>

        {mode === 'register' && (
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={userName}
            onChangeText={setUserName}
            autoCapitalize="none"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error.length > 0 && <Text style={styles.errorText}>{error}</Text>}

        <Pressable style={styles.primaryButton} onPress={onSubmit} disabled={loading}>
          <Text style={styles.primaryButtonLabel}>{loading ? 'Please wait...' : title}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
    gap: 14
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a'
  },
  subheading: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 6
  },
  modeRow: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden'
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#e2e8f0'
  },
  modeButtonActive: {
    backgroundColor: '#1d4ed8'
  },
  modeLabel: {
    color: '#1f2937',
    fontWeight: '700'
  },
  modeLabelActive: {
    color: '#ffffff'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a'
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0f172a'
  },
  errorText: {
    color: '#dc2626'
  },
  primaryButton: {
    marginTop: 6,
    backgroundColor: '#1e3a8a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  primaryButtonLabel: {
    color: '#ffffff',
    fontWeight: '700'
  }
});
