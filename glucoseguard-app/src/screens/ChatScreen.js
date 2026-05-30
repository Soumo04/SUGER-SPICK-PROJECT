import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  StatusBar, Animated, Easing, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { COLORS, FONTS, GRADIENTS, SHADOWS } from '../theme';
import { chatAPI } from '../api';

const { width } = Dimensions.get('window');

const QUICK_REPLIES = [
  'How do I stop this spike?',
  "What if I can't walk?",
  'What does my heart rate mean?',
  'Is this dangerous?',
  'What foods help lower glucose?',
];

// ─────────────────────────────────────────────────────────────────────────────
// NOTEBOOK PAGE LINES — Decorative ruled lines
// ─────────────────────────────────────────────────────────────────────────────
function NotebookLines() {
  const lines = [];
  for (let i = 0; i < 22; i++) {
    lines.push(
      <View key={i} style={[styles.notebookLine, { top: 60 + i * 32 }]} />
    );
  }
  return <View style={styles.notebookLinesContainer} pointerEvents="none">{lines}</View>;
}

// ─────────────────────────────────────────────────────────────────────────────
// BOT AVATAR — Vintage doctor's emblem seal
// ─────────────────────────────────────────────────────────────────────────────
function BotAvatar() {
  return (
    <View style={styles.botAvatar}>
      <LinearGradient colors={GRADIENTS.brass} style={styles.botAvatarRing}>
        <LinearGradient colors={GRADIENTS.parchmentCard} style={styles.botAvatarInner}>
          <Text style={styles.botAvatarText}>G</Text>
        </LinearGradient>
      </LinearGradient>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPING INDICATOR — vintage Morse dot pulses
// ─────────────────────────────────────────────────────────────────────────────
function TypingIndicator() {
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];
  useEffect(() => {
    dots.forEach((dot, i) => {
      Animated.loop(Animated.sequence([
        Animated.delay(i * 200),
        Animated.timing(dot, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0.3, duration: 350, useNativeDriver: true }),
        Animated.delay(600 - i * 100),
      ])).start();
    });
  }, []);
  return (
    <View style={styles.typingRow}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={[styles.typingDot, { opacity: d }]} />
      ))}
    </View>
  );
}

