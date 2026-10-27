import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii } from '../constants/theme';
import { ENDPOINTS } from '../constants/api';

export default function ProfileScreen({ onOpenAuth }) {
  const [user, setUser] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking'); // 'online' | 'offline' | 'checking'

  useEffect(() => {
    loadUser();
    checkServer();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('@swaptome_user');
      if (stored) {
        setUser(JSON.parse(stored));
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
    Alert.alert('Log Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('@swaptome_user');
          await AsyncStorage.removeItem('@swaptome_token');
          setUser(null);
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user ? (user.name || user.email || 'U')[0].toUpperCase() : '🎓'}
          </Text>
        </View>
        <Text style={styles.userName}>{user ? user.name || 'Member' : 'Guest Student'}</Text>
        <Text style={styles.userEmail}>
          {user ? user.email : 'Sign in to track your swaps, books, & chats'}
        </Text>
        {user?.college ? (
          <View style={styles.collegeBadge}>
            <Ionicons name="school" size={13} color={Colors.primary} />
            <Text style={styles.collegeBadgeText}>{user.college}</Text>
          </View>
        ) : null}

        {user ? (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={16} color="#EF4444" />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={onOpenAuth}
          >
            <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
            <Text style={styles.loginBtnText}>Sign In / Register</Text>
          </TouchableOpacity>
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
          SwapToMe connects readers in local communities and campuses. Exchange books, save money, and share the joy of reading with 3D tactile book covers and real-time student chats.
        </Text>
        <View style={styles.appMeta}>
          <Text style={styles.versionText}>Engine: React Native + Expo 58</Text>
          <Text style={styles.versionText}>Features: 3D Visualization, Live Cloud API</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 4,
    marginBottom: 12,
  },
  collegeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radii.full,
    gap: 6,
    marginBottom: 14,
  },
  collegeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radii.md,
    gap: 8,
  },
  loginBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    gap: 6,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: Radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.text,
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
    color: Colors.text,
    flex: 1,
  },
  pingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    alignSelf: 'flex-start',
    gap: 4,
  },
  pingBtnText: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  aboutText: {
    fontSize: 13,
    color: Colors.textLight,
    lineHeight: 20,
    marginBottom: 12,
  },
  appMeta: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 8,
    gap: 4,
  },
  versionText: {
    fontSize: 11,
    color: Colors.textSubtle,
  },
});
