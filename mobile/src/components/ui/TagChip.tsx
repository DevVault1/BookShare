import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme } from 'react-native';
import { getAppColors, type AppColors } from '../../theme/colors';

interface TagChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export const TagChip = ({ label, selected = false, onPress }: TagChipProps) => {
  const colors = getAppColors(useColorScheme());
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected ? styles.selected : styles.idle]}
    >
      <Text style={[styles.text, selected ? styles.selectedText : styles.idleText]}>{label}</Text>
    </Pressable>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  idle: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  idleText: {
    color: colors.secondaryForeground,
  },
  selectedText: {
    color: colors.primaryForeground,
  },
});
