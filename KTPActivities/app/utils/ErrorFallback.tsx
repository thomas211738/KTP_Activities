import React from 'react';
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export default function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>
        Something went wrong
      </Text>
      <Text style={[styles.message, { color: isDark ? '#ccc' : '#444' }]}>
        {error?.message || 'An unexpected error occurred.'}
      </Text>

      <Pressable
        onPress={resetErrorBoundary}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: isDark ? '#86ebba' : '#134b91', opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={[styles.buttonText, { color: isDark ? '#000' : '#fff' }]}>
          Try again
        </Text>
      </Pressable>

      {__DEV__ && error?.stack ? (
        <Text style={[styles.stack, { color: isDark ? '#888' : '#666' }]}>
          {error.stack}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  stack: {
    marginTop: 24,
    fontSize: 12,
    textAlign: 'left',
  },
});
