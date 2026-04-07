import React, { useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';
import { getAppColors, type AppColors } from '../../theme/colors';

interface AppScreenProps {
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export const AppScreen = ({
  title,
  subtitle,
  rightSlot,
  children,
  scroll = true,
  contentContainerStyle,
}: AppScreenProps) => {
  const Wrapper = scroll ? ScrollView : View;
  const colors = getAppColors(useColorScheme());
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Wrapper
          style={styles.wrapper}
          contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {(title || subtitle || rightSlot) && (
            <View style={styles.headerRow}>
              <View style={styles.titleBox}>
                {title ? <Text style={styles.title}>{title}</Text> : null}
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              {rightSlot}
            </View>
          )}
          {children}
        </Wrapper>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboard: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  headerRow: {
    marginTop: 8,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleBox: {
    flex: 1,
  },
  title: {
    color: colors.foreground,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 4,
    color: colors.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
  },
});
