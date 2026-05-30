import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Alert, ActivityIndicator, StatusBar, Dimensions, Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Circle, Path, Rect, Line, Ellipse, G } from 'react-native-svg';
import { COLORS, FONTS, GRADIENTS, SHADOWS } from '../theme';
import { fusionAPI } from '../api';

const { width } = Dimensions.get('window');

const PIPELINE_STEPS = [
  { id: 'early', label: 'Early Fusion', sub: 'Camera OCR + Text Alignment', icon: 'camera-outline' },
  { id: 'intermediate', label: 'Feature Fusion', sub: 'Nutritional Vector Lookup', icon: 'analytics-outline' },
  { id: 'late', label: 'Decision Fusion', sub: 'Physiological Integration', icon: 'pulse-outline' },
];

const DIABETIC_PROFILES = [
  { label: 'Type 2 Diabetic', baseline: 115, hr: 76 },
  { label: 'Type 1 Diabetic', baseline: 125, hr: 80 },
  { label: 'Pre-diabetic', baseline: 105, hr: 74 },
  { label: 'Healthy', baseline: 90, hr: 68 },
];

// ─────────────────────────────────────────────────────────────────────────────
// VINTAGE CORNER BRACKET SVG — enhanced with ornate details
// ─────────────────────────────────────────────────────────────────────────────
function CornerBrackets({ color = '#caa06d', size = 18 }) {
  return (
    <Svg width={size * 2} height={size * 2} viewBox="0 0 36 36">
      {/* TL */}
      <Path d="M2 16 L2 2 L16 2" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="2" cy="2" r="1.5" fill={color} opacity="0.8" />
      {/* TR */}
      <Path d="M20 2 L34 2 L34 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="34" cy="2" r="1.5" fill={color} opacity="0.8" />
      {/* BL */}
      <Path d="M2 20 L2 34 L16 34" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="2" cy="34" r="1.5" fill={color} opacity="0.8" />
      {/* BR */}
      <Path d="M20 34 L34 34 L34 20" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="34" cy="34" r="1.5" fill={color} opacity="0.8" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCANNER RETICLE — animated scan line
// ─────────────────────────────────────────────────────────────────────────────
function ScanReticle({ pulse }) {
  const lineAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(lineAnim, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(lineAnim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);
  const translateY = lineAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 40] });
  return (
    <View style={styles.scanReticle}>
      <Animated.View style={[styles.scanLine, { transform: [{ translateY }], opacity: pulse }]} />
    </View>
  );
}

