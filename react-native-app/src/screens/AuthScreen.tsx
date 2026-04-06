import React, { useState } from 'react';
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

  const isLoginMode = mode === 'login';

  async function onSubmit(): Promise<void> {
    setLoading(true);
    setError('');

    try {
      const response = isLoginMode
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
      <View style={styles.brandWrap}>
        <View style={styles.logoMark}>
          <View style={styles.logoLeft} />
          <View style={styles.logoRight} />
        </View>
        <Text style={styles.brandText}>LEAFLENS</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.formTitle}>{isLoginMode ? 'Login' : 'Register'}</Text>

        {mode === 'register' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#b4b7bf"
              value={userName}
              onChangeText={setUserName}
              autoCapitalize="none"
            />
          </View>
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#b4b7bf"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#b4b7bf"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {error.length > 0 && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Pressable style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={onSubmit} disabled={loading}>
          <Text style={styles.submitButtonText}>{loading ? 'Please wait...' : isLoginMode ? 'Login' : 'Create Account'}</Text>
        </Pressable>

        <View style={styles.toggleWrap}>
          <Text style={styles.togglePrompt}>{isLoginMode ? 'Does not have an account yet?' : 'Already have an account?'}</Text>
          <Pressable
            onPress={() => {
              setMode(isLoginMode ? 'register' : 'login');
              setError('');
            }}
          >
            <Text style={styles.toggleAction}>{isLoginMode ? 'Create One' : 'Login'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ece1dd',
    paddingHorizontal: 24,
    paddingTop: 92,
    paddingBottom: 20
  },
  brandWrap: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 34
  },
  logoMark: {
    width: 52,
    height: 42,
    position: 'relative'
  },
  logoLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 24,
    height: 36,
    borderLeftWidth: 9,
    borderBottomWidth: 9,
    borderColor: '#b4c663'
  },
  logoRight: {
    position: 'absolute',
    right: 0,
    top: 6,
    width: 24,
    height: 36,
    borderRightWidth: 9,
    borderTopWidth: 9,
    borderColor: '#69c665'
  },
  brandText: {
    color: '#09090b',
    letterSpacing: 4,
    fontWeight: '800',
    fontSize: 16
  },
  card: {
    backgroundColor: '#ececec',
    borderRadius: 32,
    paddingTop: 30,
    paddingBottom: 26,
    paddingHorizontal: 22,
    gap: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 16,
    elevation: 8
  },
  formTitle: {
    color: '#111827',
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 2
  },
  fieldGroup: {
    gap: 6
  },
  fieldLabel: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '700',
    paddingLeft: 4
  },
  input: {
    minHeight: 56,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbcbcb',
    backgroundColor: '#efefef',
    color: '#111827',
    fontSize: 16,
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  errorBox: {
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  errorText: {
    color: '#b91c1c',
    textAlign: 'center',
    fontWeight: '600'
  },
  submitButton: {
    marginTop: 4,
    minHeight: 72,
    borderRadius: 22,
    backgroundColor: '#8bc34a',
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitButtonDisabled: {
    backgroundColor: '#b4c694'
  },
  submitButtonText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 18
  },
  toggleWrap: {
    marginTop: 14,
    paddingBottom: 4,
    alignItems: 'center',
    gap: 10
  },
  togglePrompt: {
    color: '#8c8c8c',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center'
  },
  toggleAction: {
    color: '#1f1f1f',
    fontSize: 18,
    fontWeight: '700'
  }
});
