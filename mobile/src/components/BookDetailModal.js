import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii } from '../constants/theme';
import { ENDPOINTS } from '../constants/api';

export default function BookDetailModal({ book, visible, onClose, onOpenChat }) {
  const [inquiryText, setInquiryText] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);

  if (!book) return null;

  const imageUrl = book.imageUrl
    ? (book.imageUrl.startsWith('http') ? book.imageUrl : `https://swaptome-api.onrender.com${book.imageUrl}`)
    : 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600';

  const isSwap = !book.price || Number(book.price) === 0;

  const handleSendInquiry = async () => {
    if (!senderEmail.trim()) {
      Alert.alert('Required', 'Please enter your email so the owner can reply to you.');
      return;
    }
    if (!inquiryText.trim()) {
      Alert.alert('Required', 'Please enter your message.');
      return;
    }

    try {
      setSending(true);
      const res = await fetch(ENDPOINTS.contact, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: book.title,
          sellerEmail: book.owner?.email || book.ownerEmail || 'contact@swaptome.com',
          senderEmail: senderEmail.trim(),
          message: inquiryText.trim(),
        }),
      });

      if (res.ok) {
        Alert.alert('Success 🎉', `Your message about "${book.title}" was sent to the owner!`);
        setInquiryText('');
        setShowInquiryForm(false);
      } else {
        const data = await res.json().catch(() => ({}));
        Alert.alert('Notice', data.message || 'Inquiry sent directly to system.');
        setShowInquiryForm(false);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not send message. Please check internet connection.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {book.title}
          </Text>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => Alert.alert('Share', `Sharing "${book.title}"`)}
          >
            <Ionicons name="share-social-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Cover Hero */}
          <View style={styles.heroContainer}>
            <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroBadges}>
              {book.condition ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{book.condition}</Text>
                </View>
              ) : null}
              <View style={[styles.badge, { backgroundColor: isSwap ? Colors.badgeBg : '#E0F2FE' }]}>
                <Text style={[styles.badgeText, { color: isSwap ? Colors.primaryDark : '#0284C7' }]}>
                  {isSwap ? 'SWAP ONLY' : `FOR SALE ₹${book.price}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Book Info */}
          <View style={styles.infoCard}>
            <Text style={styles.category}>{book.category || 'General'}</Text>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>by {book.author || 'Unknown'}</Text>

            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>{isSwap ? 'Listing Type' : 'Price'}</Text>
                <Text style={styles.priceValue}>{isSwap ? 'Available for Swap' : `₹${book.price}`}</Text>
              </View>
              {book.swapFor ? (
                <View style={styles.wishlistContainer}>
                  <Ionicons name="swap-horizontal" size={16} color={Colors.primary} />
                  <Text style={styles.wishlistText}>Wants: {book.swapFor}</Text>
                </View>
              ) : null}
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>
                {book.description || 'No description provided by the owner. You can contact them below for more details.'}
              </Text>
            </View>

            {/* Owner & Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Owner & Location</Text>
              <View style={styles.ownerRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(book.owner?.name || book.owner || 'U')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.ownerDetails}>
                  <Text style={styles.ownerName}>{book.owner?.name || book.owner || 'Community Member'}</Text>
                  <Text style={styles.ownerLocation}>
                    📍 {book.location || 'Local Campus / Community'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Inquiry Form */}
            {showInquiryForm ? (
              <View style={styles.inquiryBox}>
                <Text style={styles.inquiryTitle}>Send message to owner</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your Email"
                  placeholderTextColor={Colors.textSubtle}
                  keyboardType="email-address"
                  value={senderEmail}
                  onChangeText={setSenderEmail}
                  autoCapitalize="none"
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder={`Hi, I'm interested in "${book.title}"...`}
                  placeholderTextColor={Colors.textSubtle}
                  multiline
                  numberOfLines={4}
                  value={inquiryText}
                  onChangeText={setInquiryText}
                />
                <View style={styles.inquiryActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn]}
                    onPress={() => setShowInquiryForm(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.submitBtn]}
                    onPress={handleSendInquiry}
                    disabled={sending}
                  >
                    {sending ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.submitBtnText}>Send Message</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* Bottom Floating Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => {
              onClose();
              if (onOpenChat) onOpenChat(book);
            }}
          >
            <Ionicons name="chatbubbles-outline" size={20} color={Colors.primary} />
            <Text style={styles.chatButtonText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowInquiryForm(true)}
          >
            <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>
              {isSwap ? 'Propose Swap' : 'Contact Seller'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingTop: 8,
  },
  closeBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginHorizontal: 12,
  },
  shareBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroContainer: {
    width: '100%',
    height: 320,
    backgroundColor: '#000',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.95,
  },
  heroBadges: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.text,
    textTransform: 'uppercase',
  },
  infoCard: {
    padding: 20,
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 28,
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: Radii.md,
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 11,
    color: Colors.textLight,
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  wishlistContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '50%',
  },
  wishlistText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 22,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.borderLight,
    padding: 12,
    borderRadius: Radii.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  ownerLocation: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  inquiryBox: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 10,
  },
  inquiryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.sm,
    padding: 10,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 10,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inquiryActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: Colors.borderLight,
  },
  cancelBtnText: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: Colors.primary,
  },
  submitBtnText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    gap: 12,
    elevation: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    gap: 8,
  },
  chatButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.md,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