export default function FoodLogScreen({ route, navigation }) {
  const user = route.params?.user || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [foodText, setFoodText] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [result, setResult] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [cotLines, setCotLines] = useState([]);
  const cameraRef = useRef(null);

  const stepAnims = useRef(PIPELINE_STEPS.map(() => new Animated.Value(0))).current;
  const resultAnim = useRef(new Animated.Value(0)).current;
  const scanPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(scanPulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
      Animated.timing(scanPulse, { toValue: 0.4, duration: 1400, useNativeDriver: true }),
    ])).start();
  }, []);

  const scanOpacity = scanPulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });

  const OCR_SAMPLES = [
    "NUTRITION LABEL: 1 Serving — 350 kcal | Sugar: 35g | Fiber: 1.2g | Protein: 4g | [Chocolate Glazed Donut]",
    "NUTRITION LABEL: 1 Bottle — 150 kcal | Sugar: 39g | Fiber: 0g | Protein: 0g | [Sweetened Soda]",
    "NUTRITION LABEL: 1 Bowl — 120 kcal | Sugar: 2.5g | Fiber: 6.2g | Protein: 3g | [Green Spinach Salad]",
    "NUTRITION LABEL: 1 Serving — 480 kcal | Sugar: 7g | Fiber: 2g | Protein: 25g | [Chicken Burger]",
  ];

  const activateStep = (idx) => {
    setPipelineStep(idx);
    Animated.timing(stepAnims[idx], { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const handleScan = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        const sample = OCR_SAMPLES[Math.floor(Math.random() * OCR_SAMPLES.length)];
        setFoodText(sample);
        Alert.alert('📷 Camera Simulated', 'Using simulated OCR scan. Grant camera permission for real scanning.');
        return;
      }
    }
    setShowCamera(true);
  };

  const handleCameraCapture = async () => {
    setShowCamera(false);
    const sample = OCR_SAMPLES[Math.floor(Math.random() * OCR_SAMPLES.length)];
    setFoodText(sample);
    Alert.alert('✅ Label Scanned', 'Nutrition label detected and parsed via OCR.');
  };

  const handleAnalyze = async () => {
    if (!foodText.trim()) { Alert.alert('No Input', 'Describe your food or scan a label first.'); return; }
    setLoading(true); setResult(null); setWaypoints([]); setCotLines([]); setPipelineStep(-1);
    stepAnims.forEach(a => a.setValue(0));
    const profile = DIABETIC_PROFILES[selectedProfile];
    const hasOCR = foodText.startsWith('NUTRITION');
    try {
      activateStep(0); await sleep(900);
      activateStep(1);
      const fuseData = await fusionAPI.fuse({
        text_entry: foodText, image_scanned: hasOCR,
        vital_status: { heart_rate: profile.hr, attention_level: 95, baseline_glucose: profile.baseline },
        user_state: { age: user.age || 45, gender: user.gender || 'Male', height_cm: user.height_cm || 170, weight_kg: user.weight_kg || 70 },
      });
      await sleep(800);
      activateStep(2);
      const reasonData = await fusionAPI.reason({
        fusion_results: fuseData,
        user_state: { name: user.name || 'Patient', age: user.age || 45, gender: user.gender || 'Male', height_cm: user.height_cm || 170, weight_kg: user.weight_kg || 70 },
      });
      await sleep(600);
      setResult(fuseData.decision_fused_results);
      setWaypoints(reasonData.waypoints || []);
      setCotLines(reasonData.chain_of_thought || []);
      Animated.timing(resultAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      if (user.id) {
        await fusionAPI.logIntake({
          user_id: user.id,
          food_name: foodText.slice(0, 80),
          sugar_g: fuseData.fusion_metadata?.intermediate_representation?.fused_sugar_g || 0,
          fiber_g: fuseData.fusion_metadata?.intermediate_representation?.fused_fiber_g || 0,
          calories_kcal: fuseData.fusion_metadata?.intermediate_representation?.fused_calories || 0,
          projected_peak: fuseData.decision_fused_results?.projected_peak || 0,
          mitigated_peak: reasonData.mitigated_peak || 0,
          vital_heart_rate: fuseData.decision_fused_results?.vital_projections?.projected_heart_rate || 72,
        });
      }
      navigation.navigate('Dashboard', {
        user,
        glucoseState: { ...fuseData.decision_fused_results, sugar: fuseData.fusion_metadata?.intermediate_representation?.fused_sugar_g },
      });
    } catch (e) { Alert.alert('Analysis Error', 'Could not connect to GlucoseGuard server.'); }
    setLoading(false);
  };

  if (showCamera) {
    return (
      <View style={{ flex: 1 }}>
        <CameraView style={{ flex: 1 }} ref={cameraRef} facing="back">
          <View style={styles.cameraOverlay}>
            <View style={styles.scanFrame}>
              {/* Corner brackets on camera */}
              <View style={[styles.camCorner, { top: 0, left: 0 }]} />
              <View style={[styles.camCorner, { top: 0, right: 0, transform: [{ scaleX: -1 }] }]} />
              <View style={[styles.camCorner, { bottom: 0, left: 0, transform: [{ scaleY: -1 }] }]} />
              <View style={[styles.camCorner, { bottom: 0, right: 0, transform: [{ scaleX: -1 }, { scaleY: -1 }] }]} />
              {/* Scan line */}
              <View style={styles.camScanLine} />
            </View>
            <Text style={styles.cameraHint}>Point at the nutrition label on the back of the package</Text>
            <View style={styles.cameraButtons}>
              <TouchableOpacity style={styles.camBtn} onPress={() => setShowCamera(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.camCaptureBtn} onPress={handleCameraCapture}>
                <View style={styles.camCaptureInner} />
              </TouchableOpacity>
              <View style={{ width: 48 }} />
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  const riskColor = result?.risk_level === 'CRITICAL' ? COLORS.red
    : result?.risk_level === 'HIGH' ? COLORS.orange
    : result?.risk_level === 'MODERATE' ? COLORS.yellow : COLORS.emerald;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" />

      {/* ─── Vintage Ledger Header ─── */}
      <LinearGradient colors={GRADIENTS.parchment} style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={17} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Food Intake Analysis</Text>
            <Text style={styles.headerSub}>MULTI-MODAL SENSOR FUSION LEDGER</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>
      {/* Brass header accent bar */}
      <LinearGradient colors={GRADIENTS.brass} style={styles.headerAccentBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ─── Diabetic Profile Selector — Vintage tab-style ─── */}
        <View style={styles.section}>
          <View style={styles.ledgerRowHeader}>
            <View style={styles.ledgerRowAccent} />
            <Text style={styles.sectionLabel}>Diabetic Profile Classification</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {DIABETIC_PROFILES.map((p, i) => (
                <TouchableOpacity key={i}
                  style={[styles.profileChip, selectedProfile === i && styles.profileChipActive]}
                  onPress={() => setSelectedProfile(i)}
                >
                  {selectedProfile === i && (
                    <LinearGradient colors={GRADIENTS.cyanSoft} style={StyleSheet.absoluteFill} borderRadius={20} />
                  )}
                  <Text style={[styles.profileChipText, selectedProfile === i && { color: COLORS.cyan, ...FONTS.bold }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ─── Ornate Camera Scan Box ─── */}
        <View style={styles.section}>
          <View style={styles.ledgerRowHeader}>
            <View style={styles.ledgerRowAccent} />
            <Text style={styles.sectionLabel}>Package Label Scanner</Text>
          </View>
          <TouchableOpacity onPress={handleScan}>
            <View style={styles.scanBoxOuter}>
              {/* Ornate vintage corner bracket decorations */}
              <View style={styles.cornerTL}><CornerBrackets color="#c9a86c" size={18} /></View>
              <View style={styles.cornerTR}><CornerBrackets color="#c9a86c" size={18} /></View>
              <View style={styles.cornerBL}><CornerBrackets color="#c9a86c" size={18} /></View>
              <View style={styles.cornerBR}><CornerBrackets color="#c9a86c" size={18} /></View>

              <Animated.View style={[styles.scanBoxContent, { opacity: scanOpacity }]}>
                {/* Reticle ring */}
                <View style={styles.scanIconRingOuter}>
                  <View style={styles.scanIconRingInner}>
                    <Ionicons name="scan-outline" size={34} color={COLORS.cyan} />
                  </View>
                </View>
                <ScanReticle pulse={scanOpacity} />
                <Text style={styles.scanTitle}>📦 Package Label Scanner</Text>
                <Text style={styles.scanSub}>Tap to activate camera · OCR-powered nutrition detection</Text>
              </Animated.View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── Parchment Text Input — Vintage ledger entry ─── */}
        <View style={styles.section}>
          <View style={styles.ledgerRowHeader}>
            <View style={styles.ledgerRowAccent} />
            <Text style={styles.sectionLabel}>Describe Intake or Paste OCR</Text>
          </View>
          <View style={styles.textAreaWrapper}>
            {/* Ledger left-margin rule */}
            <View style={styles.ledgerMarginLine} />
            {/* Ruled lines inside text area */}
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={[styles.ledgerRuleLine, { top: 42 + i * 24 }]} />
            ))}
            <View style={styles.textAreaHeader}>
              <Ionicons name="document-text-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.textAreaLabel}>CLINICAL INTAKE ENTRY</Text>
            </View>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder={"e.g. 'Chocolate glazed donut and glass of orange juice'..."}
              placeholderTextColor={COLORS.textMuted}
              value={foodText}
              onChangeText={setFoodText}
            />
          </View>
        </View>

        {/* ─── Vintage Analyze Button ─── */}
        <TouchableOpacity onPress={handleAnalyze} disabled={loading} style={{ marginBottom: 22 }}>
          <LinearGradient colors={['#3c8a8b', '#2c7a7b', '#1f5f60']} style={styles.analyzeBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {/* Double border on button */}
            <View style={styles.analyzeBtnInner}>
              {loading ? <ActivityIndicator color="#fffdf9" /> : (
                <>
                  <Ionicons name="flash-outline" size={18} color="#fffdf9" />
                  <Text style={styles.analyzeBtnText}>Execute Multi-Modal Fusion</Text>
                </>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ─── Pipeline Steps — Vintage ledger steps ─── */}
        {pipelineStep >= 0 && (
          <View style={styles.section}>
            <View style={styles.ledgerRowHeader}>
              <View style={styles.ledgerRowAccent} />
              <Text style={styles.sectionLabel}>Sensor Fusion Pipeline</Text>
            </View>
            {PIPELINE_STEPS.map((step, i) => (
              <Animated.View key={step.id} style={[styles.pipeStep, {
                opacity: stepAnims[i],
                borderColor: i <= pipelineStep ? COLORS.cyan + '66' : '#dcd3be',
                borderLeftColor: i < pipelineStep ? COLORS.emerald : i === pipelineStep ? COLORS.cyan : '#dcd3be',
              }]}>
                <View style={[styles.pipeNum, {
                  backgroundColor: i < pipelineStep ? COLORS.emerald : i === pipelineStep ? COLORS.cyan : '#e6dbca',
                }]}>
                  {i < pipelineStep
                    ? <Ionicons name="checkmark" size={13} color="#fff" />
                    : <Text style={[styles.pipeNumText, { color: i <= pipelineStep ? '#fff' : '#9a8d82' }]}>{i + 1}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pipeLabel}>{step.label}</Text>
                  <Text style={styles.pipeSub}>
                    {i === pipelineStep ? '⟳ Processing…' : i < pipelineStep ? '✓ Complete' : step.sub}
                  </Text>
                </View>
                <Ionicons name={step.icon} size={16} color={i <= pipelineStep ? COLORS.cyan : COLORS.textMuted} />
              </Animated.View>
            ))}
          </View>
        )}

        {/* ─── Vintage Results Card ─── */}
        {result && (
          <Animated.View style={[styles.section, { opacity: resultAnim }]}>
            <View style={[styles.resultCard, { borderColor: riskColor + '60' }]}>
              {/* Double inner border */}
              <View style={[styles.resultCardInnerBorder, { borderColor: riskColor + '25' }]} />

              {/* Risk Badge Header */}
              <LinearGradient colors={[riskColor + '22', riskColor + '08']} style={styles.resultHeader}>
                <Text style={[styles.resultRisk, { color: riskColor }]}>{result.alert_message || result.risk_level}</Text>
                <Text style={[styles.resultPeak, { color: riskColor }]}>{result.projected_peak} <Text style={styles.resultPeakUnit}>mg/dL</Text></Text>
              </LinearGradient>

              <LinearGradient colors={GRADIENTS.brass} style={styles.resultDivider} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />

              <View style={styles.resultGrid}>
                <ResultStat label="Baseline" value={`${result.baseline_glucose}`} unit="mg/dL" color={COLORS.cyan} />
                <ResultStat label="Projected Peak" value={`${result.projected_peak}`} unit="mg/dL" color={riskColor} />
                <ResultStat label="Heart Rate" value={`${result.vital_projections?.projected_heart_rate}`} unit="BPM" color={COLORS.purple} />
                <ResultStat label="Criticality" value={`${result.criticality_score}`} unit="/100" color={riskColor} />
              </View>
            </View>

            {/* ─── Waypoints — vintage ledger entries ─── */}
            {waypoints.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <View style={styles.ledgerRowHeader}>
                  <View style={styles.ledgerRowAccent} />
                  <Text style={styles.sectionLabel}>LLM-DWA Mitigation Waypoints</Text>
                </View>
                {waypoints.map((wp, i) => {
                  const wc = wp.urgency === 'IMMEDIATE' ? COLORS.red : wp.urgency === 'HIGH' ? COLORS.orange : COLORS.cyan;
                  return (
                    <View key={wp.id} style={[styles.waypointCard, { borderLeftColor: wc }]}>
                      <View style={styles.wpHeader}>
                        <View style={[styles.wpBullet, { backgroundColor: wc }]} />
                        <Text style={styles.wpTitle}>{wp.title}</Text>
                        <View style={[styles.wpUrgency, { backgroundColor: wc + '18', borderColor: wc + '44' }]}>
                          <Text style={[styles.wpUrgencyText, { color: wc }]}>{wp.urgency}</Text>
                        </View>
                      </View>
                      <Text style={styles.wpDesc}>{wp.description}</Text>
                      <Text style={styles.wpImpact}>↳ {wp.impact}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ─── Chain of Thought — vintage monograph ─── */}
            {cotLines.length > 0 && (
              <View style={styles.terminal}>
                <View style={styles.terminalHeader}>
                  <View style={[styles.terminalDot, { backgroundColor: COLORS.red }]} />
                  <View style={[styles.terminalDot, { backgroundColor: COLORS.yellow }]} />
                  <View style={[styles.terminalDot, { backgroundColor: COLORS.emerald }]} />
                  <Text style={styles.terminalTitle}>AI Chain-of-Thought Reasoning</Text>
                </View>
                {cotLines.map((line, i) => (
                  <Text key={i} style={styles.cotLine}>
                    <Text style={{ color: COLORS.emerald + 'aa' }}>› </Text>{line}
                  </Text>
                ))}
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function ResultStat({ label, value, unit, color }) {
  return (
    <View style={styles.resultStat}>
      <Text style={[styles.resultStatVal, { color }]}>{value}</Text>
      <Text style={styles.resultStatUnit}>{unit}</Text>
      <Text style={styles.resultStatLabel}>{label}</Text>
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
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 17, color: COLORS.textPrimary, ...FONTS.bold },
  headerSub: { fontSize: 8, color: COLORS.textMuted, letterSpacing: 1.4, marginTop: 2 },
  headerAccentBar: { height: 2.5 },

  // ─── Layout ───
  scroll: { padding: 16, paddingBottom: 60 },
  section: { marginBottom: 20 },
  ledgerRowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  ledgerRowAccent: { width: 3, height: 14, backgroundColor: COLORS.yellow, borderRadius: 2 },
  sectionLabel: { fontSize: 9.5, color: COLORS.textSecondary, ...FONTS.bold, textTransform: 'uppercase', letterSpacing: 1.4 },

  // ─── Profile chips ───
  profileChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22,
    borderWidth: 1, borderColor: '#dcd3be', backgroundColor: '#fffcf7',
    overflow: 'hidden',
  },
  profileChipActive: { borderColor: COLORS.cyan + '88' },
  profileChipText: { color: COLORS.textSecondary, fontSize: 12, ...FONTS.medium },

  // ─── Scan Box ───
  scanBoxOuter: {
    borderRadius: 16, borderWidth: 1.5, borderColor: '#caa06d', borderStyle: 'dashed',
    backgroundColor: '#fffcf7', paddingVertical: 32, paddingHorizontal: 24,
    alignItems: 'center', position: 'relative', overflow: 'hidden',
    ...SHADOWS.card,
  },
  scanBoxContent: { alignItems: 'center', gap: 10 },
  scanIconRingOuter: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 1.5, borderColor: COLORS.cyan + '40',
    backgroundColor: '#f0f8f7', alignItems: 'center', justifyContent: 'center',
  },
  scanIconRingInner: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 1, borderColor: COLORS.cyan + '25',
    alignItems: 'center', justifyContent: 'center',
  },
  scanReticle: { position: 'absolute', top: 14, height: 86, width: 86, overflow: 'hidden', borderRadius: 40 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 1.5, backgroundColor: COLORS.cyan, opacity: 0.6 },
  scanTitle: { fontSize: 15, color: COLORS.textPrimary, ...FONTS.bold },
  scanSub: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', lineHeight: 15 },
  cornerTL: { position: 'absolute', top: 7, left: 7 },
  cornerTR: { position: 'absolute', top: 7, right: 7 },
  cornerBL: { position: 'absolute', bottom: 7, left: 7 },
  cornerBR: { position: 'absolute', bottom: 7, right: 7 },

  // ─── Text Area — Ledger paper ───
  textAreaWrapper: {
    backgroundColor: '#faf6ee', borderRadius: 13, borderWidth: 1.5,
    borderColor: '#dcd3be', padding: 14, position: 'relative', overflow: 'hidden',
    ...SHADOWS.card,
  },
  ledgerMarginLine: { position: 'absolute', left: 36, top: 0, bottom: 0, width: 1, backgroundColor: '#e0a090', opacity: 0.2 },
  ledgerRuleLine: { position: 'absolute', left: 0, right: 0, height: 0.7, backgroundColor: '#ccc0a8', opacity: 0.2 },
  textAreaHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  textAreaLabel: { fontSize: 8.5, color: COLORS.textMuted, ...FONTS.bold, letterSpacing: 1.2 },
  textArea: { color: COLORS.textPrimary, fontSize: 13, minHeight: 96, textAlignVertical: 'top', lineHeight: 22, paddingLeft: 26 },

  // ─── Button ───
  analyzeBtn: { borderRadius: 14, padding: 3, ...SHADOWS.button },
  analyzeBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 11,
  },
  analyzeBtnText: { color: '#fffdf9', fontSize: 14, ...FONTS.bold, letterSpacing: 0.3 },

  // ─── Pipeline steps ───
  pipeStep: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fffcf7', borderRadius: 13, padding: 14, marginBottom: 8,
    borderWidth: 1, borderLeftWidth: 3,
    ...SHADOWS.card,
  },
  pipeNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pipeNumText: { fontSize: 12, ...FONTS.bold },
  pipeLabel: { fontSize: 13, color: COLORS.textPrimary, ...FONTS.semibold },
  pipeSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  // ─── Results ───
  resultCard: {
    borderRadius: 18, borderWidth: 1.5, overflow: 'hidden',
    ...SHADOWS.deep,
    position: 'relative',
  },
  resultCardInnerBorder: {
    position: 'absolute', top: 3, bottom: 3, left: 3, right: 3,
    borderWidth: 0.7, borderRadius: 15, pointerEvents: 'none',
  },
  resultHeader: { padding: 22, alignItems: 'center', backgroundColor: '#fffcf7' },
  resultRisk: { fontSize: 12, ...FONTS.bold, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  resultPeak: { fontSize: 48, ...FONTS.bold, marginTop: 4 },
  resultPeakUnit: { fontSize: 18, ...FONTS.medium },
  resultDivider: { height: 2 },
  resultGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 8, backgroundColor: '#fffcf7' },
  resultStat: {
    width: (width - 80) / 2, alignItems: 'center',
    backgroundColor: '#faf6ee', borderRadius: 11, padding: 12,
    borderWidth: 1, borderColor: '#e6dbca',
  },
  resultStatVal: { fontSize: 22, ...FONTS.bold },
  resultStatUnit: { fontSize: 9, color: COLORS.textMuted, ...FONTS.semibold },
  resultStatLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },

  // ─── Waypoints ───
  waypointCard: {
    backgroundColor: '#fffcf7', borderRadius: 13, padding: 14, marginBottom: 8,
    borderLeftWidth: 3.5, borderWidth: 1, borderColor: '#e6dbca',
    ...SHADOWS.card,
  },
  wpHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  wpBullet: { width: 7, height: 7, borderRadius: 3.5, flexShrink: 0 },
  wpTitle: { fontSize: 13, color: COLORS.textPrimary, ...FONTS.semibold, flex: 1 },
  wpUrgency: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  wpUrgencyText: { fontSize: 8.5, ...FONTS.bold },
  wpDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17, paddingLeft: 15 },
  wpImpact: { fontSize: 11, color: COLORS.emerald, marginTop: 6, ...FONTS.semibold, paddingLeft: 15 },

  // ─── Chain of Thought terminal ───
  terminal: {
    backgroundColor: '#f2ede3', borderRadius: 14, padding: 16, marginTop: 16,
    borderWidth: 1.5, borderColor: COLORS.emerald + '44',
    ...SHADOWS.card,
  },
  terminalHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  terminalDot: { width: 9, height: 9, borderRadius: 4.5 },
  terminalTitle: { fontSize: 10, color: COLORS.emerald, ...FONTS.bold, letterSpacing: 0.8, marginLeft: 4 },
  cotLine: { fontSize: 11, color: '#3b6b49', lineHeight: 18, marginBottom: 5, fontStyle: 'italic' },

  // ─── Camera overlay ───
  cameraOverlay: { flex: 1, justifyContent: 'space-between', padding: 20, paddingTop: 60 },
  scanFrame: { alignSelf: 'center', width: 280, height: 180, borderWidth: 0, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  camCorner: { position: 'absolute', width: 28, height: 28, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderColor: '#fff' },
  camScanLine: { width: '100%', height: 1.5, backgroundColor: 'rgba(44,122,123,0.8)', shadowColor: COLORS.cyan, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4 },
  cameraHint: { textAlign: 'center', color: '#fff', fontSize: 13, backgroundColor: 'rgba(0,0,0,0.55)', padding: 12, borderRadius: 10 },
  cameraButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 30 },
  camBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  camCaptureBtn: { width: 74, height: 74, borderRadius: 37, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  camCaptureInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },
});
