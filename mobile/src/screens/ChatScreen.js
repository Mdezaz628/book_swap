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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii } from '../constants/theme';
import { BASE_URL, ENDPOINTS } from '../constants/api';
import io from 'socket.io-client';

const SAMPLE_CONVERSATIONS = [
  {
    id: '1',
    user: 'EZAZ MD',
    avatar: 'E',
    lastMessage: 'Awesome, can we meet near North Campus Library tomorrow?',
    time: '10:48 AM',
    unread: 1,
    online: true,
  },
  {
    id: '2',
    user: 'Rahul Sharma',
    avatar: 'R',
    lastMessage: 'I have the RS Aggarwal book ready for swap.',
    time: 'Yesterday',
    unread: 0,
    online: true,
  },
  {
    id: '3',
    user: 'Priya Patel',
    avatar: 'P',
    lastMessage: 'Is "The 40 Laws" still available for sale?',
    time: 'Oct 25',
    unread: 0,
    online: false,
  },
];

export default function ChatScreen({ user, activeBook, onClearActiveBook }) {
  // If activeBook passed, auto-select seller
  const initialSeller = activeBook?.seller || activeBook?.owner?.name || activeBook?.uploaderEmail || null;
  const [selectedContact, setSelectedContact] = useState(initialSeller);
  const [conversations, setConversations] = useState(SAMPLE_CONVERSATIONS);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [dealPrice, setDealPrice] = useState('');
  const [showDealBox, setShowDealBox] = useState(false);
  const [confirmedPrice, setConfirmedPrice] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('Spam');
  const [reportDetails, setReportDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const flatListRef = useRef(null);
  const socketRef = useRef(null);

  const currentUserName = user?.name || user?.email?.split('@')[0] || 'Guest Reader';
  const effectiveRecipient = selectedContact || 'Community Seller';
  const roomId = [currentUserName, effectiveRecipient].sort().join('_');

  // Initialize socket connection
  useEffect(() => {
    const socket = io(BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinUser', currentUserName);
      if (selectedContact) {
        socket.emit('joinRoom', roomId);
      }
    });

    socket.on('receiveMessage', (msg) => {
      if (msg && (msg.roomId === roomId || msg.sender === selectedContact)) {
        setMessages((prev) => [
          ...prev,
          {
            id: msg._id || String(Date.now()),
            sender: msg.sender,
            text: msg.message || msg.text,
            time: new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: msg.sender === currentUserName,
            dealPrice: msg.dealPrice,
          },
        ]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUserName, selectedContact, roomId]);

  // Load conversation messages from server
  useEffect(() => {
    if (!selectedContact) return;

    setLoading(true);
    fetch(ENDPOINTS.messages(roomId))
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((m) => ({
            id: m._id || String(Math.random()),
            sender: m.sender,
            text: m.message || m.text,
            time: new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: m.sender === currentUserName,
            dealPrice: m.dealPrice,
          }));
          setMessages(formatted);
        } else {
          // Default greeting
          setMessages([
            {
              id: 'init-1',
              sender: selectedContact,
              text: `Hey! I'm ${selectedContact}. How can I help you with the books?`,
              time: '10:00 AM',
              isMe: false,
            },
          ]);
        }
      })
      .catch(() => {
        setMessages([
          {
            id: 'init-fallback',
            sender: selectedContact,
            text: `Hi! Are you interested in swapping or buying?`,
            time: '10:00 AM',
            isMe: false,
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, [selectedContact, roomId, currentUserName]);

  // Fetch real inbox list
  useEffect(() => {
    if (user?.name) {
      fetch(ENDPOINTS.inbox(user.name))
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map((item, idx) => ({
              id: String(idx),
              user: item.user,
              avatar: (item.user || 'U')[0].toUpperCase(),
              lastMessage: item.lastMessage || 'Sent a message',
              time: 'Recent',
              unread: item.unread || 0,
              online: true,
            }));
            setConversations(mapped);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    const newMsg = {
      id: String(Date.now()),
      sender: currentUserName,
      receiver: effectiveRecipient,
      roomId,
      text: messageText,
      message: messageText,
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
        message: messageText,
      });
    }

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleConfirmPrice = () => {
    if (!dealPrice.trim()) {
      Alert.alert('Required', 'Please enter agreed deal amount.');
      return;
    }
    setConfirmedPrice(dealPrice.trim());
    setShowDealBox(false);

    const dealMsg = {
      id: String(Date.now()),
      sender: currentUserName,
      receiver: effectiveRecipient,
      roomId,
      text: `🤝 Deal price proposed: ₹${dealPrice.trim()}. Ready for campus hand-off!`,
      message: `🤝 Deal price proposed: ₹${dealPrice.trim()}. Ready for campus hand-off!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      isDeal: true,
    };
    setMessages((prev) => [...prev, dealMsg]);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('sendMessage', {
        roomId,
        sender: currentUserName,
        receiver: effectiveRecipient,
        message: dealMsg.text,
      });
    }

    Alert.alert('Deal Proposed! 🤝', `Price confirmed at ₹${dealPrice.trim()}.`);
  };

  const handleSendReport = () => {
    if (!reportDetails.trim()) {
      Alert.alert('Required', 'Please provide issue details.');
      return;
    }
    Alert.alert('Report Submitted ✅', 'Our moderators will review this chat thread within 24 hours.');
    setReportModalVisible(false);
    setReportDetails('');
  };

  // ══════════════════════════════════════════
  // VIEW 1: WHATSAPP CHAT INBOX LIST
  // ══════════════════════════════════════════
  if (!selectedContact) {
    return (
      <View style={styles.inboxContainer}>
        {/* WhatsApp Green Top Header */}
        <View style={styles.whatsappNav}>
          <Text style={styles.whatsappNavTitle}>SwapToMe Chats</Text>
          <View style={styles.whatsappNavIcons}>
            <TouchableOpacity style={styles.navIconBtn} onPress={() => Alert.alert('Search', 'Search conversations')}>
              <Ionicons name="search" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navIconBtn} onPress={() => setReportModalVisible(true)}>
              <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* WhatsApp Chat List */}
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.inboxList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.inboxItem}
              activeOpacity={0.7}
              onPress={() => setSelectedContact(item.user)}
            >
              {/* Avatar with WhatsApp Online Dot */}
              <View style={styles.inboxAvatarContainer}>
                <View style={styles.inboxAvatar}>
                  <Text style={styles.inboxAvatarText}>{item.avatar}</Text>
                </View>
                {item.online ? <View style={styles.inboxOnlineDot} /> : null}
              </View>

              {/* Chat Info */}
              <View style={styles.inboxContent}>
                <View style={styles.inboxRowTop}>
                  <Text style={styles.inboxName}>{item.user}</Text>
                  <Text style={[styles.inboxTime, item.unread > 0 && styles.inboxTimeGreen]}>
                    {item.time}
                  </Text>
                </View>

                <View style={styles.inboxRowBottom}>
                  <Text style={styles.inboxLastMsg} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                  {item.unread > 0 ? (
                    <View style={styles.inboxBadge}>
                      <Text style={styles.inboxBadgeText}>{item.unread}</Text>
                    </View>
                  ) : (
                    <Ionicons name="checkmark-done" size={16} color="#53BDEB" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // ══════════════════════════════════════════
  // VIEW 2: WHATSAPP ACTIVE THREAD
  // ══════════════════════════════════════════
  return (
    <KeyboardAvoidingView
      style={styles.chatContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* WhatsApp Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => {
            setSelectedContact(null);
            if (onClearActiveBook) onClearActiveBook();
          }}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {(selectedContact || 'S')[0].toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerName} numberOfLines={1}>
            {selectedContact}
          </Text>
          <View style={styles.onlineStatusRow}>
            <View style={styles.statusDotGreen} />
            <Text style={styles.statusOnlineText}>online</Text>
          </View>
        </View>

        {/* Action icons */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.dealActionBtn}
            onPress={() => setShowDealBox(!showDealBox)}
          >
            <Ionicons name="qr-code-outline" size={18} color="#25D366" />
            <Text style={styles.dealActionText}>Deal</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerIconBtn} onPress={() => setReportModalVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Book Context Pill if coming from a listing */}
      {activeBook ? (
        <View style={styles.bookContextPill}>
          <Ionicons name="bookmark" size={15} color={Colors.primary} />
          <Text style={styles.bookContextText} numberOfLines={1}>
            Discussing: <Text style={{ fontWeight: '800' }}>{activeBook.title}</Text> (₹{activeBook.price || 'Swap'})
          </Text>
        </View>
      ) : null}

      {/* Deal Confirmation Box (From SwapToMe Website) */}
      {showDealBox ? (
        <View style={styles.dealConfirmCard}>
          <View style={styles.dealHeaderRow}>
            <Text style={styles.dealTitle}>🤝 Deal Price Confirmation</Text>
            <TouchableOpacity onPress={() => setShowDealBox(false)}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          <Text style={styles.dealSubtitle}>
            Confirm the price from both sides. Verification QR appears after confirmation.
          </Text>
          <View style={styles.dealInputRow}>
            <TextInput
              style={styles.dealInput}
              placeholder="Confirmed price (e.g. ₹150)"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              value={dealPrice}
              onChangeText={setDealPrice}
            />
            <TouchableOpacity style={styles.dealConfirmBtn} onPress={handleConfirmPrice}>
              <Text style={styles.dealConfirmBtnText}>Confirm Price</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* WhatsApp Chat Wallpaper & Message List */}
      <View style={styles.chatWallpaper}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#25D366" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesPadding}
            ListHeaderComponent={
              <View style={styles.dateBadgeContainer}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>TODAY</Text>
                </View>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.bubbleWrapper, item.isMe ? styles.myWrapper : styles.theirWrapper]}>
                <View style={[styles.bubble, item.isMe ? styles.myBubble : styles.theirBubble]}>
                  {!item.isMe ? (
                    <Text style={styles.bubbleSender}>{item.sender}</Text>
                  ) : null}

                  <Text style={styles.bubbleText}>{item.text}</Text>

                  {/* WhatsApp Time & Checkmarks */}
                  <View style={styles.bubbleMeta}>
                    <Text style={styles.bubbleTime}>{item.time}</Text>
                    {item.isMe ? (
                      <Ionicons name="checkmark-done" size={15} color="#53BDEB" style={{ marginLeft: 3 }} />
                    ) : null}
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* WhatsApp Input Row */}
      <View style={styles.whatsappInputBar}>
        <View style={styles.inputContainerPill}>
          <TouchableOpacity style={styles.inputIconBtn}>
            <Ionicons name="happy-outline" size={22} color="#8696A0" />
          </TouchableOpacity>

          <TextInput
            style={styles.whatsappInput}
            placeholder="Type a message..."
            placeholderTextColor="#8696A0"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />

          <TouchableOpacity
            style={styles.inputIconBtn}
            onPress={() => setShowDealBox(!showDealBox)}
          >
            <Ionicons name="attach" size={22} color="#8696A0" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.inputIconBtn}
            onPress={() => Alert.alert('Camera', 'Take photo to send')}
          >
            <Ionicons name="camera-outline" size={22} color="#8696A0" />
          </TouchableOpacity>
        </View>

        {/* Circular Send Button (WhatsApp Green) */}
        <TouchableOpacity
          style={styles.whatsappSendBtn}
          onPress={inputText.trim() ? handleSendMessage : () => Alert.alert('Voice Note', 'Hold to record voice note')}
        >
          <Ionicons
            name={inputText.trim() ? 'send' : 'mic'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* Report Chat Modal (From Website) */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.reportOverlay}>
          <View style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Report Conversation</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.reportLabel}>Reason</Text>
            <View style={styles.reasonRow}>
              {['Spam', 'Scam / Fraud', 'Harassment', 'Other'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.reasonChip, reportReason === r && styles.reasonChipActive]}
                  onPress={() => setReportReason(r)}
                >
                  <Text style={[styles.reasonChipText, reportReason === r && styles.reasonChipTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.reportLabel}>Describe the issue</Text>
            <TextInput
              style={styles.reportTextArea}
              placeholder="Provide details about the issue..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
              value={reportDetails}
              onChangeText={setReportDetails}
            />

            <TouchableOpacity style={styles.reportSubmitBtn} onPress={handleSendReport}>
              <Text style={styles.reportSubmitBtnText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ── INBOX LIST STYLES ──
  inboxContainer: {
    flex: 1,
    backgroundColor: '#0B141A',
  },
  whatsappNav: {
    height: 56,
    backgroundColor: '#1F2C34',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  whatsappNavTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E9EDEF',
    letterSpacing: -0.3,
  },
  whatsappNavIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navIconBtn: {
    padding: 4,
  },
  inboxList: {
    paddingVertical: 4,
  },
  inboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#202C33',
  },
  inboxAvatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  inboxAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6A7175',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inboxAvatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  inboxOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#25D366',
    borderWidth: 2,
    borderColor: '#0B141A',
  },
  inboxContent: {
    flex: 1,
  },
  inboxRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  inboxName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E9EDEF',
  },
  inboxTime: {
    fontSize: 12,
    color: '#8696A0',
  },
  inboxTimeGreen: {
    color: '#25D366',
    fontWeight: '700',
  },
  inboxRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inboxLastMsg: {
    fontSize: 13,
    color: '#8696A0',
    flex: 1,
    marginRight: 8,
  },
  inboxBadge: {
    backgroundColor: '#25D366',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  inboxBadgeText: {
    color: '#0B141A',
    fontSize: 11,
    fontWeight: '800',
  },

  // ── WHATSAPP THREAD STYLES ──
  chatContainer: {
    flex: 1,
    backgroundColor: '#0B141A',
  },
  chatHeader: {
    height: 60,
    backgroundColor: '#1F2C34',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#202C33',
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 6,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6A7175',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerTitleBlock: {
    flex: 1,
    marginLeft: 6,
  },
  headerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E9EDEF',
  },
  onlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  statusDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#25D366',
  },
  statusOnlineText: {
    fontSize: 11,
    color: '#25D366',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dealActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radii.sm,
    gap: 4,
  },
  dealActionText: {
    color: '#25D366',
    fontSize: 12,
    fontWeight: '700',
  },
  headerIconBtn: {
    padding: 6,
  },
  bookContextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 130, 12, 0.14)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232, 130, 12, 0.25)',
    gap: 6,
  },
  bookContextText: {
    color: '#F8FAFC',
    fontSize: 12,
    flex: 1,
  },
  dealConfirmCard: {
    backgroundColor: '#1F2C34',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3942',
    gap: 8,
  },
  dealHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dealTitle: {
    color: '#E9EDEF',
    fontSize: 13,
    fontWeight: '700',
  },
  dealSubtitle: {
    color: '#8696A0',
    fontSize: 11,
    lineHeight: 16,
  },
  dealInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  dealInput: {
    flex: 1,
    backgroundColor: '#121B22',
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#2A3942',
  },
  dealConfirmBtn: {
    backgroundColor: '#00A884',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.sm,
    justifyContent: 'center',
  },
  dealConfirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  chatWallpaper: {
    flex: 1,
    backgroundColor: '#0B141A',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesPadding: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateBadgeContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateBadge: {
    backgroundColor: '#182229',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    elevation: 1,
  },
  dateBadgeText: {
    color: '#8696A0',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bubbleWrapper: {
    marginVertical: 3,
    flexDirection: 'row',
  },
  myWrapper: {
    justifyContent: 'flex-end',
  },
  theirWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 8,
    elevation: 1,
  },
  myBubble: {
    backgroundColor: '#005C4B', // WhatsApp Sent Green
    borderTopRightRadius: 2,
  },
  theirBubble: {
    backgroundColor: '#202C33', // WhatsApp Received Dark
    borderTopLeftRadius: 2,
  },
  bubbleSender: {
    color: '#53BDEB',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  bubbleText: {
    color: '#E9EDEF',
    fontSize: 14,
    lineHeight: 19,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
  },
  bubbleTime: {
    color: '#8696A0',
    fontSize: 10,
  },
  whatsappInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#1F2C34',
    gap: 6,
  },
  inputContainerPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A3942',
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    minHeight: 44,
  },
  inputIconBtn: {
    padding: 6,
  },
  whatsappInput: {
    flex: 1,
    color: '#E9EDEF',
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 8,
  },
  whatsappSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00A884',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },

  // ── REPORT MODAL ──
  reportOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  reportCard: {
    backgroundColor: '#1F2C34',
    borderRadius: Radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A3942',
    gap: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  reportLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8696A0',
    textTransform: 'uppercase',
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: '#121B22',
    borderWidth: 1,
    borderColor: '#2A3942',
  },
  reasonChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  reasonChipText: {
    fontSize: 12,
    color: '#8696A0',
  },
  reasonChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  reportTextArea: {
    backgroundColor: '#121B22',
    borderRadius: Radii.md,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#2A3942',
    height: 80,
    textAlignVertical: 'top',
  },
  reportSubmitBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  reportSubmitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
