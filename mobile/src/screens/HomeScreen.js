import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii } from '../constants/theme';
import { ENDPOINTS } from '../constants/api';
import BookCard from '../components/BookCard';

const CATEGORIES = [
  'All',
  'Novel',
  'Fiction',
  'Academic',
  'Technology',
  'Comics',
  'Self-Help',
  'Business',
];

export default function HomeScreen({ onSelectBook, onNavigateSell, onNavigateLanding }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchBooks = async () => {
    try {
      const res = await fetch(ENDPOINTS.books);
      if (res.ok) {
        const data = await res.json();
        setBooks(Array.isArray(data) ? data : (data.books || []));
      }
    } catch (err) {
      console.warn('Error fetching books:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBooks();
  };

  const filteredBooks = books.filter((b) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      (b.category && b.category.toLowerCase().includes(selectedCategory.toLowerCase()));

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.author && b.author.toLowerCase().includes(q)) ||
      (b.writer && b.writer.toLowerCase().includes(q)) ||
      (b.location && b.location.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="book" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.brandTitle}>SwapToMe</Text>
          </View>
          <Text style={styles.brandSubtitle}>Where stories find new shelves</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={onNavigateSell}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>List Book</Text>
        </TouchableOpacity>
      </View>

      {/* 3D Showcase Banner Bar */}
      <TouchableOpacity
        style={styles.landingBanner}
        activeOpacity={0.88}
        onPress={onNavigateLanding}
      >
        <View style={styles.bannerIcon}>
          <Ionicons name="sparkles" size={16} color="#FFFFFF" />
        </View>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>3D Book Showcase & Landing Hub</Text>
          <Text style={styles.bannerSubtitle}>Tap to explore 3D models, stats, and how swapping works</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
      </TouchableOpacity>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textSubtle} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, author, or city..."
            placeholderTextColor={Colors.textSubtle}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textSubtle} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Categories Horizontal Scroll */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Book Grid */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading books from shelf...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={(item, index) => item._id || item.id || String(index)}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item }) => (
            <BookCard book={item} onPress={onSelectBook} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="library-outline" size={54} color={Colors.textSubtle} />
              <Text style={styles.emptyTitle}>No books found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search or be the first to list a book in this category!
              </Text>
              <TouchableOpacity style={styles.emptyAction} onPress={onNavigateSell}>
                <Text style={styles.emptyActionText}>+ List a Book Now</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.md,
    gap: 4,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  landingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 130, 12, 0.08)',
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 6,
    padding: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(232, 130, 12, 0.3)',
    gap: 10,
  },
  bannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  bannerSubtitle: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 1,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  categoryContainer: {
    marginBottom: 14,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 24,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.textLight,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyAction: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radii.md,
  },
  emptyActionText: {
    color: Colors.primaryDark,
    fontWeight: '700',
    fontSize: 14,
  },
});
