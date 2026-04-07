import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type ModalTone = 'default' | 'danger' | 'info';
type ModalActionRole = 'primary' | 'cancel' | 'destructive';

interface ModalAction {
  label: string;
  role?: ModalActionRole;
  onPress?: () => void;
}

interface InternalModalAction {
  label: string;
  role: ModalActionRole;
  onPress?: () => void;
}

interface ShowModalOptions {
  title: string;
  message: string;
  tone?: ModalTone;
  dismissible?: boolean;
  actions: ModalAction[];
  onDismiss?: () => void;
}

interface InternalModalState {
  title: string;
  message: string;
  tone: ModalTone;
  dismissible: boolean;
  actions: InternalModalAction[];
  onDismiss?: () => void;
}

interface ConfirmModalOptions {
  title: string;
  message: string;
  tone?: ModalTone;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface AlertModalOptions {
  title: string;
  message: string;
  tone?: ModalTone;
  acknowledgeLabel?: string;
}

interface AppModalContextValue {
  showModal: (options: ShowModalOptions) => void;
  hideModal: () => void;
  showAlert: (options: AlertModalOptions) => Promise<void>;
  showConfirm: (options: ConfirmModalOptions) => Promise<boolean>;
}

const AppModalContext = createContext<AppModalContextValue | undefined>(undefined);

interface AppModalProviderProps {
  children: React.ReactNode;
}

function toInternalActions(actions: ModalAction[]): InternalModalAction[] {
  if (actions.length === 0) {
    return [{ label: 'Close', role: 'cancel' }];
  }

  return actions.map((action, index) => ({
    label: action.label,
    role: action.role ?? (index === actions.length - 1 ? 'primary' : 'cancel'),
    onPress: action.onPress
  }));
}

export function AppModalProvider({ children }: AppModalProviderProps): React.JSX.Element {
  const [modalState, setModalState] = useState<InternalModalState | undefined>();

  const hideModal = useCallback((): void => {
    setModalState((current) => {
      current?.onDismiss?.();
      return undefined;
    });
  }, []);

  const showModal = useCallback((options: ShowModalOptions): void => {
    setModalState((current) => {
      current?.onDismiss?.();
      return {
        title: options.title,
        message: options.message,
        tone: options.tone ?? 'default',
        dismissible: options.dismissible ?? true,
        actions: toInternalActions(options.actions),
        onDismiss: options.onDismiss
      };
    });
  }, []);

  const showAlert = useCallback(
    (options: AlertModalOptions): Promise<void> =>
      new Promise((resolve) => {
        showModal({
          title: options.title,
          message: options.message,
          tone: options.tone ?? 'default',
          dismissible: true,
          actions: [
            {
              label: options.acknowledgeLabel ?? 'OK',
              role: 'primary',
              onPress: resolve
            }
          ],
          onDismiss: resolve
        });
      }),
    [showModal]
  );

  const showConfirm = useCallback(
    (options: ConfirmModalOptions): Promise<boolean> =>
      new Promise((resolve) => {
        showModal({
          title: options.title,
          message: options.message,
          tone: options.tone ?? 'danger',
          dismissible: true,
          actions: [
            {
              label: options.cancelLabel ?? 'Cancel',
              role: 'cancel',
              onPress: () => resolve(false)
            },
            {
              label: options.confirmLabel ?? 'Confirm',
              role: options.tone === 'info' ? 'primary' : 'destructive',
              onPress: () => resolve(true)
            }
          ],
          onDismiss: () => resolve(false)
        });
      }),
    [showModal]
  );

  const handleActionPress = useCallback((action: InternalModalAction): void => {
    setModalState(undefined);
    action.onPress?.();
  }, []);

  const contextValue = useMemo<AppModalContextValue>(
    () => ({
      showModal,
      hideModal,
      showAlert,
      showConfirm
    }),
    [showModal, hideModal, showAlert, showConfirm]
  );

  return (
    <AppModalContext.Provider value={contextValue}>
      {children}

      <Modal
        visible={Boolean(modalState)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (modalState?.dismissible) {
            hideModal();
          }
        }}
      >
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => {
              if (modalState?.dismissible) {
                hideModal();
              }
            }}
          />

          <View style={styles.modalCard}>
            <View
              style={[
                styles.toneBar,
                modalState?.tone === 'danger' && styles.toneBarDanger,
                modalState?.tone === 'info' && styles.toneBarInfo
              ]}
            />
            <Text style={styles.modalTitle}>{modalState?.title}</Text>
            <Text style={styles.modalMessage}>{modalState?.message}</Text>

            <View style={styles.actionsRow}>
              {modalState?.actions.map((action) => (
                <Pressable
                  key={`${action.role}-${action.label}`}
                  style={[
                    styles.actionButton,
                    action.role === 'primary' && styles.actionButtonPrimary,
                    action.role === 'destructive' && styles.actionButtonDestructive
                  ]}
                  onPress={() => handleActionPress(action)}
                >
                  <Text
                    style={[
                      styles.actionLabel,
                      action.role === 'primary' && styles.actionLabelPrimary,
                      action.role === 'destructive' && styles.actionLabelDestructive
                    ]}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </AppModalContext.Provider>
  );
}

export function useAppModal(): AppModalContextValue {
  const context = useContext(AppModalContext);

  if (!context) {
    throw new Error('useAppModal must be used within AppModalProvider.');
  }

  return context;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.42)'
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8
  },
  toneBar: {
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#8bc34a',
    alignSelf: 'center',
    marginBottom: 2
  },
  toneBarDanger: {
    backgroundColor: '#dc2626'
  },
  toneBarInfo: {
    backgroundColor: '#0284c7'
  },
  modalTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center'
  },
  modalMessage: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center'
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 13,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10
  },
  actionButtonPrimary: {
    backgroundColor: '#8bc34a'
  },
  actionButtonDestructive: {
    backgroundColor: '#fee2e2'
  },
  actionLabel: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700'
  },
  actionLabelPrimary: {
    color: '#111827'
  },
  actionLabelDestructive: {
    color: '#991b1b'
  }
});
