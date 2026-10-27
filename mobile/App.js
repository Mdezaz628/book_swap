import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from './src/constants/theme';
import HomeScreen from './src/screens/HomeScreen';
import BrowseScreen from './src/screens/BrowseScreen';
import SellScreen from './src/screens/SellScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BookDetailModal from './src/components/BookDetailModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedBook, setSelectedBook] = useState(null);
  const [activeChatBook, setActiveChatBook] = useState(null);

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
      case 'home':
        return (
          <HomeScreen
            onSelectBook={handleOpenBook}
            onNavigateSell={() => setCurrentTab('sell')}
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
            activeBook={activeChatBook}
            onClearActiveBook={() => setActiveChatBook(null)}
          />
        );
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen onSelectBook={handleOpenBook} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Main Screen Container */}
      <View style={styles.screenContainer}>{renderScreen()}</View>

      {/* Book Details Modal */}
      <BookDetailModal
        book={selectedBook}
        visible={!!selectedBook}
        onClose={handleCloseBook}
        onOpenChat={handleOpenChat}
      />

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('home')}
        >
          <Ionicons
            name={currentTab === 'home' ? 'home' : 'home-outline'}
            size={22}
            color={currentTab === 'home' ? Colors.primary : Colors.textLight}
          />
          <Text
            style={[
              styles.navLabel,
              currentTab === 'home' && styles.navLabelActive,
            ]}
          >
            Explore
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('browse')}
        >
          <Ionicons
            name={currentTab === 'browse' ? 'compass' : 'compass-outline'}
            size={22}
            color={currentTab === 'browse' ? Colors.primary : Colors.textLight}
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
          <Text style={styles.centerButtonLabel}>List</Text>
        </TouchableOpacity>

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
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  screenContainer: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    elevation: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
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
    color: Colors.textLight,
    marginTop: 3,
  },
  navLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
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
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  centerButtonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
});
