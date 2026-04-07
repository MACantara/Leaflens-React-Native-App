import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { deleteUserProfile, getUserProfile, updateUserProfile } from '../api/user';
import { ApiError } from '../api/client';
import { Session } from '../types/models';

interface ProfileScreenProps {
  session: Session;
  onSessionUpdated: (session: Session) => void;
  onAccountDeleted: () => void;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected error.';
}

export function ProfileScreen({ session, onSessionUpdated, onAccountDeleted }: ProfileScreenProps): React.JSX.Element {
  const [userName, setUserName] = useState(session.userName);
  const [email, setEmail] = useState(session.email);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProfile = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      const profile = await getUserProfile(session.userId, session.token);
      setUserName(profile.userName);
      setEmail(profile.email);
    } catch (profileError) {
      setError(toErrorMessage(profileError));
    } finally {
      setLoading(false);
    }
  }, [session.token, session.userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function onSave(): Promise<void> {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const updated = await updateUserProfile(session.userId, session.token, userName.trim(), email.trim());
      onSessionUpdated({
        ...session,
        userName: updated.userName,
        email: updated.email
      });
      setMessage(updated.message);
    } catch (saveError) {
      setError(toErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(): void {
    Alert.alert('Delete account', 'This action cannot be undone.', [
      {
        text: 'Cancel',
        style: 'cancel'
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void onDelete();
        }
      }
    ]);
  }

  async function onDelete(): Promise<void> {
    setDeleting(true);
    setError('');

    try {
      await deleteUserProfile(session.userId, session.token);
      onAccountDeleted();
    } catch (deleteError) {
      setError(toErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Profile</Text>

      {loading && <Text style={styles.helperText}>Loading profile...</Text>}
      {message.length > 0 && <Text style={styles.successText}>{message}</Text>}
      {error.length > 0 && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={userName}
          onChangeText={setUserName}
          placeholder="Username"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Pressable style={[styles.primaryButton, saving && styles.disabledButton]} onPress={onSave} disabled={saving || deleting}>
          <Text style={styles.primaryButtonLabel}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </Pressable>

        <Pressable style={[styles.dangerButton, deleting && styles.disabledButton]} onPress={confirmDelete} disabled={saving || deleting}>
          <Text style={styles.dangerButtonLabel}>{deleting ? 'Deleting...' : 'Delete Account'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ece1dd',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827'
  },
  helperText: {
    color: '#475569'
  },
  successText: {
    color: '#166534'
  },
  errorText: {
    color: '#b91c1c'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2
  },
  label: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '700'
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
    color: '#111827'
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: '#8bc34a',
    alignItems: 'center',
    paddingVertical: 12
  },
  primaryButtonLabel: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700'
  },
  dangerButton: {
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    paddingVertical: 12
  },
  dangerButtonLabel: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '700'
  },
  disabledButton: {
    opacity: 0.6
  }
});
