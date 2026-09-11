import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';

export interface ActionButtonProps {
  title?: string;
  label?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function ActionButton({
  title,
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  iconName,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}: ActionButtonProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark, size, fullWidth), [theme, isDark, size, fullWidth]);

  const buttonText = title || label || '';
  const activeIcon = iconName || icon;

  const isInteractionDisabled = disabled || loading;
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;
  const iconColor = variant === 'primary' || variant === 'danger' ? '#ffffff' : theme.Colors.primary;

  const renderIcon = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={iconColor}
          style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
        />
      );
    }
    if (!activeIcon) return null;
    return (
      <MaterialIcons
        name={activeIcon}
        size={iconSize}
        color={iconColor}
        style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
      />
    );
  };

  const renderContent = () => (
    <View style={styles.contentRow}>
      {iconPosition === 'left' && renderIcon()}
      <Text
        style={[
          styles.text,
          variant === 'outline' && styles.textOutline,
          variant === 'secondary' && styles.textSecondary,
          variant === 'ghost' && styles.textGhost,
          variant === 'danger' && styles.textDanger,
          disabled && styles.textDisabled,
          textStyle,
        ]}
        numberOfLines={1}
      >
        {buttonText}
      </Text>
      {iconPosition === 'right' && renderIcon()}
    </View>
  );

  // Strip out backgroundColor overrides so screens cannot break global button color standard
  const sanitizedStyle = React.useMemo(() => {
    if (!style) return undefined;
    const flat = StyleSheet.flatten(style) as any;
    if (flat && (flat.backgroundColor || flat.background)) {
      const { backgroundColor, background, ...rest } = flat;
      return rest;
    }
    return style;
  }, [style]);

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isInteractionDisabled}
        activeOpacity={0.85}
        style={[
          styles.button,
          styles.primary,
          styles.primaryShadow,
          isInteractionDisabled && { opacity: 0.55 },
          sanitizedStyle,
        ]}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  const getVariantStyle = () => {
    if (disabled) return styles.disabled;
    switch (variant) {
      case 'danger':
        return styles.danger;
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return styles.outline;
      case 'ghost':
        return styles.ghost;
      default:
        return styles.outline;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isInteractionDisabled}
      activeOpacity={0.75}
      style={[styles.button, getVariantStyle(), sanitizedStyle]}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const createStyles = (theme: any, isDark: boolean, size: 'sm' | 'md' | 'lg', fullWidth: boolean) => {
  const height = size === 'sm' ? 36 : size === 'lg' ? 54 : 46;
  const paddingHorizontal = size === 'sm' ? 14 : size === 'lg' ? 26 : 20;
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;

  return StyleSheet.create({
    button: {
      height,
      borderRadius: theme.Rounded.full,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal,
      width: fullWidth ? '100%' : undefined,
    },
    primary: {
      backgroundColor: theme.Colors.primary,
    },
    primaryShadow: {
      shadowColor: theme.Colors.outline,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 1,
    },
    primaryDisabled: {
      backgroundColor: theme.Colors.outlineVariant,
    },
    secondary: {
      backgroundColor: theme.Colors.surfaceContainerLow,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.Colors.outline,
    },
    danger: {
      backgroundColor: theme.Colors.error,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    disabled: {
      backgroundColor: theme.Colors.outlineVariant,
      opacity: 0.5,
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize,
      fontWeight: '800',
      letterSpacing: 0.5,
      color: '#ffffff',
      textAlign: 'center',
    },
    textSecondary: {
      color: theme.Colors.primary,
    },
    textOutline: {
      color: theme.Colors.primary,
    },
    textGhost: {
      color: theme.Colors.primary,
    },
    textDanger: {
      color: '#ffffff',
    },
    textDisabled: {
      color: '#ffffff',
    },
    iconLeft: {
      marginRight: theme.Spacing.xs + 2,
    },
    iconRight: {
      marginLeft: theme.Spacing.xs + 2,
    },
  });
};

export default ActionButton;
