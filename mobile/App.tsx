import React from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { getAppColors } from './src/theme/colors';

function App() {
  const colorScheme = useColorScheme();
  const colors = getAppColors(colorScheme);
  const barStyle = colorScheme === 'dark' ? 'light-content' : 'dark-content';

  return (
    <GestureHandlerRootView
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <SafeAreaProvider>
        <StatusBar barStyle={barStyle} backgroundColor={colors.background} />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
