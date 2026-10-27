import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii } from '../constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function BookCard({ book, onPress }) {
  const imageUrl = book.imageUrl
    ? (book.imageUrl.startsWith('http') ? book.imageUrl : `https://swaptome-api.onrender.com${book.imageUrl}`)
    : 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600';

  const isSwap = !book.price || Number(book.price) === 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => onPress && onPress(book)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        {book.condition ? (
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{book.condition}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.details}>
        <Text style={styles.category} numberOfLines={1}>
          {book.category || 'General'}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          by {book.author || 'Unknown'}
        </Text>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            {isSwap ? (
              <View style={styles.swapTag}>
                <Ionicons name="repeat" size={12} color={Colors.primaryDark} />
                <Text style={styles.swapText}>Swap</Text>
              </View>
            ) : (
              <Text style={styles.price}>₹{book.price}</Text>
            )}
          </View>
          {book.location ? (
            <View style={styles.locationContainer}>
              <Ionicons name="location-sharp" size={11} color={Colors.textSubtle} />
              <Text style={styles.locationText} numberOfLines={1}>
                {book.location.split(',')[0]}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.borderLight,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  conditionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text,
    textTransform: 'uppercase',
  },
  details: {
    padding: 10,
  },
  category: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 4,
    minHeight: 36,
  },
  author: {
    fontSize: 11,
    color: Colors.textLight,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  priceContainer: {
    flexShrink: 0,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  swapTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.badgeBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    gap: 2,
  },
  swapText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    gap: 2,
    marginLeft: 4,
  },
  locationText: {
    fontSize: 10,
    color: Colors.textSubtle,
  },
});
