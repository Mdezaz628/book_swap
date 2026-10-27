import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL, ENDPOINTS } from '../constants/api';
import io from 'socket.io-client';

const SAMPLE_CHATS = [
  {
    id: 'c1',
    user: 'EZAZ MD',
    avatarText: 'E',
    lastMessage: 'Awesome, can we meet near North Campus Library tomorrow?',
    time: '11:42 AM',
    unread: 2,
    online: true,
    lastSeen: 'online',
    bookTitle: "That's the Way We Meet",
    bookPrice: '201',
    bookImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'c2',
    user: 'Rahul Sharma',
    avatarText: 'R',
    lastMessage: 'I have the RS Aggarwal Maths book ready for swap.',
    time: '10:15 AM',
    unread: 0,
    online: true,
    lastSeen: 'online',
    bookTitle: 'RS Aggarwal',
    bookPrice: 'Swap',
    bookImage: 'https://res.cloudinary.com/dscjun5cc/image/upload/v1778096910/bookswap/bfaqctp8r5f86tm1nwuz.jpg',
  },
  {
    id: 'c3',
    user: 'Priya Patel',
    avatarText: 'P',
    lastMessage: 'Is "The 40 Laws" still available for sale?',
    time: 'Yesterday',
    unread: 0,
    online: false,
    lastSeen: 'yesterday at 9:30 PM',
    bookTitle: 'The 40 Laws',
    bookPrice: '150',
    bookImage: 'https://res.cloudinary.com/dscjun5cc/image/upload/v1779418557/bookswap/hgijztrzfzm3h7q7eq9p.jpg',
  },
  {
    id: 'c4',
    user: 'Aman Verma',
    avatarText: 'A',
    lastMessage: 'Deal confirmed at ₹120. See you in 10 mins!',
    time: 'Tuesday',
    unread: 0,
    online: false,
    lastSeen: 'last seen Tuesday',
    bookTitle: 'Subconscious Mind',
    bookPrice: '120',
    bookImage: 'https://res.cloudinary.com/dscjun5cc/image/upload/v1779418277/bookswap/gz5wljf1nxvuhvfyt4un.jpg',
  },
];

