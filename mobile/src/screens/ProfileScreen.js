import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii } from '../constants/theme';
import { ENDPOINTS } from '../constants/api';

export default function ProfileScreen({ user, onOpenAuth, onLogout, onAuthSuccess }) {
  const [currentUser, setCurrentUser] = useState(user);
  const [serverStatus, setServerStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    setCurrentUser(user);
    if (!user) loadUser();
    checkServer();
  }, [user]);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('@swaptome_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Error loading user:', e);
    }
  };

  const checkServer = async () => {
    try {
      const res = await fetch(ENDPOINTS.books);
      if (res.ok) setServerStatus('online');
      else setServerStatus('offline');
    } catch (e) {
      setServerStatus('offline');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of SwapToMe?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('@swaptome_user');
          await AsyncStorage.removeItem('@swaptome_token');
          setCurrentUser(null);
          if (onLogout) onLogout();
        },
      },
    ]);
  };

  const handleGoogleSignIn = async () => {
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

        setCurrentUser(userData);
        setGoogleModalVisible(false);
        Alert.alert('Google Sign In ✅', `Welcome, ${userData.name}!`);
        if (onAuthSuccess) onAuthSuccess(userData);
      } else {
        Alert.alert('Google Auth Failed', data.message || 'Could not verify account.');
      }
    } catch (err) {
      Alert.alert('Connection Error', 'Could not reach server.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {currentUser ? (currentUser.name || currentUser.email || 'U')[0].toUpperCase() : '🎓'}
          </Text>
        </View>

        <Text style={styles.userName}>{currentUser ? currentUser.name || 'Member' : 'Student Account'}</Text>
        <Text style={styles.userEmail}>
          {currentUser
            ? currentUser.email
            : 'Sign in with Google to manage your bookshelf, chat with peers, and swap.'}
        </Text>

        {currentUser?.college ? (
          <View style={styles.collegeBadge}>
            <Ionicons name="school" size={13} color={Colors.primary} />
            <Text style={styles.collegeBadgeText}>{currentUser.college}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        {currentUser ? (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={16} color="#EF4444" />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.authButtonsStack}>
            {/* 🌟 Prominent Google Sign-In Button on Profile */}
            <TouchableOpacity
              style={styles.googleActionBtn}
              activeOpacity={0.88}
              onPress={() => setGoogleModalVisible(true)}
            >
              <View style={styles.googleIconBox}>
                <Ionicons name="logo-google" size={18} color="#EA4335" />
              </View>
              <Text style={styles.googleActionBtnText}>Sign In with Google</Text>
            </TouchableOpacity>

            {/* Email / Password Option */}
            <TouchableOpacity
              style={styles.emailActionBtn}
              activeOpacity={0.88}
              onPress={onOpenAuth}
            >
              <Ionicons name="mail-outline" size={16} color="#E2E8F0" />
              <Text style={styles.emailActionBtnText}>Sign In with Email / Password</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Books Read</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>4</Text>
          <Text style={styles.statLabel}>Swapped</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>7</Text>
          <Text style={styles.statLabel}>Wishlist</Text>
        </View>
      </View>

      {/* Backend Status Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="server-outline" size={20} color={Colors.primary} />
          <Text style={styles.cardTitle}>Backend Live Status</Text>
        </View>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  serverStatus === 'online'
                    ? '#10B981'
                    : serverStatus === 'checking'
                    ? '#F59E0B'
                    : '#EF4444',
              },
            ]}
          />
          <Text style={styles.statusText}>
            {serverStatus === 'online'
              ? 'Render Cloud API Online (swaptome-api.onrender.com)'
              : serverStatus === 'checking'
              ? 'Connecting to Render Cloud...'
              : 'Backend waking up (Render Free Tier standby)'}
          </Text>
        </View>
        <TouchableOpacity style={styles.pingBtn} onPress={checkServer}>
          <Ionicons name="refresh" size={14} color={Colors.primaryDark} />
          <Text style={styles.pingBtnText}>Check Connection</Text>
        </TouchableOpacity>
      </View>

      {/* App Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.cardTitle}>About SwapToMe Mobile</Text>
        </View>
        <Text style={styles.aboutText}>
          SwapToMe connects readers in local communities and campuses. Exchange books, save money, and share the joy of reading with WhatsApp-style student chats and 3D tactile book covers.
        </Text>
        <View style={styles.appMeta}>
          <Text style={styles.versionText}>Engine: React Native + Expo 58</Text>
          <Text style={styles.versionText}>Authentication: Google OAuth + JWT</Text>
        </View>
      </View>

      {/* Google Sign-In Quick Modal */}
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
                <Ionicons name="logo-google" size={22} color="#EA4335" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.googleModalTitle}>Sign in with Google</Text>
                <Text style={styles.googleModalSubtitle}>Enter your Google account details</Text>
              </View>
              <TouchableOpacity onPress={() => setGoogleModalVisible(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Full Name</Text>
              <TextInput
                style={styles.modalInputField}
                placeholder="e.g. Aman Gupta"
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
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
              activeOpacity={0.88}
            >
              {googleLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.googleConfirmBtnText}>Sign In with Google</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060A14',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#0D1527',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(232, 130, 12, 0.15)',
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  collegeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 130, 12, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.full,
    gap: 6,
    marginBottom: 16,
  },
  collegeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  authButtonsStack: {
    width: '100%',
    gap: 10,
  },
  googleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    gap: 10,
    elevation: 3,
  },
  googleIconBox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleActionBtnText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '800',
  },
  emailActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 8,
  },
  emailActionBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    gap: 6,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0D1527',
    padding: 16,
    borderRadius: Radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#0D1527',
    borderRadius: Radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 13,
    color: '#E2E8F0',
    flex: 1,
  },
  pingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 130, 12, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    alignSelf: 'flex-start',
    gap: 4,
  },
  pingBtnText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  aboutText: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 12,
  },
  appMeta: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
    gap: 4,
  },
  versionText: {
    fontSize: 11,
    color: '#64748B',
  },

  // Modal
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
