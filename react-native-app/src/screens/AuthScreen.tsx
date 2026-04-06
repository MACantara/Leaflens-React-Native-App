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
      <View style={styles.heroWrap}>
        <Text style={styles.heading}>LeafLens</Text>
        <Text style={styles.subheading}>Identify and manage medicinal leaves with your personal collection and history.</Text>
      </View>

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
        <Text style={styles.cardCaption}>
          {mode === 'login'
            ? 'Sign in to access your saved leaves and history.'
            : 'Create an account to start building your leaf collection.'}
        </Text>

        {mode === 'register' && (
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#9ca3af"
            value={userName}
            onChangeText={setUserName}
            autoCapitalize="none"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error.length > 0 && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Pressable style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} onPress={onSubmit} disabled={loading}>
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
    backgroundColor: '#ece1dd',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14
  },
  heroWrap: {
    gap: 4
  },
  heading: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827'
  },
  subheading: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 4
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: '#d2dcc8',
    borderRadius: 16,
    padding: 4,
    gap: 4
  },
  modeButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center'
  },
  modeButtonActive: {
    backgroundColor: '#ffffff'
  },
  modeLabel: {
    color: '#475569',
    fontWeight: '700'
  },
  modeLabelActive: {
    color: '#111827'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111827'
  },
  cardCaption: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 2
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    color: '#111827'
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  errorText: {
    color: '#b91c1c',
    fontWeight: '600'
  },
  primaryButton: {
    marginTop: 6,
    backgroundColor: '#8bc34a',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center'
  },
  primaryButtonDisabled: {
    backgroundColor: '#b4c694'
  },
  primaryButtonLabel: {
    color: '#f3fff0',
    fontSize: 16,
    fontWeight: '700'
  }
});
