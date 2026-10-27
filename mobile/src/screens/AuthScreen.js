import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii } from '../constants/theme';
import { ENDPOINTS } from '../constants/api';

export default function AuthScreen({ onAuthSuccess, onBack }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [college, setCollege] = useState('');
  const [location, setLocation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Google Modal state
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [googleName, setGoogleName] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleStandardAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter your email and password.');
      return;
    }

    if (tab === 'register' && !name.trim()) {
      Alert.alert('Required Fields', 'Please enter your name.');
      return;
    }

    try {
      setLoading(true);
      const url = tab === 'register' ? ENDPOINTS.register : ENDPOINTS.login;
      const payload =
        tab === 'register'
          ? {
              name: name.trim(),
              email: email.trim().toLowerCase(),
              password: password.trim(),
              college: college.trim() || 'Campus Student',
              location: location.trim() || 'India',
            }
          : {
              email: email.trim().toLowerCase(),
              password: password.trim(),
            };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && (data.user || data.token || data._id || data.name)) {
        const userData = data.user || {
          name: data.name || name.trim() || email.split('@')[0],
          email: data.email || email.trim(),
          college: college.trim(),
          location: location.trim(),
          role: data.role || 'user',
        };

        await AsyncStorage.setItem('@swaptome_user', JSON.stringify(userData));
        if (data.token) {
          await AsyncStorage.setItem('@swaptome_token', data.token);
        }

        Alert.alert('Welcome! 🎉', `Logged in as ${userData.name || userData.email}`);
        if (onAuthSuccess) onAuthSuccess(userData);
      } else {
        Alert.alert('Notice', data.message || data.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      Alert.alert('Connection Error', 'Could not reach server. Please check internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!googleEmail.trim()) {
      Alert.alert('Required', 'Please enter your Google account email.');
      return;
    }

    try {
      setGoogleLoading(true);
      const res = await fetch(ENDPOINTS.googleAuth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: googleName.trim() || googleEmail.split('@')[0],
          email: googleEmail.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      if (res.ok && (data.token || data.name)) {
        const userData = {
          name: data.name || googleName.trim() || googleEmail.split('@')[0],
          email: data.email || googleEmail.trim(),
          authProvider: 'google',
          role: data.role || 'user',
        };

        await AsyncStorage.setItem('@swaptome_user', JSON.stringify(userData));
        if (data.token) {
          await AsyncStorage.setItem('@swaptome_token', data.token);
        }

        setGoogleModalVisible(false);
        Alert.alert('Google Sign In ✅', `Welcome back, ${userData.name}!`);
        if (onAuthSuccess) onAuthSuccess(userData);
      } else {
        Alert.alert('Google Auth Failed', data.message || 'Could not verify Google account.');
      }
    } catch (err) {
      Alert.alert('Network Error', 'Could not complete Google authentication.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.topBar}>
          {onBack ? (
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Ionicons name="book" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.brandName}>SwapToMe</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>
            {tab === 'login' ? 'Welcome Back 👋' : 'Join Campus Shelf 🎓'}
          </Text>
          <Text style={styles.subtitle}>
            {tab === 'login'
              ? 'Sign in to access your chats, deals, and swap wishlist.'
              : 'Connect with verified classmates to exchange textbooks & novels.'}
          </Text>
        </View>

        {/* 🌟 Prominent Continue with Google Button */}
        <TouchableOpacity
          style={styles.googleBtn}
          activeOpacity={0.85}
          onPress={() => {
            if (email.trim().toLowerCase().includes('@')) {
              // If email already entered in the field, immediately sign in with Google
              setGoogleEmail(email.trim());
              setGoogleName(name.trim() || email.split('@')[0]);
              setGoogleModalVisible(true);
            } else {
              setGoogleModalVisible(true);
            }
          }}
        >
          <View style={styles.googleIconBox}>
            <Ionicons name="logo-google" size={20} color="#EA4335" />
          </View>
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with email & password</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
            onPress={() => setTab('login')}
          >
            <Text style={[styles.tabBtnText, tab === 'login' && styles.tabBtnTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'register' && styles.tabBtnActive]}
            onPress={() => setTab('register')}
          >
            <Text style={[styles.tabBtnText, tab === 'register' && styles.tabBtnTextActive]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {tab === 'register' ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#94A3B8" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#64748B"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#94A3B8" />
              <TextInput
                style={styles.input}
                placeholder="student@college.edu or gmail.com"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {tab === 'register' ? (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>College / University</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="school-outline" size={18} color="#94A3B8" />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. IIT, KIIT, Delhi University..."
                    placeholderTextColor="#64748B"
                    value={college}
                    onChangeText={setCollege}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Campus / City</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="location-outline" size={18} color="#94A3B8" />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. North Campus, Bhubaneswar"
                    placeholderTextColor="#64748B"
                    value={location}
                    onChangeText={setLocation}
                  />
                </View>
              </View>
            </>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#64748B"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
          </View>

          {tab === 'login' ? (
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() =>
                Alert.alert(
                  'Password Recovery',
                  'If you forgot your password, contact support at support@swaptome.com with your registered email.'
                )
              }
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          ) : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleStandardAuth}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {tab === 'login' ? 'Sign In' : 'Create Free Account'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Toggle Prompt */}
        <TouchableOpacity
          style={styles.bottomPrompt}
          onPress={() => setTab(tab === 'login' ? 'register' : 'login')}
        >
          <Text style={styles.promptText}>
            {tab === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <Text style={styles.promptAction}>
              {tab === 'login' ? 'Create Account' : 'Sign In'}
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Google OAuth Quick Sign-In Modal */}
      <Modal
        visible={googleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGoogleModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.googleModalCard}>
            <View style={styles.googleModalHeader}>
              <View style={styles.googleHeaderBadge}>
                <Ionicons name="logo-google" size={20} color="#EA4335" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.googleModalTitle}>Sign in with Google</Text>
                <Text style={styles.googleModalSubtitle}>Choose your account for SwapToMe</Text>
              </View>
              <TouchableOpacity onPress={() => setGoogleModalVisible(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Full Name</Text>
              <TextInput
                style={styles.modalInputField}
                placeholder="Your Name (e.g. Aman Gupta)"
                placeholderTextColor="#64748B"
                value={googleName}
                onChangeText={setGoogleName}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Google Email Address *</Text>
              <TextInput
                style={styles.modalInputField}
                placeholder="yourname@gmail.com"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
                value={googleEmail}
                onChangeText={setGoogleEmail}
              />
            </View>

            <TouchableOpacity
              style={styles.googleConfirmBtn}
              onPress={handleGoogleAuth}
              disabled={googleLoading}
              activeOpacity={0.88}
            >
              {googleLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.googleConfirmBtnText}>Continue as Student</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060A14',
  },
  content: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: Radii.md,
    gap: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  googleIconBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnText: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0D1527',
    borderRadius: Radii.md,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radii.sm,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  form: {
    backgroundColor: '#0D1527',
    borderRadius: Radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2536',
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#FFFFFF',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radii.md,
    alignItems: 'center',
    marginTop: 8,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  bottomPrompt: {
    marginTop: 20,
    alignItems: 'center',
  },
  promptText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  promptAction: {
    color: Colors.primary,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  googleModalCard: {
    backgroundColor: '#0D1527',
    borderRadius: Radii.lg,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 14,
  },
  googleModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  googleHeaderBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  googleModalSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  modalInputGroup: {
    gap: 4,
  },
  modalInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
    textTransform: 'uppercase',
  },
  modalInputField: {
    backgroundColor: '#1E2536',
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  googleConfirmBtn: {
    backgroundColor: '#4285F4',
    paddingVertical: 13,
    borderRadius: Radii.md,
    alignItems: 'center',
    marginTop: 6,
  },
  googleConfirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
