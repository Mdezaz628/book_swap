import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from './src/constants/theme';
import LandingScreen from './src/screens/LandingScreen';
import HomeScreen from './src/screens/HomeScreen';
import BrowseScreen from './src/screens/BrowseScreen';
import SellScreen from './src/screens/SellScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';
import BookDetailModal from './src/components/BookDetailModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState('landing'); // 'landing' | 'explore' | 'browse' | 'sell' | 'chat' | 'profile'
  const [selectedBook, setSelectedBook] = useState(null);
  const [activeChatBook, setActiveChatBook] = useState(null);
  const [authVisible, setAuthVisible] = useState(false);

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

  const renderScreen = () => {
    switch (currentTab) {
      case 'landing':
        return (
          <LandingScreen
            onExplore={() => setCurrentTab('explore')}
            onSell={() => setCurrentTab('sell')}
            onAuth={() => setAuthVisible(true)}
            onSelectBook={handleOpenBook}
          />
        );
      case 'explore':
        return (
          <HomeScreen
            onSelectBook={handleOpenBook}
            onNavigateSell={() => setCurrentTab('sell')}
            onNavigateLanding={() => setCurrentTab('landing')}
          />
        );
      case 'browse':
        return <BrowseScreen onSelectBook={handleOpenBook} />;
      case 'sell':
        return (
          <SellScreen
            onSuccess={() => setCurrentTab('explore')}
          />
        );
      case 'chat':
        return (
          <ChatScreen
            activeBook={activeChatBook}
            onClearActiveBook={() => setActiveChatBook(null)}
          />
        );
      case 'profile':
        return <ProfileScreen onOpenAuth={() => setAuthVisible(true)} />;
      default:
        return (
          <LandingScreen
            onExplore={() => setCurrentTab('explore')}
            onSell={() => setCurrentTab('sell')}
            onAuth={() => setAuthVisible(true)}
            onSelectBook={handleOpenBook}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={currentTab === 'landing' ? 'light-content' : 'dark-content'}
        backgroundColor={currentTab === 'landing' ? '#060A14' : Colors.background}
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

      {/* Fullscreen Dedicated Login & Register Screen Modal */}
      <Modal
        visible={authVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAuthVisible(false)}
      >
        <AuthScreen
          onBack={() => setAuthVisible(false)}
          onAuthSuccess={() => setAuthVisible(false)}
        />
      </Modal>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        {/* Landing Hub */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('landing')}
        >
          <Ionicons
            name={currentTab === 'landing' ? 'sparkles' : 'sparkles-outline'}
            size={22}
            color={currentTab === 'landing' ? Colors.primary : Colors.textLight}
          />
          <Text
            style={[
              styles.navLabel,
              currentTab === 'landing' && styles.navLabelActive,
            ]}
          >
            3D Home
          </Text>
        </TouchableOpacity>

        {/* Explore Books */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('explore')}
        >
          <Ionicons
            name={currentTab === 'explore' ? 'book' : 'book-outline'}
            size={22}
            color={currentTab === 'explore' ? Colors.primary : Colors.textLight}
          />
          <Text
            style={[
              styles.navLabel,
              currentTab === 'explore' && styles.navLabelActive,
            ]}
          >
            Books
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
          <Text style={styles.centerButtonLabel}>List</Text>
        </TouchableOpacity>

        {/* Chat / Messages */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('chat')}
        >
          <Ionicons
            name={currentTab === 'chat' ? 'chatbubble' : 'chatbubble-outline'}
            size={21}
            color={currentTab === 'chat' ? Colors.primary : Colors.textLight}
          />
          <Text
            style={[
              styles.navLabel,
              currentTab === 'chat' && styles.navLabelActive,
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
            size={21}
            color={currentTab === 'profile' ? Colors.primary : Colors.textLight}
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
    height: 64,
    backgroundColor: '#0D1527',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
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
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 2,
  },
});
