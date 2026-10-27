import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii } from '../constants/theme';
import { resolveBookImage, getCategoryFallback } from '../utils/imageHelper';

const { width } = Dimensions.get('window');

export default function Book3DView({ book, onPress, style }) {
  const [imageError, setImageError] = useState(false);
  const [isTilted, setIsTilted] = useState(false);

  const rawImage = resolveBookImage(book);
  const imageSource = imageError ? { uri: getCategoryFallback(book?.category) } : { uri: rawImage };

  const isSwap = !book?.price || Number(book?.price) === 0;

  return (
    <View style={[styles.container, style]}>
      {/* 3D Book Shadow on the floor */}
      <View style={[styles.floorShadow, isTilted && styles.floorShadowActive]} />

      {/* Tangible 3D Book Model */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          setIsTilted(!isTilted);
          if (onPress) onPress(book);
        }}
        style={[styles.bookContainer, isTilted && styles.bookContainerTilted]}
      >
        {/* Book Spine (Left 3D Thickness) */}
        <View style={styles.spine}>
          <View style={styles.spineRibbon} />
          <Text style={styles.spineText} numberOfLines={1}>
            {book?.title || 'SwapToMe Book'}
          </Text>
        </View>

        {/* Book Cover Face */}
        <View style={styles.cover}>
          <Image
            source={imageSource}
            style={styles.coverImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />

          {/* Book Sheen / Gloss Overlay */}
          <View style={styles.glossOverlay} />

          {/* Left Book Joint Indentation (Physical Book Line) */}
          <View style={styles.bookJoint} />

          {/* Top Badge */}
          <View style={styles.badgeRow}>
            {book?.condition ? (
              <View style={styles.conditionBadge}>
                <Text style={styles.conditionText}>{book.condition}</Text>
              </View>
            ) : null}
            <View style={[styles.typeBadge, isSwap ? styles.swapBadge : styles.saleBadge]}>
              <Text style={[styles.typeBadgeText, isSwap ? styles.swapText : styles.saleText]}>
                {isSwap ? 'SWAP' : `₹${book.price}`}
              </Text>
            </View>
          </View>

          {/* Bottom Title Bar on Cover */}
          <View style={styles.coverFooter}>
            <Text style={styles.coverTitle} numberOfLines={1}>
              {book?.title || 'Book Title'}
            </Text>
            <Text style={styles.coverAuthor} numberOfLines={1}>
              {book?.author ? `by ${book.author}` : 'Community Book'}
            </Text>
          </View>
        </View>

        {/* Book Pages Edge (Right 3D Paper Thickness) */}
        <View style={styles.pagesEdge}>
          <View style={styles.pageLines} />
          <View style={styles.pageLines} />
          <View style={styles.pageLines} />
        </View>
      </TouchableOpacity>

      {/* Floating 3D Interaction Hint */}
      <View style={styles.hintContainer}>
        <Ionicons name="sparkles" size={12} color={Colors.primary} />
        <Text style={styles.hintText}>Tap for 3D Perspective</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  floorShadow: {
    position: 'absolute',
    bottom: 24,
    width: 210,
    height: 28,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    transform: [{ scaleX: 1.1 }, { rotateZ: '-4deg' }],
  },
  floorShadowActive: {
    width: 240,
    height: 34,
    backgroundColor: 'rgba(232, 130, 12, 0.28)',
  },
  bookContainer: {
    width: 210,
    height: 290,
    flexDirection: 'row',
    borderRadius: 8,
    transform: [
      { perspective: 900 },
      { rotateY: '-20deg' },
      { rotateX: '8deg' },
      { rotateZ: '-2deg' },
    ],
    elevation: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 14, height: 22 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  bookContainerTilted: {
    transform: [
      { perspective: 900 },
      { rotateY: '-6deg' },
      { rotateX: '3deg' },
      { scale: 1.04 },
    ],
  },
  spine: {
    width: 22,
    height: '100%',
    backgroundColor: '#1E1610',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1.5,
    borderRightColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  spineRibbon: {
    position: 'absolute',
    top: 0,
    width: 4,
    height: 24,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  spineText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    transform: [{ rotate: '-9deg' }],
  },
  cover: {
    flex: 1,
    height: '100%',
    backgroundColor: '#262A34',
    overflow: 'hidden',
    position: 'relative',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  glossOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.35)',
  },
  bookJoint: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 10,
    width: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    shadowColor: '#FFF',
    shadowOffset: { width: 1, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
  },
  badgeRow: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  conditionBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  conditionText: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  swapBadge: {
    backgroundColor: Colors.primary,
  },
  saleBadge: {
    backgroundColor: '#10B981',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  coverFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(10, 15, 29, 0.88)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  coverTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  coverAuthor: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
  },
  pagesEdge: {
    width: 14,
    height: '96%',
    alignSelf: 'center',
    backgroundColor: '#F7F5EE',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#DDD6C6',
    justifyContent: 'space-evenly',
    paddingVertical: 12,
  },
  pageLines: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    marginHorizontal: 1,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    backgroundColor: 'rgba(232, 130, 12, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(232, 130, 12, 0.3)',
  },
  hintText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
});
