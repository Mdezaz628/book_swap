import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii } from '../constants/theme';
import { resolveBookImage, getCategoryFallback } from '../utils/imageHelper';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function BookCard({ book, onPress }) {
  const [imageError, setImageError] = useState(false);

  const rawUrl = resolveBookImage(book);
  const imageSource = imageError ? { uri: getCategoryFallback(book?.category) } : { uri: rawUrl };

  const isSwap = !book.price || Number(book.price) === 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.86}
      onPress={() => onPress && onPress(book)}
    >
      <View style={styles.imageContainer}>
        {/* 3D Spine on the left of image */}
        <View style={styles.cardSpine} />

        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />

        {/* 3D Book Sheen Overlay */}
        <View style={styles.sheen} />

        {book.condition ? (
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{book.condition}</Text>
          </View>
        ) : null}

        {/* 3D Tag */}
        <View style={styles.cornerRibbon}>
          <Text style={styles.cornerRibbonText}>3D</Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.category} numberOfLines={1}>
          {book.category || 'General'}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          by {book.author || book.writer || 'Unknown'}
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
    borderColor: 'rgba(0, 0, 0, 0.08)',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  imageContainer: {
    width: '100%',
    height: 185,
    backgroundColor: '#1E2536',
    position: 'relative',
    flexDirection: 'row',
  },
  cardSpine: {
    width: 6,
    height: '100%',
    backgroundColor: '#0F172A',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 2,
  },
  image: {
    flex: 1,
    height: '100%',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 6,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
  },
  conditionBadge: {
    position: 'absolute',
    top: 8,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  conditionText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  cornerRibbon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(232, 130, 12, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cornerRibbonText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
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
