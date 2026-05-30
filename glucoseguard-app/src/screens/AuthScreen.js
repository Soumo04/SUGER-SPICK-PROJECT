import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, Dimensions, KeyboardAvoidingView, Platform,
  ScrollView, Alert, StatusBar, ActivityIndicator, Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Ellipse, Path, Line, G, Polygon } from 'react-native-svg';
import { COLORS, FONTS, GRADIENTS, SHADOWS } from '../theme';
import { authAPI } from '../api';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// WAX SEAL — Spinning vintage medical emblem
// ─────────────────────────────────────────────────────────────────────────────
function WaxSeal({ color = COLORS.cyan, size = 88 }) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 22000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.04, duration: 2000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1.0, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, []);
  const rotate = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }, { scale: pulseAnim }] }}>
      <Svg width={size} height={size} viewBox="0 0 88 88">
        {/* Outer ring — fine dash */}
        <Circle cx="44" cy="44" r="41" fill="none" stroke={color} strokeWidth="0.7" strokeDasharray="3 5" opacity="0.35" />
        {/* Mid ring — heavier */}
        <Circle cx="44" cy="44" r="33" fill="none" stroke={color} strokeWidth="1.2" strokeDasharray="6 4" opacity="0.28" />
        {/* Inner solid ring */}
        <Circle cx="44" cy="44" r="24" fill="none" stroke={color} strokeWidth="1.6" opacity="0.22" />

        {/* Radial spokes — 8-pointed star rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 44 + 24 * Math.cos(rad);
          const y1 = 44 + 24 * Math.sin(rad);
          const x2 = 44 + 41 * Math.cos(rad);
          const y2 = 44 + 41 * Math.sin(rad);
          return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.3" opacity="0.3" />;
        })}

        {/* Small diamond ornaments at intercardinal positions */}
        {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const cx = 44 + 33 * Math.cos(rad);
          const cy = 44 + 33 * Math.sin(rad);
          return <Circle key={i} cx={cx} cy={cy} r="1.8" fill={color} opacity="0.45" />;
        })}

        {/* Center dot */}
        <Circle cx="44" cy="44" r="5" fill={color} opacity="0.55" />
        <Circle cx="44" cy="44" r="2.5" fill={color} opacity="0.9" />
      </Svg>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PARCHMENT BACKGROUND DECORATION
