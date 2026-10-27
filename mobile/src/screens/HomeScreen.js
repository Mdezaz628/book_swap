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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii } from '../constants/theme';
import { ENDPOINTS } from '../constants/api';
import BookCard from '../components/BookCard';
import Book3DView from '../components/Book3DView';

const { width } = Dimensions.get('window');

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

export default function HomeScreen({ user, onSelectBook, onNavigateSell, onOpenAuth }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

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

  const heroBook = books[activeHeroIndex] || {
    title: "That's the Way We Meet",
    author: 'Sudeep Nagarkar',
    category: 'Novel',
    condition: 'Like New',
    price: 0,
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'],
  };

  // Header Component for the FlatList (3D Hero + Stats + Search + Categories)
  const renderListHeader = () => (
    <View style={styles.headerWrapper}>
      {/* 3D Background Attached Hero Banner */}
      <View style={styles.heroAttached}>
        {/* Glow circles */}
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />

        {/* Top Bar inside Hero */}
        <View style={styles.heroTopRow}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Ionicons name="book" size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.brandTitle}>SwapToMe</Text>
              <Text style={styles.brandSubtitle}>Where stories find new shelves</Text>
            </View>
          </View>

          {user ? (
            <View style={styles.userBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.userBadgeText} numberOfLines={1}>
                {user.name ? user.name.split(' ')[0] : 'Member'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.signInBtn} onPress={onOpenAuth}>
              <Ionicons name="log-in-outline" size={16} color="#FFFFFF" />
              <Text style={styles.signInBtnText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Floating Eyebrow */}
        <View style={styles.eyebrowBadge}>
          <View style={styles.eyebrowDot} />
          <Text style={styles.eyebrowText}>🇮🇳 India's #1 College Book Marketplace</Text>
        </View>

        {/* Hero Title */}
        <Text style={styles.heroHeadline}>
          Read. <Text style={styles.amberText}>Swap.</Text> Repeat.
        </Text>
        <Text style={styles.heroTagline}>
          Trade syllabus textbooks, bestsellers, and exam prep notes directly with verified students on campus.
        </Text>

        {/* Interactive 3D Book Attached to Background */}
        <View style={styles.showcaseCard}>
          <View style={styles.showcaseHeader}>
            <View style={styles.pulseDot} />
            <Text style={styles.showcaseHeaderText}>Featured 3D Book (Tap to Tilt)</Text>
          </View>

          <Book3DView
            book={heroBook}
            onPress={() => onSelectBook && onSelectBook(heroBook)}
          />

          {books.length > 1 ? (
            <View style={styles.dotsRow}>
              {books.slice(0, 5).map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dot, activeHeroIndex === idx && styles.dotActive]}
                  onPress={() => setActiveHeroIndex(idx)}
                />
              ))}
            </View>
          ) : null}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>1,200+</Text>
            <Text style={styles.statLabel}>Swapped</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>450+</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>₹0</Text>
            <Text style={styles.statLabel}>Commission</Text>
          </View>
        </View>
      </View>

      {/* Explore Shelf Section */}
      <View style={styles.feedHeader}>
        <View style={styles.feedTitleRow}>
          <Text style={styles.feedTitle}>Available on Shelf</Text>
          <Text style={styles.feedCount}>{filteredBooks.length} books</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textSubtle} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, author, or campus..."
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

        {/* Categories Chips */}
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
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#060A14" />

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
          ListHeaderComponent={renderListHeader}
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
  headerWrapper: {
    backgroundColor: '#060A14',
  },
  heroAttached: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#060A14',
    position: 'relative',
    overflow: 'hidden',
  },
  glowOrb1: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(232, 130, 12, 0.18)',
  },
  glowOrb2: {
    position: 'absolute',
    top: 80,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(59, 130, 246, 0.14)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.sm,
    gap: 6,
  },
  signInBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  userBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 10,
    gap: 6,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  eyebrowText: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '700',
  },
  heroHeadline: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 34,
    marginBottom: 6,
  },
  amberText: {
    color: Colors.primary,
  },
  heroTagline: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 14,
  },
  showcaseCard: {
    backgroundColor: '#0D1527',
    borderRadius: Radii.lg,
    paddingTop: 12,
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    marginBottom: 14,
  },
  showcaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  showcaseHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dotActive: {
    width: 14,
    backgroundColor: Colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#0D1527',
    borderRadius: Radii.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 9,
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: '60%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  feedHeader: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    marginTop: -8,
  },
  feedTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  feedCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
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
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    paddingBottom: 14,
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
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  emptyAction: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  emptyActionText: {
    color: Colors.primaryDark,
    fontWeight: '700',
    fontSize: 13,
  },
});
