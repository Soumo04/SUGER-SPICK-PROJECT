import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, StatusBar, Alert, Share, Dimensions, Platform, Animated, Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Line, Rect, G, Ellipse, Defs } from 'react-native-svg';
import { COLORS, FONTS, GRADIENTS, SHADOWS } from '../theme';
import { exportAPI } from '../api';

const { width } = Dimensions.get('window');

const CRITICALITY_CONFIG = {
  CRITICAL: { color: COLORS.red, bg: COLORS.red + '12', icon: 'warning', label: '🚨 CRITICAL ALERT' },
  HIGH: { color: COLORS.orange, bg: COLORS.orange + '12', icon: 'alert-circle', label: '⚠️ HIGH RISK' },
  MODERATE: { color: COLORS.yellow, bg: COLORS.yellow + '12', icon: 'information-circle', label: '⚡ MODERATE RISK' },
  LOW: { color: COLORS.emerald, bg: COLORS.emerald + '12', icon: 'checkmark-circle', label: '✅ LOW RISK' },
};

// ─────────────────────────────────────────────────────────────────────────────
// VINTAGE FHIR DOCUMENT ICON — parchment fold effect
// ─────────────────────────────────────────────────────────────────────────────
function FHIRBadge() {
  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(spinAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(spinAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);
  const scaleAnim = spinAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Svg width="44" height="54" viewBox="0 0 44 54">
        <Defs />
        {/* Page body */}
        <Rect x="2" y="2" width="36" height="50" rx="5" fill="#fffcf7" stroke="#caa06d" strokeWidth="1.5" />
        {/* Double inner border on document */}
        <Rect x="5" y="5" width="30" height="44" rx="3" fill="none" stroke="#e8d9be" strokeWidth="0.7" />
        {/* Folded corner */}
        <Path d="M28 2 L40 14 L28 14 Z" fill="#f5ead8" stroke="#caa06d" strokeWidth="1" />
        {/* Corner fold crease */}
        <Path d="M28 2 L28 14 L40 14" fill="none" stroke="#dfd0b8" strokeWidth="0.8" />
        {/* Document lines (text simulation) */}
        <Rect x="8" y="18" width="20" height="2" rx="1" fill="#dcd3be" />
        <Rect x="8" y="24" width="26" height="1.5" rx="0.75" fill="#e8dcc8" />
        <Rect x="8" y="29" width="22" height="1.5" rx="0.75" fill="#e8dcc8" />
        <Rect x="8" y="34" width="26" height="1.5" rx="0.75" fill="#e8dcc8" />
        <Rect x="8" y="39" width="18" height="1.5" rx="0.75" fill="#e8dcc8" />
        {/* FHIR seal at bottom */}
        <Circle cx="30" cy="44" r="5" fill="#f0f8f7" stroke={COLORS.emerald} strokeWidth="1" />
        <Path d="M27.5 44 L29.5 46 L32.5 41.5" fill="none" stroke={COLORS.emerald} strokeWidth="1.2" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CIRCULAR CRITICALITY GAUGE — vintage pressure meter style
// ─────────────────────────────────────────────────────────────────────────────
function CriticalityGauge({ score, color }) {
  const arcAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(arcAnim, { toValue: score / 100, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [score]);

  const r = 38;
  const circumference = 2 * Math.PI * r * 0.7; // 252-degree arc (not full circle)
  const fraction = score / 100;

  return (
    <View style={styles.gaugeContainer}>
      <Svg width={100} height={100} viewBox="0 0 100 100">
        <Defs />
        {/* Background arc track */}
        <Circle
          cx="50" cy="58" r={r}
          fill="none" stroke="#e6dbca" strokeWidth="7"
          strokeDasharray={`${circumference} ${2 * Math.PI * r}`}
          strokeLinecap="round"
          transform="rotate(126, 50, 58)"
          opacity="0.6"
        />
        {/* Filled arc */}
        <Circle
          cx="50" cy="58" r={r}
          fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${circumference * fraction} ${2 * Math.PI * r}`}
          strokeLinecap="round"
          transform="rotate(126, 50, 58)"
          opacity="0.9"
        />
        {/* Center text */}
        <G>
          <Circle cx="50" cy="58" r="25" fill="#fffcf7" stroke="#ddd0be" strokeWidth="1" />
        </G>
      </Svg>
      <View style={styles.gaugeLabel}>
        <Text style={[styles.gaugeLabelValue, { color }]}>{score}</Text>
        <Text style={styles.gaugeLabelUnit}>/100</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VINTAGE DECORATIVE SECTION TITLE
// ─────────────────────────────────────────────────────────────────────────────
function VintageSectionTitle({ title, icon, color = COLORS.textSecondary }) {
  return (
    <View style={styles.vintageSectionRow}>
      <LinearGradient colors={['#e8dcc8', '#d4c8b0', '#e8dcc8']} style={styles.vintageSectionLine} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <View style={[styles.vintageSectionBadge, { borderColor: color + '44' }]}>
        <Ionicons name={icon} size={12} color={color} />
        <Text style={[styles.vintageSectionTitle, { color }]}>{title.toUpperCase()}</Text>
      </View>
      <LinearGradient colors={['#e8dcc8', '#d4c8b0', '#e8dcc8']} style={styles.vintageSectionLine} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
    </View>
  );
}

export default function ExportScreen({ route, navigation }) {
  const user = route.params?.user || {};
  const glucoseState = route.params?.glucoseState || {};
  const waypoints = route.params?.waypoints || [];
  const [report, setReport] = useState(null);
  const [criticality, setCriticality] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const data = await exportAPI.generate({
        vitals: glucoseState, food: glucoseState, waypoints,
        diabetic_profile: 'Type 2 Diabetic', user_state: user,
      });
      if (data.success) {
        setReport(data.formatted_report);
        setCriticality(data.criticality);
        setGenerated(true);
      }
    } catch (e) { Alert.alert('Error', 'Could not generate report. Ensure server is running.'); }
    setLoading(false);
  };

  const handleShare = async () => {
    if (!report) return;
    try { await Share.share({ message: report, title: 'GlucoseGuard Clinical Report' }); }
    catch (e) { Alert.alert('Share Failed', e.message); }
  };

  const cfg = CRITICALITY_CONFIG[criticality?.level || 'LOW'];
  const peak = glucoseState?.projected_peak || 95;
  const critScore = criticality?.score || 10;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" />

      {/* ─── Vintage Parchment Document Header ─── */}
      <LinearGradient colors={GRADIENTS.parchment} style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={17} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEyebrow}>EHR INTEROPERABILITY</Text>
            <Text style={styles.headerTitle}>Clinical FHIR Export</Text>
          </View>
          <FHIRBadge />
        </View>
      </LinearGradient>
      {/* Brass accent bar */}
      <LinearGradient colors={GRADIENTS.brass} style={styles.headerAccentBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ─── Criticality Banner ─── */}
          {generated && cfg && (
            <View style={[styles.critBanner, { backgroundColor: cfg.bg, borderColor: cfg.color + '55' }]}>
              {/* Double inner border */}
              <View style={[styles.critBannerInner, { borderColor: cfg.color + '25' }]} />
              <Ionicons name={cfg.icon} size={30} color={cfg.color} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.critLabel, { color: cfg.color }]}>{cfg.label}</Text>
                <Text style={styles.critMessage}>{criticality?.message}</Text>
              </View>
              <CriticalityGauge score={critScore} color={cfg.color} />
            </View>
          )}

          {/* ─── Criticality Score Bar ─── */}
          {generated && (
            <View style={styles.scoreBarSection}>
              <View style={styles.scoreBarBg}>
                <LinearGradient
                  colors={critScore >= 80
                    ? [COLORS.red, '#c44a4c']
                    : critScore >= 60
                    ? [COLORS.orange, '#e8973c']
                    : critScore >= 35
                    ? [COLORS.yellow, '#c99a35']
                    : [COLORS.emerald, '#5a8c69']}
                  style={[styles.scoreBarFill, { width: `${critScore}%` }]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
                {/* Tick marks on bar */}
                {[25, 50, 75].map(pct => (
                  <View key={pct} style={[styles.scoreBarTick, { left: `${pct}%` }]} />
                ))}
              </View>
              <View style={styles.scoreBarLabels}>
                <Text style={styles.scoreBarLabel}>LOW</Text>
                <Text style={styles.scoreBarLabel}>MOD</Text>
                <Text style={styles.scoreBarLabel}>HIGH</Text>
                <Text style={styles.scoreBarLabel}>CRIT</Text>
              </View>
            </View>
          )}

          {/* ─── Patient Summary Card — Parchment Record ─── */}
          <VintageSectionTitle title="Patient Summary" icon="person-outline" color={COLORS.cyan} />
          <View style={styles.card}>
            <View style={styles.cardInnerBorder} />
            <Row label="Full Name" value={user.name || '--'} />
            <Row label="Age / Gender" value={`${user.age || '--'} / ${user.gender || '--'}`} />
            <Row label="Height / Weight" value={`${user.height_cm || '--'} cm / ${user.weight_kg || '--'} kg`} />
            <Row label="BMI Index" value={user.height_cm && user.weight_kg ? (user.weight_kg / ((user.height_cm / 100) ** 2)).toFixed(1) + ' kg/m²' : '--'} />
            <Row label="EHR Compliance" value="HIPAA · HL7 FHIR R4" />
          </View>

          {/* ─── Clinical Findings Card ─── */}
          <VintageSectionTitle title="Clinical Findings" icon="medical-outline" color={COLORS.orange} />
          <View style={styles.card}>
            <View style={styles.cardInnerBorder} />
            <Row label="Baseline Glucose" value={`${glucoseState.baseline_glucose || 95} mg/dL`} />
            <Row
              label="Projected Peak" value={`${peak} mg/dL`}
              valueColor={peak > 180 ? COLORS.red : peak > 140 ? COLORS.orange : COLORS.emerald}
            />
            <Row label="Risk Classification" value={glucoseState.risk_level || 'LOW'} />
            <Row label="Heart Rate (est.)" value={`${glucoseState.vital_projections?.projected_heart_rate || '--'} BPM`} />
            <Row label="Criticality Score" value={`${critScore} / 100`} valueColor={cfg?.color} />
          </View>

          {/* ─── Prescribed Waypoints Card ─── */}
          {waypoints.length > 0 && (
            <>
              <VintageSectionTitle title="Prescribed Waypoints" icon="map-outline" color={COLORS.purple} />
              <View style={styles.card}>
                <View style={styles.cardInnerBorder} />
                {waypoints.map((wp, i) => (
                  <View key={i} style={[styles.wpRow, { borderBottomColor: '#f0e8d8' }]}>
                    <View style={[styles.wpDot, {
                      backgroundColor: wp.urgency === 'IMMEDIATE' ? COLORS.red : wp.urgency === 'HIGH' ? COLORS.orange : COLORS.cyan
                    }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.wpTitle}>{wp.title}</Text>
                      <Text style={styles.wpSub}>{wp.impact}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ─── FHIR JSON Report — Vintage monograph console ─── */}
          {generated && report && (
            <>
              <VintageSectionTitle title="FHIR JSON Clinical Document" icon="document-text-outline" color={COLORS.emerald} />
              <View style={[styles.card, styles.fhirCard]}>
                <View style={styles.fhirCardHeader}>
                  <View style={[styles.terminalDot, { backgroundColor: COLORS.red }]} />
                  <View style={[styles.terminalDot, { backgroundColor: COLORS.yellow }]} />
                  <View style={[styles.terminalDot, { backgroundColor: COLORS.emerald }]} />
                  <Text style={styles.fhirCardTitle}>HL7 FHIR R4 · application/json</Text>
                </View>
                <View style={styles.fhirDivider} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text style={styles.fhirCode}>{report}</Text>
                </ScrollView>
              </View>
            </>
          )}

          {/* ─── Generate Button ─── */}
          <TouchableOpacity onPress={generateReport} disabled={loading} style={{ marginBottom: 12 }}>
            <LinearGradient colors={['#3c8a8b', '#2c7a7b', '#1f5f60']} style={styles.actionBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={styles.actionBtnInner}>
                {loading ? <ActivityIndicator color="#fffdf9" /> : (
                  <>
                    <Ionicons name="document-text-outline" size={18} color="#fffdf9" />
                    <Text style={styles.actionBtnText}>{generated ? 'Regenerate Clinical Report' : 'Generate FHIR Clinical Report'}</Text>
                  </>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* ─── Share Button ─── */}
          {generated && (
            <TouchableOpacity onPress={handleShare} style={{ marginBottom: 12 }}>
              <LinearGradient colors={['#5a8f76', '#4a7c59', '#3b6b49']} style={styles.actionBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <View style={styles.actionBtnInner}>
                  <Ionicons name="share-outline" size={18} color="#fffdf9" />
                  <Text style={styles.actionBtnText}>Share / Export Report</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ─── HIPAA Compliance Badge — Vintage ribbon style ─── */}
          <View style={styles.hipaaCard}>
            {/* Outer double border */}
            <View style={styles.hipaaCardInner} />
            <Ionicons name="shield-checkmark" size={20} color={COLORS.emerald} />
            <View style={{ flex: 1 }}>
              <Text style={styles.hipaaTitle}>HIPAA COMPLIANT · CERTIFIED</Text>
              <Text style={styles.hipaaText}>AES-256-GCM Encrypted · RBAC Access Control · HL7 FHIR R4 Interoperability</Text>
            </View>
          </View>

          {/* ─── Footer ─── */}
          <View style={styles.docFooter}>
            <View style={styles.docFooterLine} />
            <Text style={styles.docFooterText}>
              Record generated: {new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
            </Text>
            <View style={styles.docFooterLine} />
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function Row({ label, value, valueColor }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor && { color: valueColor }]}>{value}</Text>
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
  headerCenter: { alignItems: 'center', flex: 1, marginLeft: 8 },
  headerEyebrow: { fontSize: 8, color: '#a3927e', ...FONTS.bold, letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontSize: 17, color: COLORS.textPrimary, ...FONTS.bold },
  headerAccentBar: { height: 2.5 },

  scroll: { padding: 16, paddingBottom: 60 },

  // ─── Criticality Banner ───
  critBanner: {
    borderRadius: 16, borderWidth: 1.5, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 14, position: 'relative', overflow: 'hidden',
    ...SHADOWS.card,
  },
  critBannerInner: {
    position: 'absolute', top: 3, bottom: 3, left: 3, right: 3,
    borderWidth: 0.7, borderRadius: 13, pointerEvents: 'none',
  },
  critLabel: { fontSize: 14, ...FONTS.bold, marginBottom: 3 },
  critMessage: { fontSize: 11, color: COLORS.textSecondary, lineHeight: 15 },

  // ─── Circular gauge ───
  gaugeContainer: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  gaugeLabel: { position: 'absolute', top: 26, alignItems: 'center' },
  gaugeLabelValue: { fontSize: 18, ...FONTS.bold, lineHeight: 20 },
  gaugeLabelUnit: { fontSize: 9, color: COLORS.textMuted, ...FONTS.bold },

  // ─── Score Bar ───
  scoreBarSection: { marginBottom: 18 },
  scoreBarBg: {
    height: 8, backgroundColor: '#e6dbca', borderRadius: 4, overflow: 'hidden',
    marginBottom: 4, position: 'relative',
  },
  scoreBarFill: { height: '100%', borderRadius: 4 },
  scoreBarTick: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(92,72,58,0.2)' },
  scoreBarLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreBarLabel: { fontSize: 8.5, color: COLORS.textMuted, ...FONTS.bold, letterSpacing: 0.5 },

  // ─── Vintage section title ───
  vintageSectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 4 },
  vintageSectionLine: { flex: 1, height: 1 },
  vintageSectionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: '#fffcf7',
  },
  vintageSectionTitle: { fontSize: 9, ...FONTS.bold, letterSpacing: 0.8 },

  // ─── Cards ───
  card: {
    backgroundColor: '#fffcf7', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#dcd3be', marginBottom: 14,
    ...SHADOWS.card, position: 'relative',
  },
  cardInnerBorder: {
    position: 'absolute', top: 3, bottom: 3, left: 3, right: 3,
    borderWidth: 0.5, borderColor: '#f5ead5', borderRadius: 11, pointerEvents: 'none',
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 0.7, borderBottomColor: '#f0e8d8',
  },
  rowLabel: { fontSize: 13, color: COLORS.textSecondary },
  rowValue: { fontSize: 13, color: COLORS.textPrimary, ...FONTS.semibold, textAlign: 'right', maxWidth: '55%' },
  wpRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 9, borderBottomWidth: 0.7 },
  wpDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },
  wpTitle: { fontSize: 13, color: COLORS.textPrimary, ...FONTS.semibold },
  wpSub: { fontSize: 11, color: COLORS.emerald, marginTop: 2, ...FONTS.medium },

  // ─── FHIR Code Card ───
  fhirCard: { backgroundColor: '#f2ede3' },
  fhirCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  terminalDot: { width: 9, height: 9, borderRadius: 4.5 },
  fhirCardTitle: { fontSize: 10, color: COLORS.emerald, ...FONTS.bold, letterSpacing: 0.5, marginLeft: 4 },
  fhirDivider: { height: 0.7, backgroundColor: COLORS.emerald + '33', marginBottom: 10 },
  fhirCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11, color: '#3b6b49', lineHeight: 18,
  },

  // ─── Buttons ───
  actionBtn: { borderRadius: 14, padding: 3, marginBottom: 2, ...SHADOWS.button },
  actionBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 11,
  },
  actionBtnText: { color: '#fffdf9', fontSize: 14, ...FONTS.bold },

  // ─── HIPAA badge ───
  hipaaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.emerald + '0e', borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: COLORS.emerald + '44',
    marginTop: 8, position: 'relative', overflow: 'hidden',
  },
  hipaaCardInner: {
    position: 'absolute', top: 3, bottom: 3, left: 3, right: 3,
    borderWidth: 0.5, borderColor: COLORS.emerald + '25', borderRadius: 11, pointerEvents: 'none',
  },
  hipaaTitle: { fontSize: 9.5, color: COLORS.emerald, ...FONTS.bold, letterSpacing: 0.8, marginBottom: 2 },
  hipaaText: { fontSize: 10, color: COLORS.textSecondary, flex: 1, lineHeight: 14 },

  // ─── Footer ───
  docFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, paddingHorizontal: 4 },
  docFooterLine: { flex: 1, height: 0.7, backgroundColor: '#caa06d', opacity: 0.3 },
  docFooterText: { fontSize: 9, color: COLORS.textMuted, textAlign: 'center' },
});