// ─────────────────────────────────────────────────────────────────────────────
function ParchmentDecor() {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Subtle vein-like paper texture lines */}
      <Path d={`M0 ${height * 0.25} Q ${width * 0.3} ${height * 0.22} ${width} ${height * 0.28}`} fill="none" stroke="#caa06d" strokeWidth="0.4" opacity="0.12" />
      <Path d={`M0 ${height * 0.6} Q ${width * 0.6} ${height * 0.55} ${width} ${height * 0.62}`} fill="none" stroke="#caa06d" strokeWidth="0.4" opacity="0.1" />
      <Path d={`M${width * 0.2} 0 Q ${width * 0.25} ${height * 0.5} ${width * 0.15} ${height}`} fill="none" stroke="#caa06d" strokeWidth="0.3" opacity="0.09" />
      {/* Corner rosette circles */}
      <Circle cx="0" cy="0" r="80" fill="none" stroke="#caa06d" strokeWidth="0.5" opacity="0.08" />
      <Circle cx={width} cy="0" r="80" fill="none" stroke="#caa06d" strokeWidth="0.5" opacity="0.08" />
      <Circle cx="0" cy={height} r="80" fill="none" stroke="#caa06d" strokeWidth="0.5" opacity="0.08" />
      <Circle cx={width} cy={height} r="80" fill="none" stroke="#caa06d" strokeWidth="0.5" opacity="0.08" />
    </Svg>
  );
}

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState('45');
  const [regGender, setRegGender] = useState('Male');
  const [regHeight, setRegHeight] = useState('170');
  const [regWeight, setRegWeight] = useState('70');

  const slideAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const cardFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: 1, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);

  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -9] });

  const switchMode = (toLogin) => {
    Animated.sequence([
      Animated.timing(cardFadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: toLogin ? 0 : 1, duration: 0, useNativeDriver: true }),
      Animated.timing(cardFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    setIsLogin(toLogin);
  };

  const handleLogin = async () => {
    if (!loginUser.trim() || !loginPass.trim()) {
      Alert.alert('Missing Fields', 'Please enter username and password.'); return;
    }
    setLoading(true);
    try {
      const data = await authAPI.login(loginUser.trim(), loginPass.trim());
      if (data.success) {
        navigation.reset({
          index: 0,
          routes: [{ name: data.user.role === 'admin' ? 'Admin' : 'Main', params: { user: data.user } }]
        });
      } else { Alert.alert('Access Denied', data.message); }
    } catch (e) { Alert.alert('Connection Error', 'Cannot reach GlucoseGuard server.'); }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!regUser.trim() || !regPass.trim() || !regName.trim()) {
      Alert.alert('Missing Fields', 'Please complete all required fields.'); return;
    }
    setLoading(true);
    try {
      const data = await authAPI.register({
        username: regUser.trim(), password: regPass.trim(), name: regName.trim(),
        age: parseInt(regAge) || 45, gender: regGender,
        height_cm: parseFloat(regHeight) || 170, weight_kg: parseFloat(regWeight) || 70,
      });
      if (data.success) {
        Alert.alert('✅ Record Established', 'Patient profile registered.', [{ text: 'Sign In', onPress: () => switchMode(true) }]);
      } else { Alert.alert('Registration Failed', data.message); }
    } catch (e) { Alert.alert('Connection Error', 'Cannot reach GlucoseGuard server.'); }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Warm parchment gradient background */}
      <LinearGradient
        colors={['#faf6ee', '#f3ecdd', '#ece2cf', '#e5d7c0']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }}
      />

      {/* Parchment paper texture decoration */}
      <ParchmentDecor />

      {/* Vintage corner accents — L-shaped filigree brackets */}
      <View style={styles.cornerTL} /><View style={styles.cornerTR} />
      <View style={styles.cornerBL} /><View style={styles.cornerBR} />

      {/* Inner edge rule lines — classical page borders */}
      <View style={styles.edgeBorderTop} />
      <View style={styles.edgeBorderBottom} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ─── Animated Logo Seal ─── */}
          <Animated.View style={[styles.logoArea, { transform: [{ translateY: floatY }] }]}>
            <View style={styles.sealWrapper}>
              <WaxSeal color={COLORS.cyan} size={90} />
              {/* Layered ring medallion */}
              <LinearGradient colors={GRADIENTS.brass} style={styles.logoRing}>
                <LinearGradient colors={GRADIENTS.parchmentCard} style={styles.logoInner}>
                  <Text style={styles.logoLetter}>G</Text>
                </LinearGradient>
              </LinearGradient>
            </View>
            <Text style={styles.appTitle}>GlucoseGuard</Text>
            <View style={styles.titleDivider}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerOrnamentation}>
                <View style={styles.dividerDiamond} />
                <Text style={styles.dividerText}>CLINICAL GLYCEMIC INTELLIGENCE</Text>
                <View style={styles.dividerDiamond} />
              </View>
              <View style={styles.dividerLine} />
            </View>
            <Text style={styles.buildTag}>v2.0 · EHR Compliant · HIPAA Certified</Text>
          </Animated.View>

          {/* ─── Toggle Tabs ─── */}
          <View style={styles.toggleWrapper}>
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, isLogin && styles.toggleActive]}
                onPress={() => switchMode(true)}
              >
                {isLogin && <LinearGradient colors={GRADIENTS.brass} style={styles.toggleActiveBar} />}
                <Ionicons name="log-in-outline" size={13} color={isLogin ? COLORS.textPrimary : COLORS.textMuted} style={{ marginBottom: 1 }} />
                <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>SIGN IN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !isLogin && styles.toggleActive]}
                onPress={() => switchMode(false)}
              >
                {!isLogin && <LinearGradient colors={GRADIENTS.brass} style={styles.toggleActiveBar} />}
                <Ionicons name="person-add-outline" size={13} color={!isLogin ? COLORS.textPrimary : COLORS.textMuted} style={{ marginBottom: 1 }} />
                <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>REGISTER</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── Parchment Card ─── */}
          <Animated.View style={[styles.card, { opacity: cardFadeAnim }]}>
            {/* Outer border */}
            <View style={styles.cardOuterRing} />
            {/* Inner content border */}
            <View style={styles.cardInnerBorder}>
              {isLogin ? (
                <View>
                  <View style={styles.cardTitleRow}>
                    <LinearGradient colors={GRADIENTS.brass} style={styles.cardTitleAccent} />
                    <View>
                      <Text style={styles.cardTitle}>Clinical Authentication</Text>
                      <Text style={styles.cardSubtitle}>Verify your credentials to access the diagnostic core.</Text>
                    </View>
                  </View>
                  <InputField icon="person-outline" placeholder="Username" value={loginUser} onChangeText={setLoginUser} />
                  <InputField icon="lock-closed-outline" placeholder="Security Key" value={loginPass} onChangeText={setLoginPass} secureTextEntry />
                  <VintageButton title={loading ? 'Authenticating...' : 'Authenticate Access'} onPress={handleLogin} loading={loading} />
                  <View style={styles.hintWrap}>
                    <Ionicons name="information-circle-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.hint}>Demo credentials: admin / admin123</Text>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.cardTitleRow}>
                    <LinearGradient colors={GRADIENTS.emerald} style={styles.cardTitleAccent} />
                    <View>
                      <Text style={styles.cardTitle}>Establish Patient Record</Text>
                      <Text style={styles.cardSubtitle}>Create a new physiological profile to begin glycemic monitoring.</Text>
                    </View>
                  </View>
                  <InputField icon="person-add-outline" placeholder="Choose Username *" value={regUser} onChangeText={setRegUser} />
                  <InputField icon="lock-closed-outline" placeholder="Password *" value={regPass} onChangeText={setRegPass} secureTextEntry />
                  <InputField icon="id-card-outline" placeholder="Full Legal Name *" value={regName} onChangeText={setRegName} />
                  <View style={styles.row}>
                    <InputField icon="calendar-outline" placeholder="Age" value={regAge} onChangeText={setRegAge} keyboardType="numeric" style={{ flex: 1, marginRight: 8 }} />
                    <InputField icon="resize-outline" placeholder="Height (cm)" value={regHeight} onChangeText={setRegHeight} keyboardType="numeric" style={{ flex: 1 }} />
                  </View>
                  <View style={styles.row}>
                    <InputField icon="barbell-outline" placeholder="Weight (kg)" value={regWeight} onChangeText={setRegWeight} keyboardType="numeric" style={{ flex: 1, marginRight: 8 }} />
                    <View style={[styles.inputWrap, { flex: 1, height: 'auto', paddingVertical: 9, flexDirection: 'column', alignItems: 'flex-start' }]}>
                      <Text style={styles.genderLabel}>GENDER</Text>
                      <View style={styles.genderRow}>
                        {['Male', 'Female'].map(g => (
                          <TouchableOpacity key={g} style={[styles.genderBtn, regGender === g && styles.genderActive]} onPress={() => setRegGender(g)}>
                            <Text style={[styles.genderBtnText, regGender === g && styles.genderActiveText]}>{g}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                  <VintageButton title={loading ? 'Registering...' : 'Establish Patient Core'} onPress={handleRegister} loading={loading} emerald />
                </View>
              )}
            </View>
          </Animated.View>

          {/* ─── Footer ─── */}
          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>© 2026 GlucoseGuard Clinical Intelligence · EHR Compliant</Text>
            <View style={styles.footerLine} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT FIELD — Aged parchment style with icon
// ─────────────────────────────────────────────────────────────────────────────
function InputField({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, style }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.inputWrap, focused && styles.inputWrapFocused, style]}>
      <Ionicons name={icon} size={15} color={focused ? COLORS.cyan : COLORS.textMuted} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VINTAGE BUTTON — Gradient with inner border + shimmer
// ─────────────────────────────────────────────────────────────────────────────
function VintageButton({ title, onPress, loading, emerald }) {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const onIn = () => Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true }).start();
  return (
    <Animated.View style={{ transform: [{ scale: pressAnim }], marginTop: 14 }}>
      <TouchableOpacity onPress={onPress} disabled={loading} onPressIn={onIn} onPressOut={onOut}>
        <LinearGradient
          colors={emerald ? ['#5a8f76', '#4a7c59', '#3b6b49'] : ['#3c8a8b', '#2c7a7b', '#1f5f60']}
          style={styles.gradBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          {/* Inner raised border effect */}
          <View style={styles.gradBtnInner}>
            {loading
              ? <ActivityIndicator color="#fffdf9" />
              : <Text style={styles.gradBtnText}>{title}</Text>}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', paddingBottom: 50, paddingTop: 55 },

  // Corner accents — classical L-bracket filigree
  cornerTL: { position: 'absolute', top: 18, left: 18, width: 34, height: 34, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderColor: '#c9a86c' },
  cornerTR: { position: 'absolute', top: 18, right: 18, width: 34, height: 34, borderTopWidth: 2.5, borderRightWidth: 2.5, borderColor: '#c9a86c' },
  cornerBL: { position: 'absolute', bottom: 18, left: 18, width: 34, height: 34, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderColor: '#c9a86c' },
  cornerBR: { position: 'absolute', bottom: 18, right: 18, width: 34, height: 34, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderColor: '#c9a86c' },

  // Edge rule lines — classical horizontal borders
  edgeBorderTop: { position: 'absolute', top: 52, left: 18, right: 18, height: 0.7, backgroundColor: '#c9a86c', opacity: 0.3 },
  edgeBorderBottom: { position: 'absolute', bottom: 52, left: 18, right: 18, height: 0.7, backgroundColor: '#c9a86c', opacity: 0.3 },

  // Logo
  logoArea: { alignItems: 'center', marginBottom: 22 },
  sealWrapper: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logoRing: { position: 'absolute', width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', ...SHADOWS.button },
  logoInner: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { fontSize: 30, color: '#5c483a', ...FONTS.bold },
  appTitle: { fontSize: 28, color: '#2b221a', ...FONTS.bold, letterSpacing: 1.2 },
  titleDivider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  dividerLine: { flex: 1, height: 0.8, backgroundColor: '#caa06d', opacity: 0.5, maxWidth: 36 },
  dividerOrnamentation: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dividerDiamond: { width: 5, height: 5, backgroundColor: '#c9a86c', transform: [{ rotate: '45deg' }] },
  dividerText: { fontSize: 8, color: '#8c7760', letterSpacing: 1.8, ...FONTS.bold },
  buildTag: { fontSize: 9, color: COLORS.textMuted, marginTop: 6, letterSpacing: 0.3 },

  // Toggle
  toggleWrapper: { marginBottom: 14, width: width - 40 },
  toggle: {
    flexDirection: 'row', backgroundColor: 'rgba(180,148,100,0.09)',
    borderRadius: 10, padding: 4, borderWidth: 1, borderColor: '#dfd0b8',
    ...SHADOWS.card,
  },
  toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 7, gap: 2, position: 'relative', overflow: 'hidden' },
  toggleActive: {
    backgroundColor: '#fffdf9',
    shadowColor: '#5c483a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3,
  },
  toggleActiveBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, borderTopLeftRadius: 7, borderTopRightRadius: 7 },
  toggleText: { color: '#9a8d82', fontSize: 10, ...FONTS.bold, letterSpacing: 1.2 },
  toggleTextActive: { color: '#5c483a' },

  // Card
  card: {
    width: width - 40,
    backgroundColor: '#fffdf9',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#caa06d',
    padding: 4,
    ...SHADOWS.deep,
    position: 'relative',
  },
  cardOuterRing: {
    position: 'absolute', top: 3, bottom: 3, left: 3, right: 3,
    borderWidth: 0.8, borderColor: '#f0e4cc', borderRadius: 15, pointerEvents: 'none',
  },
  cardInnerBorder: { borderWidth: 0.5, borderColor: '#faf2e0', borderRadius: 15, padding: 22 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  cardTitleAccent: { width: 4, height: '100%', minHeight: 40, borderRadius: 2 },
  cardTitle: { fontSize: 19, color: '#2b221a', ...FONTS.bold, marginBottom: 5 },
  cardSubtitle: { fontSize: 12, color: '#8c7760', lineHeight: 17, maxWidth: width - 140 },

  // Inputs
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#faf6ee', borderRadius: 11,
    borderWidth: 1, borderColor: '#dfd0b8',
    paddingHorizontal: 13, marginBottom: 10, height: 48,
  },
  inputWrapFocused: { borderColor: COLORS.cyan + '88', backgroundColor: '#f5f8f8' },
  inputIcon: { marginRight: 9 },
  input: { flex: 1, color: '#2b221a', fontSize: 13 },
  row: { flexDirection: 'row', gap: 8 },
  genderLabel: { fontSize: 8.5, color: '#9a8d82', ...FONTS.bold, letterSpacing: 0.5, marginBottom: 7 },
  genderRow: { flexDirection: 'row', gap: 6 },
  genderBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 7, borderWidth: 1, borderColor: '#dfd0b8', backgroundColor: '#faf6ee' },
  genderActive: { borderColor: '#4a7c59', backgroundColor: '#f0f8f2' },
  genderBtnText: { color: '#9a8d82', fontSize: 12, ...FONTS.semibold },
  genderActiveText: { color: '#4a7c59' },

  // Button
  gradBtn: { borderRadius: 12, padding: 2.5, ...SHADOWS.button },
  gradBtnInner: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  gradBtnText: { color: '#fffdf9', fontSize: 14, ...FONTS.bold, letterSpacing: 0.6 },

  hintWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10 },
  hint: { textAlign: 'center', color: '#9a8d82', fontSize: 11, fontStyle: 'italic' },

  // Footer
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28, paddingHorizontal: 10 },
  footerLine: { flex: 1, height: 0.7, backgroundColor: '#caa06d', opacity: 0.3 },
  footerText: { color: '#9a8d82', fontSize: 9.5, letterSpacing: 0.3 },
});
