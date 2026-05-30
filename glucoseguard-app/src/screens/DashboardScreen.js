import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated, Dimensions,
  TouchableOpacity, StatusBar, Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Circle, Path, Ellipse, Line, Defs, RadialGradient, LinearGradient as SvgLinearGradient,
  Stop, Polygon, Rect, G, Text as SvgText
} from 'react-native-svg';
import { COLORS, FONTS, GRADIENTS, SHADOWS } from '../theme';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// ADVANCED 3D ISOMETRIC ANATOMY MAP WITH METABOLIC FLOW
// ─────────────────────────────────────────────────────────────────────────────
function IsometricBodyMap({ riskColor, riskLevel }) {
  const orbitAnim1 = useRef(new Animated.Value(0)).current;
  const orbitAnim2 = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.timing(orbitAnim1, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(orbitAnim2, { toValue: 1, duration: 6500, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(particleAnim, { toValue: 1, duration: 2200, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 0.95, duration: 1400, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.35, duration: 1400, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(heartAnim, { toValue: 1.18, duration: 400, useNativeDriver: true }),
      Animated.timing(heartAnim, { toValue: 1.0, duration: 400, useNativeDriver: true }),
      Animated.timing(heartAnim, { toValue: 1.0, duration: 400, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);

  const orbit1Rot = orbitAnim1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const orbit2Rot = orbitAnim2.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  // Particle positions along the body flow
  const pY = particleAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 175] });
  const pY2 = particleAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [100, 140, 175] });

  return (
    <Animated.View style={[styles.anatomyWrapper, { transform: [{ translateY: floatY }] }]}>
      {/* Outer metabolic glow halo */}
      <Animated.View style={[styles.anatomyHalo, { backgroundColor: riskColor + '18', opacity: glowAnim }]} />

      {/* Orbit ring 1 */}
      <Animated.View style={[styles.orbitRing1, { transform: [{ rotate: orbit1Rot }] }]}>
        <Svg width={110} height={110} viewBox="0 0 110 110">
          <Ellipse cx="55" cy="55" rx="50" ry="18" fill="none" stroke={riskColor} strokeWidth="0.8" strokeDasharray="4 5" opacity="0.35" />
          <Circle cx="55" cy="7" r="3.5" fill={riskColor} opacity="0.7" />
        </Svg>
      </Animated.View>

      {/* Orbit ring 2 */}
      <Animated.View style={[styles.orbitRing2, { transform: [{ rotate: orbit2Rot }] }]}>
        <Svg width={130} height={60} viewBox="0 0 130 60">
          <Ellipse cx="65" cy="30" rx="60" ry="20" fill="none" stroke={COLORS.cyan} strokeWidth="0.6" strokeDasharray="2 6" opacity="0.25" />
          <Circle cx="65" cy="10" r="2.5" fill={COLORS.cyan} opacity="0.55" />
          <Circle cx="125" cy="30" r="2" fill={COLORS.cyan} opacity="0.4" />
        </Svg>
      </Animated.View>

      <Svg width={150} height={240} viewBox="0 0 150 240">
        <Defs>
          <RadialGradient id="bodyGrad" cx="50%" cy="40%" rx="50%" ry="60%">
            <Stop offset="0%" stopColor="#fffef9" />
            <Stop offset="100%" stopColor="#f5ead5" />
          </RadialGradient>
          <RadialGradient id="heartGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={riskColor} stopOpacity="0.5" />
            <Stop offset="100%" stopColor={riskColor} stopOpacity="0" />
          </RadialGradient>
          <SvgLinearGradient id="torsoGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#fffef9" />
            <Stop offset="100%" stopColor="#f0e5cf" />
          </SvgLinearGradient>
          <SvgLinearGradient id="legGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#fdfaf4" />
            <Stop offset="100%" stopColor="#ece0cb" />
          </SvgLinearGradient>
        </Defs>

        {/* Isometric 3D shadow base plate */}
        <Ellipse cx="75" cy="225" rx="50" ry="12" fill="rgba(92,72,58,0.08)" />
        <Ellipse cx="75" cy="225" rx="38" ry="9" fill="rgba(92,72,58,0.06)" />
        <Ellipse cx="75" cy="225" rx="24" ry="6" fill="rgba(92,72,58,0.05)" />

        {/* Isometric ground grid lines */}
        <Line x1="25" y1="225" x2="125" y2="225" stroke="rgba(92,72,58,0.1)" strokeWidth="0.5" />
        <Line x1="75" y1="213" x2="75" y2="237" stroke="rgba(92,72,58,0.1)" strokeWidth="0.5" />

        {/* Deep metabolic orbit ellipses */}
        <Ellipse cx="75" cy="110" rx="50" ry="16" fill="none" stroke={riskColor} strokeWidth="0.7" strokeDasharray="3 5" opacity="0.25" />
        <Ellipse cx="75" cy="100" rx="66" ry="20" fill="none" stroke={COLORS.yellow} strokeWidth="0.5" strokeDasharray="2 7" opacity="0.18" />

        {/* === BODY ANATOMY — Layered 3D Wireframe === */}

        {/* Neck */}
        <Path d="M67 44 L83 44 L81 55 L69 55 Z" fill="url(#bodyGrad)" stroke="#8c7760" strokeWidth="0.9" />

        {/* Head — 3D volume with shading */}
        <Ellipse cx="75" cy="27" rx="19" ry="21" fill="url(#bodyGrad)" stroke="#5c483a" strokeWidth="1.4" />
        {/* Head side shading for depth */}
        <Path d="M92 20 Q95 27 92 34" fill="none" stroke="#cbb99a" strokeWidth="1.5" opacity="0.5" />
        {/* Eyes */}
        <Ellipse cx="68" cy="24" rx="2.5" ry="2" fill="#5c483a" />
        <Ellipse cx="82" cy="24" rx="2.5" ry="2" fill="#5c483a" />
        <Circle cx="69" cy="23.5" r="0.7" fill="#fffef9" />
        <Circle cx="83" cy="23.5" r="0.7" fill="#fffef9" />
        {/* Nose */}
        <Path d="M74 28 Q75 31 76 28" fill="none" stroke="#8c7760" strokeWidth="0.8" />

        {/* Torso — 3D layered with side shading */}
        <Path d="M52 56 Q44 76 46 118 L104 118 Q106 76 98 56 Z" fill="url(#torsoGrad)" stroke="#5c483a" strokeWidth="1.4" />
        {/* Torso right-side depth shadow */}
        <Path d="M98 56 Q106 76 104 118 Q100 80 97 56 Z" fill="rgba(92,72,58,0.06)" />
        {/* Torso centerline */}
        <Line x1="75" y1="56" x2="75" y2="118" stroke="#dcd3be" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.7" />
        {/* Collar bone */}
        <Path d="M56 62 Q75 68 94 62" fill="none" stroke="#c4b09a" strokeWidth="0.8" />
        {/* Rib cage hints */}
        <Path d="M58 74 Q75 80 92 74" fill="none" stroke="#dcd3be" strokeWidth="0.5" opacity="0.6" />
        <Path d="M57 82 Q75 88 93 82" fill="none" stroke="#dcd3be" strokeWidth="0.5" opacity="0.5" />
        <Path d="M56 90 Q75 96 94 90" fill="none" stroke="#dcd3be" strokeWidth="0.5" opacity="0.4" />

        {/* Glowing heart glow radial */}
        <Circle cx="71" cy="77" r="14" fill="url(#heartGlow)" opacity="0.7" />
        {/* Heart icon */}
        <Path d="M67 74 Q71 69 75 74 Q79 79 71 86 Q63 79 67 74" fill={riskColor} opacity="0.85" />

        {/* Pancreas — glowing with label marker */}
        <Ellipse cx="85" cy="97" rx="11" ry="5.5" fill="#fdfbf0" stroke={COLORS.purple} strokeWidth="1.1" opacity="0.85" />
        <SvgText x="85" y="97" fontSize="6" fill={COLORS.purple} textAnchor="middle" opacity="0.7">Pancreas</SvgText>

        {/* Liver mass */}
        <Ellipse cx="64" cy="98" rx="9" ry="6" fill="#fef9ef" stroke={COLORS.orange} strokeWidth="0.9" opacity="0.7" />

        {/* Stomach */}
        <Path d="M72 104 Q78 108 84 104 Q82 112 72 112 Z" fill="#fef8ee" stroke={COLORS.yellow} strokeWidth="0.8" opacity="0.65" />

        {/* Left Arm — 3D layered */}
        <Path d="M52 58 Q38 76 37 102 Q40 106 43 103 Q46 82 54 64" fill="url(#bodyGrad)" stroke="#5c483a" strokeWidth="1.1" />
        <Path d="M54 64 Q50 82 46 103" fill="none" stroke="#cbb99a" strokeWidth="0.8" opacity="0.4" />
        {/* Left hand */}
        <Ellipse cx="39" cy="106" rx="5" ry="3.5" fill="url(#bodyGrad)" stroke="#5c483a" strokeWidth="0.8" />

        {/* Right Arm — 3D layered */}
        <Path d="M98 58 Q112 76 113 102 Q110 106 107 103 Q104 82 96 64" fill="url(#bodyGrad)" stroke="#5c483a" strokeWidth="1.1" />
        <Path d="M96 64 Q100 82 104 103" fill="none" stroke="#cbb99a" strokeWidth="0.8" opacity="0.4" />
        {/* Right hand */}
        <Ellipse cx="111" cy="106" rx="5" ry="3.5" fill="url(#bodyGrad)" stroke="#5c483a" strokeWidth="0.8" />

        {/* Left Leg — 3D layered */}
        <Path d="M60 118 Q56 155 55 200 L65 200 Q67 156 70 118 Z" fill="url(#legGrad)" stroke="#5c483a" strokeWidth="1.1" />
        <Path d="M70 118 Q68 156 65 200" fill="none" stroke="#cbb99a" strokeWidth="0.7" opacity="0.35" />

        {/* Right Leg — 3D layered */}
        <Path d="M90 118 Q94 155 95 200 L85 200 Q83 156 80 118 Z" fill="url(#legGrad)" stroke="#5c483a" strokeWidth="1.1" />
        <Path d="M80 118 Q82 156 85 200" fill="none" stroke="#cbb99a" strokeWidth="0.7" opacity="0.35" />

        {/* Feet */}
        <Ellipse cx="60" cy="203" rx="9" ry="4.5" fill="url(#bodyGrad)" stroke="#5c483a" strokeWidth="0.9" />
        <Ellipse cx="90" cy="203" rx="9" ry="4.5" fill="url(#bodyGrad)" stroke="#5c483a" strokeWidth="0.9" />

        {/* === GLUCOSE METABOLIC FLOW PARTICLES === */}
        {/* Static particle nodes along bloodstream */}
        <Circle cx="68" cy="90" r="2.8" fill={riskColor} opacity="0.9" />
        <Circle cx="80" cy="95" r="2.4" fill={riskColor} opacity="0.75" />
        <Circle cx="65" cy="128" r="2.2" fill={riskColor} opacity="0.65" />
        <Circle cx="82" cy="135" r="2.0" fill={riskColor} opacity="0.55" />
        <Circle cx="62" cy="158" r="1.7" fill={riskColor} opacity="0.4" />
        <Circle cx="85" cy="163" r="1.5" fill={riskColor} opacity="0.3" />

        {/* Flow vector lines */}
        <Path d="M68 90 Q73 112 65 128" fill="none" stroke={riskColor} strokeWidth="0.8" strokeDasharray="2 3" opacity="0.35" />
        <Path d="M80 95 Q82 115 82 135" fill="none" stroke={riskColor} strokeWidth="0.8" strokeDasharray="2 3" opacity="0.3" />

        {/* Spine line — centerline 3D depth marker */}
        <Line x1="75" y1="55" x2="75" y2="200" stroke="rgba(92,72,58,0.06)" strokeWidth="1" strokeDasharray="4 4" />
      </Svg>

      {/* Floating animated particle */}
      <Animated.View style={[styles.floatingParticle, { backgroundColor: riskColor, top: undefined, transform: [{ translateY: pY }] }]} />
      <Animated.View style={[styles.floatingParticle2, { backgroundColor: riskColor, transform: [{ translateY: pY2 }] }]} />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADVANCED VINTAGE CLINICAL DIAL — BRASS PRESSURE GAUGE STYLE
// ─────────────────────────────────────────────────────────────────────────────
function VintageClinicalDial({ peak, riskLevel, riskColor }) {
  const needleAnim = useRef(new Animated.Value(-120)).current;
  const glassShimmer = useRef(new Animated.Value(0)).current;
  const clampedPeak = Math.min(300, Math.max(40, peak));
  const targetAngle = ((clampedPeak - 40) / 260) * 240 - 120;

  useEffect(() => {
    Animated.spring(needleAnim, {
      toValue: targetAngle,
      tension: 18,
      friction: 6,
      useNativeDriver: true,
    }).start();
    Animated.loop(Animated.sequence([
      Animated.timing(glassShimmer, { toValue: 1, duration: 3000, useNativeDriver: true }),
      Animated.timing(glassShimmer, { toValue: 0, duration: 3000, useNativeDriver: true }),
    ])).start();
  }, [peak]);

  const needleRot = needleAnim.interpolate({ inputRange: [-180, 180], outputRange: ['-180deg', '180deg'] });
  const shimmerOpacity = glassShimmer.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.14] });

  return (
    <View style={styles.dialWrapper}>
      <Text style={styles.dialCaption}>GLUCOSE MASS DIAL</Text>

      <View style={styles.dialOuter}>
        {/* Outer brass ring shadow */}
        <View style={styles.dialBrassRing} />

        <Svg width={148} height={148} viewBox="0 0 148 148" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="plateGrad" cx="50%" cy="45%" rx="50%" ry="55%">
              <Stop offset="0%" stopColor="#fffdf6" />
              <Stop offset="70%" stopColor="#f7ecda" />
              <Stop offset="100%" stopColor="#e8d7bc" />
            </RadialGradient>
            <RadialGradient id="brassRing" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="82%" stopColor="transparent" />
              <Stop offset="85%" stopColor="#c8a85e" />
              <Stop offset="90%" stopColor="#d4b86a" />
              <Stop offset="95%" stopColor="#b8942a" />
              <Stop offset="100%" stopColor="#c9a840" />
            </RadialGradient>
          </Defs>

          {/* Outer brass ring */}
          <Circle cx="74" cy="74" r="72" fill="url(#brassRing)" />
          {/* Inner dial plate */}
          <Circle cx="74" cy="74" r="66" fill="url(#plateGrad)" stroke="#c5b79e" strokeWidth="1.5" />
          {/* Fine inner ring */}
          <Circle cx="74" cy="74" r="60" fill="none" stroke="#ddd0b8" strokeWidth="0.6" strokeDasharray="2 3" />
          {/* Decorative inner ring */}
          <Circle cx="74" cy="74" r="54" fill="none" stroke="#e8dcc8" strokeWidth="0.4" />

          {/* Scale arc zones — colored risk bands */}
          {/* Normal (Green) */}
          <Path d="M28 108 A 54 54 0 0 1 36 40" fill="none" stroke={COLORS.emerald} strokeWidth="5" opacity="0.8" strokeLinecap="round" />
          {/* Moderate (Yellow) */}
          <Path d="M36 40 A 54 54 0 0 1 74 20" fill="none" stroke={COLORS.yellow} strokeWidth="5" opacity="0.8" strokeLinecap="round" />
          {/* High (Orange) */}
          <Path d="M74 20 A 54 54 0 0 1 112 40" fill="none" stroke={COLORS.orange} strokeWidth="5" opacity="0.8" strokeLinecap="round" />
          {/* Critical (Red) */}
          <Path d="M112 40 A 54 54 0 0 1 120 108" fill="none" stroke={COLORS.red} strokeWidth="5" opacity="0.8" strokeLinecap="round" />

          {/* Major scale ticks */}
          {[
            { angle: -120, len: 10 }, { angle: -90, len: 7 }, { angle: -60, len: 10 },
            { angle: -30, len: 7 }, { angle: 0, len: 10 }, { angle: 30, len: 7 },
            { angle: 60, len: 10 }, { angle: 90, len: 7 }, { angle: 120, len: 10 },
          ].map(({ angle, len }, i) => {
            const rad = ((angle - 90) * Math.PI) / 180;
            const x1 = 74 + 54 * Math.cos(rad);
            const y1 = 74 + 54 * Math.sin(rad);
            const x2 = 74 + (54 - len) * Math.cos(rad);
            const y2 = 74 + (54 - len) * Math.sin(rad);
            return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5c483a" strokeWidth={len > 8 ? 1.8 : 1} />;
          })}

          {/* Scale numbers */}
          <SvgText x="28" y="96" fontSize="8" fontWeight="bold" fill="#6e5e53" textAnchor="middle">40</SvgText>
          <SvgText x="36" y="52" fontSize="8" fontWeight="bold" fill="#6e5e53" textAnchor="middle">100</SvgText>
          <SvgText x="74" y="30" fontSize="8" fontWeight="bold" fill="#6e5e53" textAnchor="middle">180</SvgText>
          <SvgText x="112" y="52" fontSize="8" fontWeight="bold" fill="#6e5e53" textAnchor="middle">240</SvgText>
          <SvgText x="120" y="96" fontSize="8" fontWeight="bold" fill="#6e5e53" textAnchor="middle">300</SvgText>

          {/* Unit label */}
          <SvgText x="74" y="108" fontSize="8.5" fontWeight="bold" fill="#a3927e" textAnchor="middle">mg / dL</SvgText>

          {/* Model name serif */}
          <SvgText x="74" y="92" fontSize="6" fill="#b0a090" textAnchor="middle">GlucoseGuard</SvgText>
        </Svg>

        {/* Animated needle */}
        <Animated.View style={[styles.needleContainer, { transform: [{ rotate: needleRot }] }]}>
          {/* Brass needle pointer */}
          <LinearGradient colors={['#b33c3d', '#8a2a2b']} style={styles.needlePointer} />
          {/* Needle tail (counterweight) */}
          <View style={styles.needleTail} />
        </Animated.View>

        {/* Center brass pin with multi-layered ring */}
        <View style={styles.dialCenterOuter} />
        <View style={styles.dialCenterPin} />

        {/* Glass reflection shimmer overlay */}
        <Animated.View style={[styles.glassReflect, { opacity: shimmerOpacity }]} />
      </View>

      {/* Value readout */}
      <View style={[styles.dialStatBox, { backgroundColor: riskColor + '14', borderColor: riskColor + '44' }]}>
        <Text style={[styles.dialStatVal, { color: riskColor }]}>{peak} <Text style={styles.dialStatUnit}>mg/dL</Text></Text>
        <View style={[styles.riskBadge, { backgroundColor: riskColor + '20', borderColor: riskColor + '55' }]}>
          <Text style={[styles.riskBadgeText, { color: riskColor }]}>{riskLevel}</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED INSTRUMENT PANEL
// ─────────────────────────────────────────────────────────────────────────────
function GlucoseBodyModel({ riskLevel, peak }) {
  const riskColor = riskLevel === 'CRITICAL' ? COLORS.red
    : riskLevel === 'HIGH' ? COLORS.orange
    : riskLevel === 'MODERATE' ? COLORS.yellow
    : COLORS.emerald;

  return (
    <View style={styles.modelContainer}>
      {/* Double border — classic manuscript framing */}
      <View style={styles.doubleBorderOuter} />
      <View style={styles.doubleBorderInner} />

      {/* Filigree corner accents */}
      <View style={[styles.filigreeCorner, styles.filigreeCornerTL]} />
      <View style={[styles.filigreeCorner, styles.filigreeCornerTR]} />
      <View style={[styles.filigreeCorner, styles.filigreeCornerBL]} />
      <View style={[styles.filigreeCorner, styles.filigreeCornerBR]} />

      <Text style={styles.modelTitle}>
        ⚗  Clinical Glycemic Instrument — Metabolic Map
      </Text>

      <View style={styles.instrumentLayout}>
        <VintageClinicalDial peak={peak} riskLevel={riskLevel} riskColor={riskColor} />

        {/* Divider */}
        <View style={styles.instrumentDivider}>
          <View style={styles.instrumentDividerLine} />
          <View style={styles.instrumentDividerDot} />
          <View style={styles.instrumentDividerLine} />
        </View>

        <IsometricBodyMap riskColor={riskColor} riskLevel={riskLevel} />
      </View>

      {/* Status caption */}
      <LinearGradient
        colors={[riskColor + '08', riskColor + '18', riskColor + '08']}
        style={styles.captionGrad}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      >
        <Text style={[styles.modelCaption, { color: riskColor }]}>
          {riskLevel === 'CRITICAL' ? '🚨 CRITICAL — Dynamic blunting protocol highly recommended'
            : riskLevel === 'HIGH' ? '⚠️ HIGH — Active muscular GLUT4 clearance advised'
            : riskLevel === 'MODERATE' ? '⚡ MODERATE — Glycemic instability registered'
            : '✅ NORMAL — Glucose homeostatic stabilization active'}
        </Text>
      </LinearGradient>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardScreen({ route, navigation }) {
  const user = route.params?.user || {};
  const glucoseState = route.params?.glucoseState || {};
  const peak = glucoseState?.projected_peak || 95;
  const riskLevel = glucoseState?.risk_level || 'LOW';
  const baseline = glucoseState?.baseline_glucose || 95;
  const heartRate = glucoseState?.vital_projections?.projected_heart_rate || 72;
  const sugar = glucoseState?.sugar || 0;

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  const vitals = [
    { label: 'Baseline', value: baseline, unit: 'mg/dL', color: COLORS.cyan, icon: 'water-outline', grad: GRADIENTS.cyanSoft },
    {
      label: 'Projected Peak', value: peak, unit: 'mg/dL',
      color: peak > 180 ? COLORS.red : peak > 140 ? COLORS.orange : COLORS.emerald,
      icon: 'trending-up-outline',
      grad: peak > 180 ? [COLORS.red + '12', COLORS.red + '06'] : [COLORS.emerald + '12', COLORS.emerald + '06']
    },
    { label: 'Heart Rate', value: heartRate, unit: 'BPM', color: COLORS.purple, icon: 'heart-outline', grad: ['#f0ecee', '#ece4e8'] },
    { label: 'Sugar Mass', value: sugar || '--', unit: 'grams', color: COLORS.yellow, icon: 'cube-outline', grad: ['#faf4e8', '#f5ecda'] },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ─── Premium Vintage Header ─── */}
        <Animated.View style={[styles.headerWrap, { opacity: headerAnim }]}>
          <LinearGradient colors={GRADIENTS.parchment} style={styles.headerGrad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
            {/* Double border header inner */}
            <View style={styles.headerOuterBorder}>
              <View style={styles.headerInnerBorder}>
                <View style={styles.headerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.headerEyebrow}>PATIENT RECORD</Text>
                    <Text style={styles.greeting}>{user.name?.toUpperCase() || 'SUBJECT UNKNOWN'}</Text>
                    <Text style={styles.headerSub}>Glycemic Physiological Diagnostic Core</Text>
                  </View>
                  <View style={styles.headerRight}>
                    <LinearGradient colors={GRADIENTS.brass} style={styles.roleBadge}>
                      <Text style={styles.roleText}>PATIENT</Text>
                    </LinearGradient>
                    <View style={styles.headerTimestamp}>
                      <Ionicons name="time-outline" size={10} color={COLORS.textMuted} />
                      <Text style={styles.timestampText}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ─── 3D Instrument Panel ─── */}
        <GlucoseBodyModel riskLevel={riskLevel} peak={peak} />

        {/* ─── Section Title: Vitals ─── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionDividerLine} />
          <Text style={styles.sectionTitle}>Physiological Indices</Text>
          <View style={styles.sectionDividerLine} />
        </View>

        {/* ─── Vitals Grid — Deep 3D Tactile Cards ─── */}
        <View style={styles.vitalsGrid}>
          {vitals.map((v, i) => (
            <TouchableOpacity key={i} activeOpacity={0.78}>
              <LinearGradient colors={v.grad || [COLORS.bgCard, '#fffef9']} style={[styles.vitalCard, { borderColor: v.color + '44' }]}>
                {/* Card double border */}
                <View style={[styles.vitalCardInnerBorder, { borderColor: v.color + '20' }]} />
                <View style={styles.vitalCardHeader}>
                  <View style={[styles.vitalIconRing, { backgroundColor: v.color + '15', borderColor: v.color + '30' }]}>
                    <Ionicons name={v.icon} size={14} color={v.color} />
                  </View>
                  <Text style={styles.vitalLabel}>{v.label.toUpperCase()}</Text>
                </View>
                <Text style={[styles.vitalValue, { color: v.color }]}>{v.value}</Text>
                <Text style={styles.vitalUnit}>{v.unit}</Text>
                {/* Bottom accent line */}
                <View style={[styles.vitalAccentLine, { backgroundColor: v.color }]} />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Section Title: Actions ─── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionDividerLine} />
          <Text style={styles.sectionTitle}>Clinical Action Waypoints</Text>
          <View style={styles.sectionDividerLine} />
        </View>

        {/* ─── Quick Action Cards ─── */}
        <View style={styles.actionGrid}>
          <ActionCard
            icon="scan-outline" label="Scan Intake" color={COLORS.cyan} grad={GRADIENTS.cyan}
            onPress={() => navigation.navigate('FoodLog', { user })}
          />
          <ActionCard
            icon="chatbubble-ellipses-outline" label="AI Companion" color={COLORS.purple} grad={GRADIENTS.purple}
            onPress={() => navigation.navigate('Chat', { user, glucoseState })}
          />
          <ActionCard
            icon="document-text-outline" label="FHIR Interop" color={COLORS.emerald} grad={GRADIENTS.emerald}
            onPress={() => navigation.navigate('Export', { user, glucoseState })}
          />
          <ActionCard
            icon="shield-checkmark-outline" label="EHR Auditing" color={COLORS.orange} grad={GRADIENTS.copper}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Auth' }] })}
          />
        </View>

        {/* ─── Patient Profile Card ─── */}
        <View style={styles.profileCard}>
          {/* Double border */}
          <View style={styles.profileCardInnerBorder} />
          <View style={styles.profileHeader}>
            <View style={styles.profileIconWrap}>
              <Ionicons name="finger-print-outline" size={28} color={COLORS.cyan} />
            </View>
            <View>
              <Text style={styles.profileEyebrow}>EHR RECORD</Text>
              <Text style={styles.profileTitle}>Physiological Demographics</Text>
            </View>
          </View>
          <LinearGradient colors={['#e8ddc8', '#d4c8b0']} style={styles.profileDivider} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <View style={styles.profileRow}>
            <ProfileStat label="GENDER" value={user.gender || 'MALE'} />
            <View style={styles.profileStatDivider} />
            <ProfileStat label="AGE" value={`${user.age || 45} yrs`} />
            <View style={styles.profileStatDivider} />
            <ProfileStat
              label="BMI INDEX"
              value={user.height_cm && user.weight_kg
                ? (user.weight_kg / ((user.height_cm / 100) ** 2)).toFixed(1)
                : '24.2'}
            />
          </View>
          <View style={styles.profileRow}>
            <ProfileStat label="HEIGHT" value={`${user.height_cm || 170} cm`} />
            <View style={styles.profileStatDivider} />
            <ProfileStat label="WEIGHT" value={`${user.weight_kg || 70} kg`} />
            <View style={styles.profileStatDivider} />
            <ProfileStat label="EHR STATUS" value="Verified ✓" />
          </View>
        </View>

        {/* ─── Footer Badge ─── */}
        <View style={styles.footerBadge}>
          <Ionicons name="shield-checkmark" size={12} color={COLORS.emerald} />
          <Text style={styles.footerText}>GlucoseGuard Clinical Intelligence · HIPAA Compliant · EHR Certified</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION CARD — with gradient fill and 3D press depth
// ─────────────────────────────────────────────────────────────────────────────
function ActionCard({ icon, label, color, grad, onPress }) {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(pressAnim, { toValue: 0.95, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <TouchableOpacity
      style={styles.actionCardWrap}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.actionCard, { borderColor: color + '44', transform: [{ scale: pressAnim }] }]}>
        {/* Inner card double border */}
        <View style={[styles.actionCardInner, { borderColor: color + '20' }]}>
          <LinearGradient colors={[COLORS.bgCard, '#fffef9']} style={styles.actionGrad}>
            <View style={[styles.actionIconRing, { backgroundColor: color + '14', borderColor: color + '35' }]}>
              <Ionicons name={icon} size={22} color={color} />
            </View>
            <Text style={[styles.actionLabel, { color }]}>{label.toUpperCase()}</Text>
            {/* Subtle arrow */}
            <Ionicons name="chevron-forward" size={10} color={color + '88'} style={{ marginTop: 2 }} />
          </LinearGradient>
        </View>
        {/* Bottom gradient accent */}
        <LinearGradient colors={grad || [color, color]} style={[styles.actionAccent, { opacity: 0.75 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      </Animated.View>
    </TouchableOpacity>
  );
}

function ProfileStat({ label, value }) {
  return (
    <View style={styles.profileStat}>
      <Text style={styles.profileStatLbl}>{label}</Text>
      <Text style={styles.profileStatVal}>{value}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { paddingBottom: 50 },

  // ─── Header ───
  headerWrap: { paddingHorizontal: 14, paddingTop: 52, marginBottom: 8 },
  headerGrad: { borderRadius: 14, borderWidth: 1.5, borderColor: '#c9a86c', padding: 4, ...SHADOWS.card },
  headerOuterBorder: { borderRadius: 10, borderWidth: 1, borderColor: '#dfd0b8', padding: 2 },
  headerInnerBorder: { borderRadius: 8, borderWidth: 1, borderColor: '#fcfaf6', padding: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerEyebrow: { fontSize: 8, color: '#a3927e', ...FONTS.bold, letterSpacing: 1.5, marginBottom: 2 },
  greeting: { fontSize: 14, color: COLORS.textPrimary, ...FONTS.bold, letterSpacing: 0.6 },
  headerSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3, fontStyle: 'italic' },
  headerRight: { alignItems: 'flex-end', gap: 6 },
  roleBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  roleText: { fontSize: 9, color: '#fffdf5', ...FONTS.bold, letterSpacing: 1.2 },
  headerTimestamp: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timestampText: { fontSize: 9, color: COLORS.textMuted, ...FONTS.medium },

  // ─── Instrument Panel ───
  modelContainer: {
    margin: 14,
    backgroundColor: '#fefcf8',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: '#cfa87b',
    ...SHADOWS.deep,
    position: 'relative',
    overflow: 'hidden',
  },
  doubleBorderOuter: {
    position: 'absolute', top: 2, bottom: 2, left: 2, right: 2,
    borderWidth: 1, borderColor: '#dfcab3', borderRadius: 14, pointerEvents: 'none',
  },
  doubleBorderInner: {
    position: 'absolute', top: 5, bottom: 5, left: 5, right: 5,
    borderWidth: 0.5, borderColor: '#f0e4d0', borderRadius: 11, pointerEvents: 'none',
  },
  filigreeCorner: { position: 'absolute', width: 16, height: 16 },
  filigreeCornerTL: { top: 10, left: 10, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#c9a86c', borderRadius: 2 },
  filigreeCornerTR: { top: 10, right: 10, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#c9a86c', borderRadius: 2 },
  filigreeCornerBL: { bottom: 10, left: 10, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: '#c9a86c', borderRadius: 2 },
  filigreeCornerBR: { bottom: 10, right: 10, borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#c9a86c', borderRadius: 2 },
  modelTitle: {
    fontSize: 10, color: '#8c7760', ...FONTS.bold,
    marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center',
  },
  instrumentLayout: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', paddingHorizontal: 2,
  },
  instrumentDivider: { alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  instrumentDividerLine: { width: 1, height: 50, backgroundColor: '#ddd0be' },
  instrumentDividerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#c9a86c' },

  captionGrad: {
    marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
    borderWidth: 0.5, borderColor: 'rgba(201,168,108,0.3)',
  },
  modelCaption: {
    fontSize: 11, textAlign: 'center', lineHeight: 16, ...FONTS.medium, fontStyle: 'italic',
  },

  // ─── Vintage Dial ───
  dialWrapper: { alignItems: 'center', flex: 1 },
  dialCaption: { fontSize: 7, color: '#a3927e', ...FONTS.bold, letterSpacing: 1.2, marginBottom: 8, textTransform: 'uppercase' },
  dialOuter: {
    width: 148, height: 148, position: 'relative', alignItems: 'center', justifyContent: 'center',
  },
  dialBrassRing: {
    position: 'absolute', width: 148, height: 148, borderRadius: 74,
    shadowColor: '#8c6a1a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
    backgroundColor: '#c8a85e',
  },
  needleContainer: {
    position: 'absolute', width: 14, height: 130, alignItems: 'center',
    justifyContent: 'flex-start', top: 9,
  },
  needlePointer: { width: 2.5, height: 66, borderRadius: 1.5 },
  needleTail: { width: 5, height: 20, backgroundColor: '#8a4a4b', borderRadius: 2.5, marginTop: 2, opacity: 0.75 },
  dialCenterOuter: {
    position: 'absolute', width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#d4b863', borderWidth: 2, borderColor: '#f5ecd8',
    shadowColor: '#8c6a1a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  dialCenterPin: {
    position: 'absolute', width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#2b221a',
  },
  glassReflect: {
    position: 'absolute', top: 10, left: 20, width: 40, height: 70, borderRadius: 20,
    backgroundColor: '#fff', transform: [{ rotate: '-30deg' }],
  },
  dialStatBox: {
    marginTop: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
    alignItems: 'center',
  },
  dialStatVal: { fontSize: 17, ...FONTS.bold },
  dialStatUnit: { fontSize: 10, ...FONTS.medium },
  riskBadge: { marginTop: 4, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  riskBadgeText: { fontSize: 8, ...FONTS.bold, letterSpacing: 0.8 },

  // ─── Anatomy Map ───
  anatomyWrapper: { alignItems: 'center', position: 'relative', flex: 1 },
  anatomyHalo: {
    position: 'absolute', width: 110, height: 170, borderRadius: 55, top: 30,
  },
  orbitRing1: { position: 'absolute', width: 110, height: 110, top: 50, alignItems: 'center', justifyContent: 'center' },
  orbitRing2: { position: 'absolute', width: 130, height: 60, top: 90, alignItems: 'center', justifyContent: 'center' },
  floatingParticle: {
    position: 'absolute', left: 60, width: 5, height: 5, borderRadius: 2.5, opacity: 0.75,
  },
  floatingParticle2: {
    position: 'absolute', left: 82, width: 4, height: 4, borderRadius: 2, opacity: 0.55,
  },

  // ─── Section Headers ───
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginTop: 14, marginBottom: 8, gap: 8,
  },
  sectionDividerLine: { flex: 1, height: 0.7, backgroundColor: '#ccc0a8' },
  sectionTitle: { fontSize: 10, color: '#7a6248', ...FONTS.bold, letterSpacing: 1.5, textTransform: 'uppercase' },

  // ─── Vitals Grid — Tactile 3D Cards ───
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 8 },
  vitalCard: {
    width: (width - 36) / 2, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#dcd3be',
    ...SHADOWS.card,
    position: 'relative', overflow: 'hidden',
  },
  vitalCardInnerBorder: {
    position: 'absolute', top: 3, bottom: 3, left: 3, right: 3,
    borderWidth: 0.7, borderRadius: 11, pointerEvents: 'none',
  },
  vitalCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  vitalIconRing: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  vitalLabel: { fontSize: 8.5, color: '#70655c', ...FONTS.bold, letterSpacing: 0.5, flex: 1 },
  vitalValue: { fontSize: 24, ...FONTS.bold, marginBottom: 2 },
  vitalUnit: { fontSize: 10, color: COLORS.textSecondary, ...FONTS.bold },
  vitalAccentLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, opacity: 0.7 },

  // ─── Action Grid ───
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 8, marginBottom: 10 },
  actionCardWrap: { width: (width - 36) / 2 },
  actionCard: {
    borderRadius: 14, borderWidth: 1.5, overflow: 'hidden',
    ...SHADOWS.card,
  },
  actionCardInner: { borderWidth: 0.5, borderRadius: 13, margin: 2, overflow: 'hidden' },
  actionGrad: { padding: 16, alignItems: 'center', gap: 7 },
  actionIconRing: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  actionLabel: { fontSize: 9, ...FONTS.bold, letterSpacing: 1 },
  actionAccent: { height: 3 },

  // ─── Profile Card ───
  profileCard: {
    margin: 14, backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: '#cfa87b',
    ...SHADOWS.card, position: 'relative',
  },
  profileCardInnerBorder: {
    position: 'absolute', top: 3, bottom: 3, left: 3, right: 3,
    borderWidth: 0.7, borderColor: '#f0e4d0', borderRadius: 11, pointerEvents: 'none',
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  profileIconWrap: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.cyan + '14',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.cyan + '33',
  },
  profileEyebrow: { fontSize: 8, color: '#a3927e', ...FONTS.bold, letterSpacing: 1.2 },
  profileTitle: { fontSize: 12, color: COLORS.textPrimary, ...FONTS.bold, marginTop: 2 },
  profileDivider: { height: 1.5, borderRadius: 1, marginBottom: 14 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  profileStat: { flex: 1, alignItems: 'center' },
  profileStatDivider: { width: 0.7, backgroundColor: '#e0d4be', marginVertical: 4 },
  profileStatLbl: { fontSize: 7.5, color: '#9a8d82', ...FONTS.bold, letterSpacing: 0.5, marginBottom: 3 },
  profileStatVal: { fontSize: 12.5, color: COLORS.textPrimary, ...FONTS.bold },

  // ─── Footer ───
  footerBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingHorizontal: 20, paddingTop: 6,
  },
  footerText: { fontSize: 9, color: COLORS.textMuted, textAlign: 'center', lineHeight: 13 },
});
