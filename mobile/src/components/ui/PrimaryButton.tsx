import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  ViewStyle,
} from 'react-native';
import { getAppColors, type AppColors } from '../../theme/colors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  style?: ViewStyle;
}

export const PrimaryButton = ({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
}: PrimaryButtonProps) => {
  const isDisabled = disabled || loading;
  const colors = getAppColors(useColorScheme());
  const styles = useMemo(() => createStyles(colors), [colors]);

  const spinnerColor = variant === 'primary'
    ? colors.primaryForeground
    : variant === 'danger'
      ? colors.destructiveForeground
      : colors.secondaryForeground;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      )}
    </Pressable>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  base: {
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.destructive,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  primaryLabel: {
    color: colors.primaryForeground,
  },
  secondaryLabel: {
    color: colors.secondaryForeground,
  },
  ghostLabel: {
    color: colors.secondaryForeground,
  },
  dangerLabel: {
    color: colors.destructiveForeground,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.6,
  },
});
