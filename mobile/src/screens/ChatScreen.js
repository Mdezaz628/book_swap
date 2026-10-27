import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii } from '../constants/theme';

export default function ChatScreen({ activeBook, onClearActiveBook }) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'Aman (Book Owner)',
      text: 'Hey! Yes, the Sapiens book is still available for swap. Do you have any design books?',
      time: '10:42 AM',
      isMe: false,
    },
    {
      id: '2',
      sender: 'You',
      text: 'Yes! I have "Don\'t Make Me Think" and "The Design of Everyday Things". Both in great condition.',
      time: '10:45 AM',
      isMe: true,
    },
    {
      id: '3',
      sender: 'Aman (Book Owner)',
      text: 'Awesome, "Design of Everyday Things" works perfectly. Can we meet near North Campus Library tomorrow?',
      time: '10:48 AM',
      isMe: false,
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      sender: 'You',
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>Direct book swaps & inquiries</Text>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Connected</Text>
        </View>
      </View>

      {/* Active book banner if coming from a book card */}
      {activeBook ? (
        <View style={styles.activeBookBanner}>
          <Ionicons name="bookmark" size={16} color={Colors.primary} />
          <Text style={styles.activeBookText} numberOfLines={1}>
            Regarding: <Text style={{ fontWeight: '700' }}>{activeBook.title}</Text>
          </Text>
          {onClearActiveBook ? (
            <TouchableOpacity onPress={onClearActiveBook}>
              <Ionicons name="close" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {/* Message List */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.isMe ? styles.myMessage : styles.theirMessage]}>
            {!item.isMe ? <Text style={styles.senderName}>{item.sender}</Text> : null}
            <Text style={[styles.messageText, item.isMe ? styles.myMessageText : styles.theirMessageText]}>
              {item.text}
            </Text>
            <Text style={[styles.timeText, item.isMe ? styles.myTimeText : styles.theirTimeText]}>
              {item.time}
            </Text>
          </View>
        )}
      />

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor={Colors.textSubtle}
          value={inputMessage}
          onChangeText={setInputMessage}
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textLight,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  activeBookBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activeBookText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: Radii.md,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 2,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: Colors.text,
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimeText: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  theirTimeText: {
    color: Colors.textSubtle,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.borderLight,
    borderRadius: Radii.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