export default function ChatScreen({ route, navigation }) {
  const user = route.params?.user || {};
  const glucoseState = route.params?.glucoseState || {};
  const [messages, setMessages] = useState([
    {
      id: '0', role: 'bot',
      content: `Hello ${user.name?.split(' ')[0] || 'there'}! 👋 I'm your **GlucoseGuard AI Companion**, powered by Gemini AI.\n\nI can see your current glucose status and help with personalized advice. What would you like to know?`,
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    Animated.loop(Animated.sequence([
      Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(dotAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
    ])).start();
    if (glucoseState.projected_peak > 140) {
      setTimeout(() => {
        addBotMessage(`⚠️ I noticed your projected glucose peak is **${glucoseState.projected_peak} mg/dL** (${glucoseState.risk_level}). This needs attention! Ask me: *"How do I stop this spike?"*`);
      }, 800);
    }
  }, []);

  const addBotMessage = (content) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'bot', content }]);
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');
    const userMsg = { id: Date.now().toString(), role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    const history = messages.slice(-8).map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content }));
    try {
      const data = await chatAPI.send(msg, glucoseState, glucoseState, history);
      if (data.success) { addBotMessage(data.reply); }
      else { addBotMessage("I'm having a connection issue. Please check the server is running."); }
    } catch (e) { addBotMessage("Connection error. Make sure the GlucoseGuard server is running."); }
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  };

  const renderMessage = (msg) => {
    const isBot = msg.role === 'bot';
    const parts = msg.content.split(/\*\*(.*?)\*\*/g);
    const timeStr = new Date(parseInt(msg.id) || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <View key={msg.id} style={[styles.msgRow, isBot ? styles.botRow : styles.userRow]}>
        {isBot && <BotAvatar />}
        <View style={[styles.bubble, isBot ? styles.botBubble : styles.userBubble]}>
          {/* Typewriter-style corner ear on bot bubbles */}
          {isBot && <View style={styles.botBubbleEar} />}
          {!isBot && <View style={styles.userBubbleEar} />}
          <Text style={[styles.bubbleText, isBot ? styles.botText : styles.userText]}>
            {parts.map((part, i) =>
              i % 2 === 1
                ? <Text key={i} style={[styles.boldText, { color: isBot ? COLORS.cyan : '#fffcf7' }]}>{part}</Text>
                : part
            )}
          </Text>
          <Text style={[styles.msgTime, { color: isBot ? COLORS.textMuted : 'rgba(255,253,249,0.65)' }]}>{timeStr}</Text>
        </View>
        {!isBot && (
          <LinearGradient colors={GRADIENTS.purple} style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{user.name?.[0] || 'U'}</Text>
          </LinearGradient>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" />

      {/* ─── Vintage Doctor Notebook Header ─── */}
      <LinearGradient colors={GRADIENTS.parchment} style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={17} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerAvatarRing}>
              <LinearGradient colors={GRADIENTS.brass} style={styles.headerAvatarGrad}>
                <Text style={styles.headerAvatarText}>G</Text>
              </LinearGradient>
            </View>
            <View>
              <Text style={styles.headerTitle}>GlucoseGuard AI</Text>
              <View style={styles.onlineBadge}>
                <Animated.View style={[styles.onlineDot, { opacity: dotAnim }]} />
                <Text style={styles.onlineText}>Powered by Gemini · Active</Text>
              </View>
            </View>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      {/* Bottom border of header */}
      <LinearGradient colors={GRADIENTS.brass} style={styles.headerAccentBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />

      {/* ─── Glucose context ribbon ─── */}
      {glucoseState.projected_peak && (
        <View style={[styles.contextBar, {
          borderColor: glucoseState.risk_level === 'HIGH' || glucoseState.risk_level === 'CRITICAL'
            ? COLORS.red + '44' : '#e6dbca'
        }]}>
          <Ionicons name="pulse-outline" size={12} color={COLORS.cyan} />
          <Text style={styles.contextText}>
            Peak: <Text style={{ color: COLORS.cyan, ...FONTS.bold }}>{glucoseState.projected_peak} mg/dL</Text>
            {'  '}Risk: <Text style={{ color: glucoseState.risk_level === 'HIGH' ? COLORS.orange : COLORS.emerald, ...FONTS.bold }}>{glucoseState.risk_level}</Text>
          </Text>
          <View style={[styles.contextBadge, { backgroundColor: COLORS.emerald + '18', borderColor: COLORS.emerald + '44' }]}>
            <Text style={[styles.contextBadgeText, { color: COLORS.emerald }]}>AI ACTIVE</Text>
          </View>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>

          {/* ─── Chat Area — Vintage Notebook Style ─── */}
          <View style={{ flex: 1, position: 'relative' }}>
            {/* Notebook ruling lines behind messages */}
            <NotebookLines />
            {/* Left red margin line */}
            <View style={styles.notebookMarginLine} />

            <ScrollView
              ref={scrollRef}
              style={styles.chatArea}
              contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16, paddingLeft: 36 }}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map(renderMessage)}
              {loading && (
                <View style={[styles.msgRow, styles.botRow]}>
                  <BotAvatar />
                  <View style={[styles.bubble, styles.botBubble]}>
                    <View style={styles.botBubbleEar} />
                    <TypingIndicator />
                  </View>
                </View>
              )}
            </ScrollView>
          </View>

          {/* ─── Quick Replies — Vintage Tag Chips ─── */}
          <View style={styles.quickRepliesWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 14, gap: 8, paddingVertical: 8 }}
            >
              {QUICK_REPLIES.map((q, i) => (
                <TouchableOpacity key={i} style={styles.qrChip} onPress={() => sendMessage(q)}>
                  <Ionicons name="chatbubble-ellipses-outline" size={10} color={COLORS.orange} style={{ marginRight: 3 }} />
                  <Text style={styles.qrText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ─── Input Bar — Parchment Ledger Style ─── */}
          <LinearGradient colors={GRADIENTS.header} style={styles.inputBar}>
            <View style={styles.inputWrap}>
              <Ionicons name="pencil-outline" size={14} color={COLORS.textMuted} style={{ marginHorizontal: 4 }} />
              <TextInput
                style={styles.chatInput}
                placeholder="Ask about your glucose, diet, or health..."
                placeholderTextColor={COLORS.textMuted}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => sendMessage()}
                returnKeyType="send"
                multiline
              />
            </View>
            <TouchableOpacity onPress={() => sendMessage()} disabled={loading || !input.trim()} style={{ opacity: loading || !input.trim() ? 0.5 : 1 }}>
              <LinearGradient colors={GRADIENTS.cyan} style={styles.sendBtn}>
                <Ionicons name="send" size={16} color="#fffdf9" />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── Header ───
  header: { paddingTop: 50, paddingBottom: 0 },
  headerInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(92,72,58,0.09)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#dcd3be',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatarRing: { width: 42, height: 42, borderRadius: 21, ...SHADOWS.button },
  headerAvatarGrad: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#fffdf5', ...FONTS.bold, fontSize: 18 },
  headerTitle: { fontSize: 15, color: COLORS.textPrimary, ...FONTS.bold },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.emerald },
  onlineText: { fontSize: 9.5, color: COLORS.emerald, ...FONTS.semibold },
  headerAccentBar: { height: 2.5 },

  // ─── Context bar ───
  contextBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#faf6ee', borderBottomWidth: 1,
  },
  contextText: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  contextBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  contextBadgeText: { fontSize: 8, ...FONTS.bold, letterSpacing: 0.8 },

  // ─── Notebook ───
  notebookLinesContainer: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, pointerEvents: 'none' },
  notebookLine: { position: 'absolute', left: 0, right: 0, height: 0.7, backgroundColor: '#ccc0a8', opacity: 0.25 },
  notebookMarginLine: { position: 'absolute', left: 28, top: 0, bottom: 0, width: 1.2, backgroundColor: '#e0a090', opacity: 0.2, zIndex: 1 },

  // ─── Messages ───
  chatArea: { flex: 1 },
  msgRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end', gap: 8 },
  botRow: { justifyContent: 'flex-start' },
  userRow: { justifyContent: 'flex-end' },

  // Bot avatar
  botAvatar: { width: 36, height: 36, borderRadius: 18, flexShrink: 0, ...SHADOWS.button },
  botAvatarRing: { width: 36, height: 36, borderRadius: 18, padding: 2, alignItems: 'center', justifyContent: 'center' },
  botAvatarInner: { flex: 1, width: '100%', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  botAvatarText: { color: '#5c483a', fontSize: 13, ...FONTS.bold },
  // User avatar
  userAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  userAvatarText: { color: '#fffdf9', fontSize: 13, ...FONTS.bold },

  // Bubbles — notebook-page style
  bubble: { maxWidth: '78%', borderRadius: 16, padding: 12, position: 'relative' },
  botBubble: {
    backgroundColor: '#fffef9',
    borderWidth: 1, borderColor: '#ddd4c0',
    borderBottomLeftRadius: 4,
    ...SHADOWS.card,
  },
  botBubbleEar: {
    position: 'absolute', bottom: -1, left: -6,
    width: 0, height: 0,
    borderTopWidth: 8, borderTopColor: '#ddd4c0',
    borderRightWidth: 8, borderRightColor: 'transparent',
  },
  userBubble: {
    backgroundColor: COLORS.cyan,
    borderBottomRightRadius: 4,
    ...SHADOWS.card,
  },
  userBubbleEar: {
    position: 'absolute', bottom: -1, right: -6,
    width: 0, height: 0,
    borderTopWidth: 8, borderTopColor: COLORS.cyan,
    borderLeftWidth: 8, borderLeftColor: 'transparent',
  },
  bubbleText: { fontSize: 13, lineHeight: 19 },
  botText: { color: COLORS.textPrimary },
  userText: { color: '#fffdf9' },
  boldText: { fontWeight: '700' },
  msgTime: { fontSize: 9, marginTop: 5, textAlign: 'right' },

  // Typing indicator
  typingRow: { flexDirection: 'row', gap: 5, paddingVertical: 4, paddingHorizontal: 2 },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.cyan },

  // ─── Quick Replies ───
  quickRepliesWrapper: {
    borderTopWidth: 1, borderTopColor: '#e6dbca', backgroundColor: '#faf6ee', maxHeight: 54,
  },
  qrChip: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#caa06d55', borderRadius: 22,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#fffcf7',
    ...SHADOWS.card,
  },
  qrText: { color: COLORS.orange, fontSize: 12, ...FONTS.medium },

  // ─── Input Bar ───
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, borderTopWidth: 1, borderTopColor: '#dcd3be',
  },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#fffcf7', borderRadius: 24,
    borderWidth: 1, borderColor: '#dcd3be',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  chatInput: { flex: 1, color: COLORS.textPrimary, fontSize: 13, maxHeight: 100, paddingTop: 0 },
  sendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', ...SHADOWS.button },
});
