import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii } from '../constants/theme';
import { ENDPOINTS } from '../constants/api';
import BookCard from '../components/BookCard';

export default function BrowseScreen({ onSelectBook }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'swap' | 'sale'
  const [conditionFilter, setConditionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'priceAsc' | 'priceDesc'

  const fetchBooks = async () => {
    try {
      const res = await fetch(ENDPOINTS.books);
      if (res.ok) {
        const data = await res.json();
        setBooks(Array.isArray(data) ? data : (data.books || []));
      }
    } catch (err) {
      console.warn('Browse books error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const filteredAndSortedBooks = books
    .filter((b) => {
      const isSwap = !b.price || Number(b.price) === 0;
      if (typeFilter === 'swap' && !isSwap) return false;
      if (typeFilter === 'sale' && isSwap) return false;

      if (conditionFilter !== 'all') {
        if (!b.condition || b.condition.toLowerCase() !== conditionFilter.toLowerCase()) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      if (sortBy === 'priceAsc') return priceA - priceB;
      if (sortBy === 'priceDesc') return priceB - priceA;
      // newest default
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse & Filter</Text>
        <Text style={styles.subtitle}>
          Showing {filteredAndSortedBooks.length} available books
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Type</Text>
        <View style={styles.tabsRow}>
          {[
            { id: 'all', label: 'All Listings' },
            { id: 'swap', label: 'Swaps Only' },
            { id: 'sale', label: 'For Sale' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, typeFilter === tab.id && styles.tabActive]}
              onPress={() => setTypeFilter(tab.id)}
            >
              <Text style={[styles.tabText, typeFilter === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.filterLabel}>Condition</Text>
        <View style={styles.tabsRow}>
          {[
            { id: 'all', label: 'Any' },
            { id: 'New', label: 'New' },
            { id: 'Like New', label: 'Like New' },
            { id: 'Good', label: 'Good' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.condTab, conditionFilter === tab.id && styles.condTabActive]}
              onPress={() => setConditionFilter(tab.id)}
            >
              <Text style={[styles.condTabText, conditionFilter === tab.id && styles.condTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sort Chips */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'newest' && styles.sortChipActive]}
            onPress={() => setSortBy('newest')}
          >
            <Text style={[styles.sortChipText, sortBy === 'newest' && styles.sortChipTextActive]}>
              Newest
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'priceAsc' && styles.sortChipActive]}
            onPress={() => setSortBy('priceAsc')}
          >
            <Text style={[styles.sortChipText, sortBy === 'priceAsc' && styles.sortChipTextActive]}>
              Price: Low → High
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'priceDesc' && styles.sortChipActive]}
            onPress={() => setSortBy('priceDesc')}
          >
            <Text style={[styles.sortChipText, sortBy === 'priceDesc' && styles.sortChipTextActive]}>
              Price: High → Low
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedBooks}
          keyExtractor={(item, index) => item._id || item.id || String(index)}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchBooks();
              }}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <BookCard book={item} onPress={onSelectBook} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="funnel-outline" size={48} color={Colors.textSubtle} />
              <Text style={styles.emptyTitle}>No matching books</Text>
              <Text style={styles.emptyText}>
                Try changing your type or condition filters to see more results.
              </Text>
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
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: Colors.card,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  condTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.card,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  condTabActive: {
    backgroundColor: Colors.badgeBg,
    borderColor: Colors.primaryDark,
  },
  condTabText: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '600',
  },
  condTabTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  sortLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '600',
  },
  sortChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    backgroundColor: Colors.borderLight,
  },
  sortChipActive: {
    backgroundColor: Colors.primaryDark,
  },
  sortChipText: {
    fontSize: 11,
    color: Colors.textLight,
  },
  sortChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
});