export default function ChatScreen({ user, activeBook, onClearActiveBook }) {
  // If activeBook passed from Book Details, jump straight into chat with that seller
  const initialSeller = activeBook?.seller || activeBook?.owner?.name || activeBook?.uploaderEmail || null;
  const [activeContact, setActiveContact] = useState(initialSeller);
  const [chatFilter, setChatFilter] = useState('all'); // 'all' | 'unread' | 'deals'

  const [conversations, setConversations] = useState(SAMPLE_CHATS);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [dealPriceInput, setDealPriceInput] = useState('');
  const [activeDeal, setActiveDeal] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const flatListRef = useRef(null);
  const socketRef = useRef(null);

  const currentUserName = user?.name || user?.email?.split('@')[0] || 'Guest Reader';
  const effectiveRecipient = activeContact || 'Community Seller';
  const roomId = [currentUserName, effectiveRecipient].sort().join('_');

  // Socket.io real-time connection
  useEffect(() => {
    const socket = io(BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinUser', currentUserName);
      if (activeContact) {
        socket.emit('joinRoom', roomId);
      }
    });

    socket.on('receiveMessage', (msg) => {
      if (msg && (msg.roomId === roomId || msg.sender === activeContact)) {
        setMessages((prev) => [
          ...prev,
          {
            id: msg._id || String(Date.now()),
            sender: msg.sender,
            text: msg.message || msg.text,
            time: new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            isMe: msg.sender === currentUserName,
            isDeal: Boolean(msg.dealPrice),
            dealPrice: msg.dealPrice,
          },
        ]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUserName, activeContact, roomId]);

  // Load message history from server
  useEffect(() => {
    if (!activeContact) return;

    setLoadingMessages(true);
    fetch(ENDPOINTS.messages(roomId))
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const loaded = data.map((m) => ({
            id: m._id || String(Math.random()),
            sender: m.sender,
            text: m.message || m.text,
            time: new Date(m.createdAt || Date.now()).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            isMe: m.sender === currentUserName,
            isDeal: Boolean(m.dealPrice),
            dealPrice: m.dealPrice,
          }));
          setMessages(loaded);
        } else {
          // Authentic initial message thread
          setMessages([
            {
              id: 'init-1',
              sender: activeContact,
              text: `Hey ${currentUserName}! Thanks for reaching out. Yes, the book is available!`,
              time: '11:30 AM',
              isMe: false,
            },
            {
              id: 'init-2',
              sender: currentUserName,
              text: 'Great! Are you open to swapping or only selling?',
              time: '11:32 AM',
              isMe: true,
            },
            {
              id: 'init-3',
              sender: activeContact,
              text: 'Open to both! If you have any CS, engineering, or novels, let me know. Otherwise ₹150 is fine.',
              time: '11:35 AM',
              isMe: false,
            },
          ]);
        }
      })
      .catch(() => {
        setMessages([
          {
            id: 'init-err',
            sender: activeContact,
            text: `Hi ${currentUserName}! Let's discuss the book swap.`,
            time: '11:30 AM',
            isMe: false,
          },
        ]);
      })
      .finally(() => setLoadingMessages(false));
  }, [activeContact, roomId, currentUserName]);

  // Fetch real inbox
  useEffect(() => {
    if (user?.name) {
      fetch(ENDPOINTS.inbox(user.name))
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map((item, idx) => ({
              id: String(idx),
              user: item.user,
              avatarText: (item.user || 'U')[0].toUpperCase(),
              lastMessage: item.lastMessage || 'Message',
              time: 'Recent',
              unread: item.unread || 0,
              online: true,
              lastSeen: 'online',
            }));
            setConversations(mapped);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const text = inputText.trim();
    const newMsg = {
      id: String(Date.now()),
      sender: currentUserName,
      receiver: effectiveRecipient,
      roomId,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('sendMessage', {
        roomId,
        sender: currentUserName,
        receiver: effectiveRecipient,
        message: text,
      });
    }

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendDeal = () => {
    if (!dealPriceInput.trim()) {
      Alert.alert('Required', 'Please enter agreed deal amount.');
      return;
    }

    const price = dealPriceInput.trim();
    setActiveDeal(price);
    setShowDealModal(false);
    setDealPriceInput('');

    const dealMsg = {
      id: String(Date.now()),
      sender: currentUserName,
      receiver: effectiveRecipient,
      roomId,
      text: `🤝 Deal Proposed: ₹${price}. Tap to confirm and generate swap QR!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      isDeal: true,
      dealPrice: price,
    };

    setMessages((prev) => [...prev, dealMsg]);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('sendMessage', {
        roomId,
        sender: currentUserName,
        receiver: effectiveRecipient,
        message: dealMsg.text,
        dealPrice: price,
      });
    }

    Alert.alert('Deal Proposed! 🤝', `Sent offer of ₹${price} to ${effectiveRecipient}.`);
  };

  const filteredConversations = conversations.filter((c) => {
    if (chatFilter === 'unread' && c.unread === 0) return false;
    if (chatFilter === 'deals' && !c.bookPrice) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.user.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q) ||
        (c.bookTitle && c.bookTitle.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // ══════════════════════════════════════════════════════════
  // VIEW 1: WHATSAPP CHATS TAB (HOME INBOX)
  // ══════════════════════════════════════════════════════════
  if (!activeContact) {
    return (
      <View style={styles.whatsappMain}>
        {/* WhatsApp Top Navigation Bar */}
        <View style={styles.waTopBar}>
          <Text style={styles.waLogoText}>WhatsApp</Text>
          <View style={styles.waTopActions}>
            <TouchableOpacity
              style={styles.waActionIcon}
              onPress={() => Alert.alert('Camera', 'Take photo for status or chat')}
            >
              <Ionicons name="camera-outline" size={22} color="#AEBAC1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.waActionIcon}
              onPress={() => setSearchVisible(!searchVisible)}
            >
              <Ionicons name="search" size={20} color="#AEBAC1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.waActionIcon}
              onPress={() =>
                Alert.alert('Options', 'SwapToMe Community WhatsApp', [
                  { text: 'Mark all read', onPress: () => {} },
                  { text: 'Settings', onPress: () => {} },
                  { text: 'Close', style: 'cancel' },
                ])
              }
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#AEBAC1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar if toggled */}
        {searchVisible ? (
          <View style={styles.searchSection}>
            <View style={styles.waSearchBar}>
              <Ionicons name="search" size={16} color="#8696A0" />
              <TextInput
                style={styles.waSearchInput}
                placeholder="Search chats, students, or books..."
                placeholderTextColor="#8696A0"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#8696A0" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* WhatsApp Filter Chips (All, Unread, Deals) */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, chatFilter === 'all' && styles.filterChipActive]}
            onPress={() => setChatFilter('all')}
          >
            <Text style={[styles.filterChipText, chatFilter === 'all' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, chatFilter === 'unread' && styles.filterChipActive]}
            onPress={() => setChatFilter('unread')}
          >
            <Text style={[styles.filterChipText, chatFilter === 'unread' && styles.filterChipTextActive]}>
              Unread
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, chatFilter === 'deals' && styles.filterChipActive]}
            onPress={() => setChatFilter('deals')}
          >
            <Text style={[styles.filterChipText, chatFilter === 'deals' && styles.filterChipTextActive]}>
              Book Deals
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chat Conversations List */}
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatListContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatRow}
              activeOpacity={0.7}
              onPress={() => setActiveContact(item.user)}
            >
              {/* WhatsApp Profile Avatar with Ring */}
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarLetter}>{item.avatarText}</Text>
                </View>
                {item.online ? <View style={styles.onlineBadgeDot} /> : null}
              </View>

              {/* Chat Text Details */}
              <View style={styles.chatRowBody}>
                <View style={styles.chatRowTop}>
                  <Text style={styles.chatContactName} numberOfLines={1}>
                    {item.user}
                  </Text>
                  <Text style={[styles.chatTimestamp, item.unread > 0 && styles.chatTimestampGreen]}>
                    {item.time}
                  </Text>
                </View>

                {/* Subtitle / Last Message */}
                <View style={styles.chatRowBottom}>
                  <View style={styles.snippetRow}>
                    {item.unread === 0 ? (
                      <Ionicons name="checkmark-done" size={16} color="#53BDEB" style={{ marginRight: 4 }} />
                    ) : null}
                    <Text style={styles.chatSnippet} numberOfLines={1}>
                      {item.lastMessage}
                    </Text>
                  </View>

                  {item.unread > 0 ? (
                    <View style={styles.unreadCounter}>
                      <Text style={styles.unreadCounterText}>{item.unread}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Book Deal Pill Tag if attached */}
                {item.bookTitle ? (
                  <View style={styles.bookTagPill}>
                    <Ionicons name="book" size={11} color="#00A884" />
                    <Text style={styles.bookTagText} numberOfLines={1}>
                      {item.bookTitle} (₹{item.bookPrice})
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
        />

        {/* WhatsApp Floating Action Button (FAB) */}
        <TouchableOpacity
          style={styles.waFab}
          activeOpacity={0.88}
          onPress={() => Alert.alert('New Chat', 'Select a student from your college or browse books to message owners.')}
        >
          <Ionicons name="chatbox" size={22} color="#0B141A" />
        </TouchableOpacity>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════
  // VIEW 2: AUTHENTIC WHATSAPP CONVERSATION THREAD
  // ══════════════════════════════════════════════════════════
  return (
    <KeyboardAvoidingView
      style={styles.threadContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── WhatsApp Thread Header Bar ── */}
      <View style={styles.waThreadHeader}>
        {/* Back Arrow & Avatar */}
        <TouchableOpacity
          style={styles.waHeaderBackRow}
          onPress={() => {
            setActiveContact(null);
            if (onClearActiveBook) onClearActiveBook();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#E9EDEF" />
          <View style={styles.threadAvatar}>
            <Text style={styles.threadAvatarText}>
              {(activeContact || 'S')[0].toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Contact Name & Status */}
        <TouchableOpacity
          style={styles.waHeaderInfo}
          onPress={() => Alert.alert(activeContact, 'Student profile and verified campus membership.')}
        >
          <Text style={styles.waHeaderName} numberOfLines={1}>
            {activeContact}
          </Text>
          <Text style={styles.waHeaderStatus}>online</Text>
        </TouchableOpacity>

        {/* WhatsApp Header Icons */}
        <View style={styles.waHeaderIcons}>
          <TouchableOpacity
            style={styles.waHeadIconBtn}
            onPress={() => Alert.alert('Video Call', 'Video call is available after agreeing to swap.')}
          >
            <Ionicons name="videocam" size={22} color="#AEBAC1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.waHeadIconBtn}
            onPress={() => Alert.alert('Voice Call', 'Voice call is available after agreeing to swap.')}
          >
            <Ionicons name="call" size={19} color="#AEBAC1" />
          </TouchableOpacity>

          {/* Deal Confirmation Button */}
          <TouchableOpacity
            style={styles.dealBadgeBtn}
            onPress={() => setShowDealModal(true)}
          >
            <Ionicons name="cash-outline" size={16} color="#00A884" />
            <Text style={styles.dealBadgeBtnText}>Deal</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Book Context Card if opened from a book */}
      {activeBook ? (
        <View style={styles.bookDealContextBar}>
          <View style={styles.bookContextLeft}>
            <Text style={styles.bookContextTitle} numberOfLines={1}>
              📖 {activeBook.title}
            </Text>
            <Text style={styles.bookContextSubtitle}>
              Condition: {activeBook.condition || 'Good'} • {activeBook.price ? `₹${activeBook.price}` : 'Available for Swap'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.makeOfferBtn}
            onPress={() => setShowDealModal(true)}
          >
            <Text style={styles.makeOfferBtnText}>Propose Deal</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── WhatsApp Wallpaper & Messages List ── */}
      <View style={styles.waWallpaper}>
        {loadingMessages ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color="#00A884" size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContainer}
            ListHeaderComponent={
              <View style={styles.headerDecoration}>
                {/* WhatsApp End-to-End Encryption Banner */}
                <View style={styles.encryptionCard}>
                  <Ionicons name="lock-closed" size={12} color="#FFD279" />
                  <Text style={styles.encryptionText}>
                    Messages are end-to-end encrypted. No one outside of this chat, not even SwapToMe, can read them.
                  </Text>
                </View>

                {/* Centered WhatsApp Date Capsule */}
                <View style={styles.dateCapsule}>
                  <Text style={styles.dateCapsuleText}>TODAY</Text>
                </View>
              </View>
            }
            renderItem={({ item }) => {
              const isMe = item.isMe;

              return (
                <View style={[styles.bubbleContainer, isMe ? styles.myBubbleRow : styles.theirBubbleRow]}>
                  <View style={[styles.bubbleBase, isMe ? styles.myBubbleBg : styles.theirBubbleBg]}>
                    {/* Deal Offer Header if message is a deal proposal */}
                    {item.isDeal ? (
                      <View style={styles.dealBubbleHeader}>
                        <Ionicons name="sparkles" size={14} color="#00A884" />
                        <Text style={styles.dealBubbleHeaderText}>Campus Deal Proposal</Text>
                      </View>
                    ) : null}

                    {/* Sender name for group/incoming */}
                    {!isMe ? <Text style={styles.incomingSenderName}>{item.sender}</Text> : null}

                    {/* Message Text */}
                    <Text style={styles.messageContentText}>{item.text}</Text>

                    {/* Meta Timestamp + Blue Double Checks */}
                    <View style={styles.messageMetaRow}>
                      <Text style={styles.metaTimestamp}>{item.time}</Text>
                      {isMe ? (
                        <Ionicons
                          name="checkmark-done"
                          size={15}
                          color="#53BDEB"
                          style={{ marginLeft: 3 }}
                        />
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>

      {/* Attachment Bottom Sheet (Photos, Deals, Location) */}
      {showAttachMenu ? (
        <View style={styles.attachSheet}>
          <TouchableOpacity
            style={styles.attachOption}
            onPress={() => {
              setShowAttachMenu(false);
              Alert.alert('Camera', 'Opening camera to capture book condition');
            }}
          >
            <View style={[styles.attachIconCircle, { backgroundColor: '#E91E63' }]}>
              <Ionicons name="camera" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.attachLabel}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.attachOption}
            onPress={() => {
              setShowAttachMenu(false);
              Alert.alert('Gallery', 'Choose book photos from gallery');
            }}
          >
            <View style={[styles.attachIconCircle, { backgroundColor: '#9C27B0' }]}>
              <Ionicons name="images" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.attachLabel}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.attachOption}
            onPress={() => {
              setShowAttachMenu(false);
              setShowDealModal(true);
            }}
          >
            <View style={[styles.attachIconCircle, { backgroundColor: '#00A884' }]}>
              <Ionicons name="cash" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.attachLabel}>Make Deal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.attachOption}
            onPress={() => {
              setShowAttachMenu(false);
              Alert.alert('Campus Meetup', 'Location set to Campus Central Library');
            }}
          >
            <View style={[styles.attachIconCircle, { backgroundColor: '#00BCD4' }]}>
              <Ionicons name="location" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.attachLabel}>Meetup Spot</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── WhatsApp Bottom Input Bar ── */}
      <View style={styles.waInputBar}>
        {/* Left Pill Container */}
        <View style={styles.waInputPill}>
          <TouchableOpacity
            style={styles.waInputIcon}
            onPress={() => Alert.alert('Emojis', 'Choose emoji')}
          >
            <Ionicons name="happy-outline" size={24} color="#8696A0" />
          </TouchableOpacity>

          <TextInput
            style={styles.waTextInput}
            placeholder="Message"
            placeholderTextColor="#8696A0"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />

          <TouchableOpacity
            style={styles.waInputIcon}
            onPress={() => setShowAttachMenu(!showAttachMenu)}
          >
            <Ionicons
              name={showAttachMenu ? 'close-circle' : 'attach'}
              size={24}
              color={showAttachMenu ? '#00A884' : '#8696A0'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.waInputIcon}
            onPress={() => setShowDealModal(true)}
          >
            <Text style={styles.rupeeIcon}>₹</Text>
          </TouchableOpacity>
        </View>

        {/* Right Circular Send / Mic Button (WhatsApp Green) */}
        <TouchableOpacity
          style={styles.waSendCircle}
          activeOpacity={0.85}
          onPress={
            inputText.trim()
              ? handleSendMessage
              : () => Alert.alert('Voice Note', 'Hold to record voice message')
          }
        >
          <Ionicons
            name={inputText.trim() ? 'send' : 'mic'}
            size={20}
            color="#FFFFFF"
            style={inputText.trim() ? { marginLeft: 2 } : {}}
          />
        </TouchableOpacity>
      </View>

      {/* ── Deal Confirmation Modal ── */}
      <Modal
        visible={showDealModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDealModal(false)}
      >
        <View style={styles.dealModalOverlay}>
          <View style={styles.dealModalCard}>
            <View style={styles.dealModalHead}>
              <View style={styles.dealHeadBadge}>
                <Ionicons name="cash" size={22} color="#00A884" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dealModalTitle}>Propose Swap / Price</Text>
                <Text style={styles.dealModalSubtitle}>
                  Both sides agree on the price before meeting on campus
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowDealModal(false)}>
                <Ionicons name="close" size={24} color="#8696A0" />
              </TouchableOpacity>
            </View>

            <View style={styles.dealPriceInputWrap}>
              <Text style={styles.dealCurrencySign}>₹</Text>
              <TextInput
                style={styles.dealPriceInput}
                placeholder="150"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={dealPriceInput}
                onChangeText={setDealPriceInput}
                autoFocus
              />
            </View>

            <View style={styles.dealQuickButtons}>
              {['0 (Free Swap)', '50', '100', '150', '200'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={styles.dealQuickChip}
                  onPress={() => setDealPriceInput(p.split(' ')[0])}
                >
                  <Text style={styles.dealQuickChipText}>₹{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.dealSubmitBtn} onPress={handleSendDeal}>
              <Text style={styles.dealSubmitBtnText}>Send Offer in Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ── 1. MAIN WHATSAPP CHATS TAB ──
  whatsappMain: {
    flex: 1,
    backgroundColor: '#0B141A',
  },
  waTopBar: {
    height: 60,
    backgroundColor: '#1F2C34',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 3,
  },
  waLogoText: {
    fontSize: 21,
    fontWeight: '700',
    color: '#E9EDEF',
    letterSpacing: -0.4,
  },
  waTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  waActionIcon: {
    padding: 4,
  },
  searchSection: {
    backgroundColor: '#1F2C34',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  waSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121B22',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  waSearchInput: {
    flex: 1,
    color: '#E9EDEF',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0B141A',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#202C33',
  },
  filterChipActive: {
    backgroundColor: 'rgba(0, 168, 132, 0.2)',
  },
  filterChipText: {
    color: '#8696A0',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#00A884',
    fontWeight: '700',
  },
  chatListContent: {
    paddingBottom: 80,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6A7175',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  onlineBadgeDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00A884',
    borderWidth: 2,
    borderColor: '#0B141A',
  },
  chatRowBody: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: '#202C33',
    paddingBottom: 12,
  },
  chatRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatContactName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E9EDEF',
  },
  chatTimestamp: {
    fontSize: 12,
    color: '#8696A0',
  },
  chatTimestampGreen: {
    color: '#00A884',
    fontWeight: '700',
  },
  chatRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  chatSnippet: {
    fontSize: 14,
    color: '#8696A0',
    flex: 1,
  },
  unreadCounter: {
    backgroundColor: '#00A884',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadCounterText: {
    color: '#0B141A',
    fontSize: 11,
    fontWeight: '800',
  },
  bookTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 168, 132, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
    gap: 4,
  },
  bookTagText: {
    color: '#00A884',
    fontSize: 11,
    fontWeight: '600',
  },
  waFab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00A884',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },

  // ── 2. WHATSAPP ACTIVE CONVERSATION THREAD ──
  threadContainer: {
    flex: 1,
    backgroundColor: '#0B141A',
  },
  waThreadHeader: {
    height: 60,
    backgroundColor: '#1F2C34',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#202C33',
  },
  waHeaderBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 6,
  },
  threadAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6A7175',
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  waHeaderInfo: {
    flex: 1,
    marginLeft: 6,
  },
  waHeaderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E9EDEF',
  },
  waHeaderStatus: {
    fontSize: 11,
    color: '#8696A0',
    marginTop: 1,
  },
  waHeaderIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waHeadIconBtn: {
    padding: 6,
  },
  dealBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 168, 132, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#00A884',
    gap: 4,
  },
  dealBadgeBtnText: {
    color: '#00A884',
    fontSize: 12,
    fontWeight: '700',
  },
  bookDealContextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#182229',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#202C33',
  },
  bookContextLeft: {
    flex: 1,
    marginRight: 10,
  },
  bookContextTitle: {
    color: '#E9EDEF',
    fontSize: 13,
    fontWeight: '700',
  },
  bookContextSubtitle: {
    color: '#8696A0',
    fontSize: 11,
    marginTop: 2,
  },
  makeOfferBtn: {
    backgroundColor: '#00A884',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  makeOfferBtnText: {
    color: '#0B141A',
    fontWeight: '800',
    fontSize: 11,
  },
  waWallpaper: {
    flex: 1,
    backgroundColor: '#0B141A', // WhatsApp dark wallpaper color
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  headerDecoration: {
    alignItems: 'center',
    marginBottom: 12,
  },
  encryptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#182229',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    maxWidth: '92%',
    marginBottom: 12,
  },
  encryptionText: {
    color: '#FFD279',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    flex: 1,
  },
  dateCapsule: {
    backgroundColor: '#182229',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateCapsuleText: {
    color: '#8696A0',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bubbleContainer: {
    marginVertical: 3,
    flexDirection: 'row',
  },
  myBubbleRow: {
    justifyContent: 'flex-end',
  },
  theirBubbleRow: {
    justifyContent: 'flex-start',
  },
  bubbleBase: {
    maxWidth: '82%',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    elevation: 1,
  },
  myBubbleBg: {
    backgroundColor: '#005C4B', // Authentic WhatsApp Green
    borderTopRightRadius: 0,
  },
  theirBubbleBg: {
    backgroundColor: '#202C33', // Authentic WhatsApp Dark
    borderTopLeftRadius: 0,
  },
  dealBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 168, 132, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 6,
    marginBottom: 6,
  },
  dealBubbleHeaderText: {
    color: '#00A884',
    fontSize: 11,
    fontWeight: '800',
  },
  incomingSenderName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#53BDEB',
    marginBottom: 2,
  },
  messageContentText: {
    fontSize: 15,
    color: '#E9EDEF',
    lineHeight: 20,
  },
  messageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
  },
  metaTimestamp: {
    fontSize: 10,
    color: 'rgba(233, 237, 239, 0.6)',
  },

  // ── 3. WHATSAPP BOTTOM INPUT BAR ──
  waInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: '#1F2C34',
    gap: 6,
  },
  waInputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A3942',
    borderRadius: 24,
    paddingHorizontal: 8,
    minHeight: 46,
  },
  waInputIcon: {
    padding: 6,
  },
  rupeeIcon: {
    color: '#00A884',
    fontSize: 18,
    fontWeight: '900',
    paddingHorizontal: 4,
  },
  waTextInput: {
    flex: 1,
    color: '#E9EDEF',
    fontSize: 16,
    maxHeight: 110,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  waSendCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#00A884',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  attachSheet: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1F2C34',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#2A3942',
  },
  attachOption: {
    alignItems: 'center',
    gap: 6,
  },
  attachIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachLabel: {
    color: '#AEBAC1',
    fontSize: 11,
    fontWeight: '600',
  },

  // ── 4. DEAL MODAL ──
  dealModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  dealModalCard: {
    backgroundColor: '#1F2C34',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A3942',
    gap: 14,
  },
  dealModalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dealHeadBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 168, 132, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealModalTitle: {
    color: '#E9EDEF',
    fontSize: 16,
    fontWeight: '800',
  },
  dealModalSubtitle: {
    color: '#8696A0',
    fontSize: 11,
    marginTop: 2,
  },
  dealPriceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121B22',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#00A884',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  dealCurrencySign: {
    color: '#00A884',
    fontSize: 24,
    fontWeight: '800',
    marginRight: 8,
  },
  dealPriceInput: {
    flex: 1,
    color: '#E9EDEF',
    fontSize: 24,
    fontWeight: '800',
    paddingVertical: 8,
  },
  dealQuickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dealQuickChip: {
    backgroundColor: '#2A3942',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dealQuickChipText: {
    color: '#E9EDEF',
    fontSize: 12,
    fontWeight: '600',
  },
  dealSubmitBtn: {
    backgroundColor: '#00A884',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  dealSubmitBtnText: {
    color: '#0B141A',
    fontWeight: '800',
    fontSize: 15,
  },
});
