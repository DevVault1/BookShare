import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  useColorScheme,
  View,
} from 'react-native';
import { getAppColors, type AppColors } from '../../theme/colors';

interface FormInputProps extends TextInputProps {
  label: string;
  errorText?: string;
}

export const FormInput = ({ label, errorText, style, ...props }: FormInputProps) => {
  const colors = getAppColors(useColorScheme());
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, style]}
      />
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
    </View>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 6,
    color: colors.secondaryForeground,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    minHeight: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.foreground,
    backgroundColor: colors.card,
  },
  error: {
    marginTop: 5,
    color: colors.destructive,
    fontSize: 12,
  },
});
