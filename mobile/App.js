import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from './src/constants/theme';
import HomeScreen from './src/screens/HomeScreen';
import BrowseScreen from './src/screens/BrowseScreen';
import SellScreen from './src/screens/SellScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';
import BookDetailModal from './src/components/BookDetailModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'browse' | 'sell' | 'chat' | 'profile'
  const [user, setUser] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [activeChatBook, setActiveChatBook] = useState(null);
  const [authVisible, setAuthVisible] = useState(false);

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      const stored = await AsyncStorage.getItem('@swaptome_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Session check error', e);
    }
  };

  const handleOpenBook = (book) => {
    setSelectedBook(book);
  };

  const handleCloseBook = () => {
    setSelectedBook(null);
  };

  const handleOpenChat = (book) => {
    setActiveChatBook(book);
    setCurrentTab('chat');
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setAuthVisible(false);
  };

  const renderScreen = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomeScreen
            user={user}
            onSelectBook={handleOpenBook}
            onNavigateSell={() => setCurrentTab('sell')}
            onOpenAuth={() => setAuthVisible(true)}
          />
        );
      case 'browse':
        return <BrowseScreen onSelectBook={handleOpenBook} />;
      case 'sell':
        return (
          <SellScreen
            onSuccess={() => setCurrentTab('home')}
          />
        );
      case 'chat':
        return (
          <ChatScreen
            user={user}
            activeBook={activeChatBook}
            onClearActiveBook={() => setActiveChatBook(null)}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            user={user}
            onOpenAuth={() => setAuthVisible(true)}
            onLogout={() => setUser(null)}
          />
        );
      default:
        return (
          <HomeScreen
            user={user}
            onSelectBook={handleOpenBook}
            onNavigateSell={() => setCurrentTab('sell')}
            onOpenAuth={() => setAuthVisible(true)}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#060A14"
      />

      {/* Main Screen Content */}
      <View style={styles.screenContainer}>{renderScreen()}</View>

      {/* 3D Book Details Modal */}
      <BookDetailModal
        book={selectedBook}
        visible={!!selectedBook}
        onClose={handleCloseBook}
        onOpenChat={handleOpenChat}
      />

      {/* Dedicated Login & Register Screen Modal */}
      <Modal
        visible={authVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAuthVisible(false)}
      >
        <AuthScreen
          onBack={() => setAuthVisible(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </Modal>

      {/* Clean WhatsApp / Native Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        {/* Home (with 3D hero attached in background) */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('home')}
        >
          <Ionicons
            name={currentTab === 'home' ? 'home' : 'home-outline'}
            size={22}
            color={currentTab === 'home' ? Colors.primary : '#8696A0'}
          />
          <Text
            style={[
              styles.navLabel,
              currentTab === 'home' && styles.navLabelActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* Browse Books */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('browse')}
        >
          <Ionicons
            name={currentTab === 'browse' ? 'compass' : 'compass-outline'}
            size={22}
            color={currentTab === 'browse' ? Colors.primary : '#8696A0'}
          />
          <Text
            style={[
              styles.navLabel,
              currentTab === 'browse' && styles.navLabelActive,
            ]}
          >
            Browse
          </Text>
        </TouchableOpacity>

        {/* Sell / Swap Center Button */}
        <TouchableOpacity
          style={styles.navItemCenter}
          onPress={() => setCurrentTab('sell')}
          activeOpacity={0.85}
        >
          <View style={styles.centerButtonIcon}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.centerButtonLabel}>Sell</Text>
        </TouchableOpacity>

        {/* Chat / Messages (WhatsApp Style) */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('chat')}
        >
          <Ionicons
            name={currentTab === 'chat' ? 'chatbubbles' : 'chatbubbles-outline'}
            size={22}
            color={currentTab === 'chat' ? '#25D366' : '#8696A0'}
          />
          <Text
            style={[
              styles.navLabel,
              currentTab === 'chat' && { color: '#25D366', fontWeight: '800' },
            ]}
          >
            Chat
          </Text>
        </TouchableOpacity>

        {/* Profile / Account */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('profile')}
        >
          <Ionicons
            name={currentTab === 'profile' ? 'person' : 'person-outline'}
            size={22}
            color={currentTab === 'profile' ? Colors.primary : '#8696A0'}
          />
          <Text
            style={[
              styles.navLabel,
              currentTab === 'profile' && styles.navLabelActive,
            ]}
          >
            Account
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060A14',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  screenContainer: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 62,
    backgroundColor: '#0D1527',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8696A0',
    marginTop: 3,
  },
  navLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  navItemCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  centerButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
  },
  centerButtonLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 2,
  },
});
