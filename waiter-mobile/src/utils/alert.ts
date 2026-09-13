import { Alert as RNAlert, Platform } from 'react-native';

export const showAlert = (
  title: string,
  message?: string,
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>
) => {
  if (Platform.OS === 'web') {
    if (!buttons || buttons.length === 0) {
      if (typeof window !== 'undefined') {
        window.alert(title + (message ? '\n\n' + message : ''));
      }
      return;
    }

    if (buttons.length === 1) {
      if (typeof window !== 'undefined') {
        window.alert(title + (message ? '\n\n' + message : ''));
      }
      buttons[0]?.onPress?.();
      return;
    }

    // 2 or more buttons -> use browser confirmation
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(title + (message ? '\n\n' + message : ''));
      if (confirmed) {
        const actionBtn = buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];
        actionBtn?.onPress?.();
      } else {
        const cancelBtn = buttons.find((b) => b.style === 'cancel');
        cancelBtn?.onPress?.();
      }
    }
    return;
  }

  RNAlert.alert(title, message, buttons);
};
