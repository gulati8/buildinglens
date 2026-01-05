import React, { useState, useCallback } from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { usePermissions } from './src/hooks/usePermissions';
import { PermissionsScreen, CameraScreen } from './src/screens';
import { colors } from './src/theme';

export default function App() {
  const { hasAllPermissions } = usePermissions();
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const handlePermissionsGranted = useCallback(() => {
    setPermissionsGranted(true);
  }, []);

  // Show camera screen if permissions are granted
  const shouldShowCamera = hasAllPermissions || permissionsGranted;

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={colors.neutral[900]} />
        {shouldShowCamera ? (
          <CameraScreen />
        ) : (
          <PermissionsScreen onPermissionsGranted={handlePermissionsGranted} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
