import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Platform, DevSettings } from 'react-native';
import { useAppTheme, AppTheme } from '@/src/theme/ThemeContext';
import { logger } from '@/src/utils/logger';
import { ActionButton } from '../inputs/ActionButton';

interface Props {
  children: ReactNode;
  theme: AppTheme;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Uncaught error in ErrorBoundary:', error);
  }

  private handleReload = () => {
    if (Platform.OS === 'web') {
      window.location.reload();
    } else {
      if (DevSettings && typeof DevSettings.reload === 'function') {
        DevSettings.reload();
      } else {
        this.setState({ hasError: false, error: null });
      }
    }
  };

  public render() {
    if (this.state.hasError) {
      const { theme } = this.props;
      const styles = createStyles(theme);
      const colors = theme.Colors;
      const typography = theme.Typography;
      const rounded = theme.Rounded;

      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.card, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant, borderRadius: rounded.xl }]}>
            <Text style={[styles.title, { ...typography.headlineLg, color: colors.error }]}>
              Oops! Something went wrong
            </Text>
            <Text style={[styles.message, { ...typography.bodyMd, color: colors.onSurfaceVariant }]}>
              An unexpected rendering error occurred. The application team has been notified.
            </Text>
            {this.state.error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.surfaceContainerHighest, borderRadius: rounded.md }]}>
                <Text numberOfLines={6} style={[styles.errorText, { color: colors.error }]}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}
            <ActionButton
              title="Reload App"
              onPress={this.handleReload}
              variant="primary"
              style={styles.button}
            />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.Spacing.lg,
  },
  card: {
    padding: theme.Spacing.lg,
    borderWidth: 1,
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    shadowColor: theme.Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    width: '100%',
    padding: 12,
    marginBottom: theme.Spacing.lg,
  },
  errorText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: theme.Typography.bodySmall.fontSize,
  },
  button: {
    width: '100%',
  },
});

export default function ErrorBoundary({ children }: { children: ReactNode }) {
  const { theme } = useAppTheme();
  return <ErrorBoundaryClass theme={theme}>{children}</ErrorBoundaryClass>;
}
