import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii } from '../constants/theme';
import { ENDPOINTS } from '../constants/api';
import Book3DView from '../components/Book3DView';

const { width } = Dimensions.get('window');

export default function LandingScreen({ onExplore, onSell, onAuth, onSelectBook }) {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [activeBookIndex, setActiveBookIndex] = useState(0);

  useEffect(() => {
    fetch(ENDPOINTS.books)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.books || [];
        if (list.length > 0) setFeaturedBooks(list.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  const heroBook = featuredBooks[activeBookIndex] || {
    title: "That's the Way We Meet",
    author: 'Sudeep Nagarkar',
    category: 'Novel',
    condition: 'Like New',
    price: 0,
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'],
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor="#060A14" />

      {/* Hero Header Area */}
      <View style={styles.heroSection}>
        {/* Glow Orb in Background */}
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />

        {/* Floating Eyebrow Badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>🇮🇳 India's #1 College Book Marketplace</Text>
        </View>

        {/* Hero Title */}
        <Text style={styles.heroTitle}>
          Read. <Text style={styles.heroTitleAmber}>Swap.</Text> Repeat.
        </Text>
        <Text style={styles.heroSubtitle}>
          Trade syllabus textbooks, bestsellers, and exam prep notes directly with verified students on campus.
        </Text>

        {/* Primary CTA Buttons */}
        <View style={styles.heroCtaRow}>
          <TouchableOpacity style={styles.primaryCta} activeOpacity={0.85} onPress={onExplore}>
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            <Text style={styles.primaryCtaText}>Explore Books</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryCta} activeOpacity={0.85} onPress={onSell}>
            <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.secondaryCtaText}>List a Book</Text>
          </TouchableOpacity>
        </View>

        {/* 3D Book Perspective Interactive Showcase */}
        <View style={styles.showcaseCard}>
          <View style={styles.showcaseHeader}>
            <View style={styles.pulseDot} />
            <Text style={styles.showcaseHeaderText}>Featured 3D Showcase (Tap to Rotate)</Text>
          </View>

          <Book3DView
            book={heroBook}
            onPress={() => onSelectBook && onSelectBook(heroBook)}
          />

          {/* Carousel dots for featured books */}
          {featuredBooks.length > 1 ? (
            <View style={styles.dotsRow}>
              {featuredBooks.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dot, activeBookIndex === idx && styles.dotActive]}
                  onPress={() => setActiveBookIndex(idx)}
                />
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {/* Platform Stats Row */}
      <View style={styles.statsSection}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>1,200+</Text>
          <Text style={styles.statLabel}>Books Swapped</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>450+</Text>
          <Text style={styles.statLabel}>Active Students</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>₹0</Text>
          <Text style={styles.statLabel}>Commission</Text>
        </View>
      </View>

      {/* Why SwapToMe Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionHeading}>Why Students Love SwapToMe</Text>
        <Text style={styles.sectionSubheading}>Simple, safe, and built for local college campuses</Text>

        <View style={styles.featureGrid}>
          <View style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: 'rgba(232, 130, 12, 0.15)' }]}>
              <Ionicons name="chatbubbles" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.featureTitle}>Direct Chat</Text>
            <Text style={styles.featureDesc}>
              Chat securely with book owners to negotiate swaps or agree on meetup spots.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="location" size={24} color="#10B981" />
            </View>
            <Text style={styles.featureTitle}>Campus Pickups</Text>
            <Text style={styles.featureDesc}>
              Zero shipping delays. Hand off books directly at your library or campus canteen.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons name="repeat" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.featureTitle}>Free Book Swaps</Text>
            <Text style={styles.featureDesc}>
              Exchange books with other students without spending money. 100% free.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Ionicons name="shield-checkmark" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.featureTitle}>Student Verified</Text>
            <Text style={styles.featureDesc}>
              Connect with fellow classmates using official college domains and genuine IDs.
            </Text>
          </View>
        </View>
      </View>

      {/* How it Works Section */}
      <View style={styles.stepsSection}>
        <Text style={styles.sectionHeading}>How It Works in 3 Steps</Text>

        <View style={styles.stepItem}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Snap & List Your Book</Text>
            <Text style={styles.stepDesc}>Take a photo of your pre-loved book, set condition, and state what you'd like in swap.</Text>
          </View>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Discover Matches Nearby</Text>
            <Text style={styles.stepDesc}>Filter by college, semester, or genre. Chat directly with the reader.</Text>
          </View>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Meet & Swap</Text>
            <Text style={styles.stepDesc}>Meet on campus to hand off the books. Share stories and pass on knowledge.</Text>
          </View>
        </View>
      </View>

      {/* Bottom Auth CTA Banner */}
      <View style={styles.bannerCard}>
        <Text style={styles.bannerTitle}>Ready to start reading?</Text>
        <Text style={styles.bannerSubtitle}>Create an account to list books, send inquiries, and chat with owners.</Text>
        <TouchableOpacity style={styles.bannerBtn} activeOpacity={0.88} onPress={onAuth}>
          <Text style={styles.bannerBtnText}>Sign In / Create Free Account</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060A14',
  },
  content: {
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  glowOrb1: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(232, 130, 12, 0.16)',
  },
  glowOrb2: {
    position: 'absolute',
    top: 100,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    marginBottom: 16,
    gap: 8,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  badgeText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: 10,
  },
  heroTitleAmber: {
    color: Colors.primary,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
    marginBottom: 20,
  },
  heroCtaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  primaryCta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radii.md,
    gap: 8,
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  secondaryCta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 14,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(232, 130, 12, 0.4)',
    gap: 8,
  },
  secondaryCtaText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  showcaseCard: {
    backgroundColor: '#0D1527',
    borderRadius: Radii.lg,
    paddingTop: 16,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
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
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dotActive: {
    width: 16,
    backgroundColor: Colors.primary,
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#0D1527',
    marginHorizontal: 20,
    borderRadius: Radii.md,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 28,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 10,
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
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubheading: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
  },
  featureGrid: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: '#0D1527',
    borderRadius: Radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  stepsSection: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#0D1527',
    padding: 14,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
    alignItems: 'center',
  },
  stepNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },
  bannerCard: {
    marginHorizontal: 20,
    backgroundColor: 'linear-gradient(135deg, #1E1B18 0%, #0D1527 100%)',
    borderRadius: Radii.lg,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 16,
  },
  bannerBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radii.md,
    gap: 8,
  },
  bannerBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
