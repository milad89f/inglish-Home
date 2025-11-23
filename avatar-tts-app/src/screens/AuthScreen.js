import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authAPI } from '../services/api';

export default function AuthScreen({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (isSignup) {
      // Signup validation
      if (!name.trim()) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }

      if (password !== passwordConfirmation) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }

      if (!['en', 'tr'].includes(language)) {
        Alert.alert('Error', 'Language must be "en" or "tr"');
        return;
      }
    }

    try {
      setLoading(true);
      let response;

      if (isSignup) {
        response = await authAPI.signup({
          email: email.trim().toLowerCase(),
          password,
          password_confirmation: passwordConfirmation,
          name: name.trim(),
          language,
        });
      } else {
        response = await authAPI.login(email.trim().toLowerCase(), password);
      }

      if (response.data.success) {
        const user = response.data.data.user;
        const userName = user.name || 'User';
        Alert.alert(
          'Welcome!',
          isSignup 
            ? `Welcome, ${userName}! Account created successfully!`
            : `Welcome back, ${userName}!`,
          [
            {
              text: 'OK',
              onPress: () => onLogin(user),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        (isSignup ? 'Signup failed' : 'Login failed');
      
      const errors = error.response?.data?.errors;
      if (errors) {
        const errorDetails = Object.entries(errors)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('\n');
        Alert.alert('Error', `${errorMessage}\n\n${errorDetails}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignup
                ? 'Sign up to start learning'
                : 'Login to continue learning'}
            </Text>

            {isSignup && (
              <>
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  autoCapitalize="words"
                />

                <View style={styles.languageContainer}>
                  <Text style={styles.label}>Language:</Text>
                  <View style={styles.languageButtons}>
                    <TouchableOpacity
                      style={[
                        styles.languageButton,
                        language === 'en' && styles.languageButtonActive,
                      ]}
                      onPress={() => setLanguage('en')}
                    >
                      <Text
                        style={[
                          styles.languageButtonText,
                          language === 'en' && styles.languageButtonTextActive,
                        ]}
                      >
                        🇺🇸 English
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.languageButton,
                        language === 'tr' && styles.languageButtonActive,
                      ]}
                      onPress={() => setLanguage('tr')}
                    >
                      <Text
                        style={[
                          styles.languageButtonText,
                          language === 'tr' && styles.languageButtonTextActive,
                        ]}
                      >
                        🇹🇷 Türkçe
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            <TextInput
              placeholder="Email"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            <TextInput
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />

            {isSignup && (
              <TextInput
                placeholder="Confirm Password"
                placeholderTextColor="#94a3b8"
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                secureTextEntry
                style={styles.input}
              />
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isSignup ? 'Sign Up' : 'Login'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsSignup(!isSignup)}
              style={styles.switchButton}
            >
              <Text style={styles.switchText}>
                {isSignup
                  ? 'Already have an account? Login'
                  : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#16213e',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    fontSize: 16,
  },
  languageContainer: {
    marginBottom: 15,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  languageButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  languageButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  languageButtonText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '600',
  },
  languageButtonTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#0ea5e9',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#0ea5e9',
    fontSize: 14,
  },
});

