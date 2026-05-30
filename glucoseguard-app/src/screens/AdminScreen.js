import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, StatusBar, Dimensions, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';
import { COLORS, FONTS, GRADIENTS } from '../theme';
import { adminAPI } from '../api';

const { width } = Dimensions.get('window');

// Vintage ornamental divider SVG
function OrnamentalDivider() {
  return (
    <Svg width={width - 64} height={12} viewBox={`0 ${(width - 64) / 2} 12`} style={{ alignSelf: 'center', marginVertical: 8 }}>
      <Line x1="0" y1="6" x2={(width - 100) / 2} y2="6" stroke="#dcd3be" strokeWidth="1" />
      <Circle cx={(width - 64) / 2} cy="6" r="3" fill="none" stroke="#caa06d" strokeWidth="1" />
      <Line x1={(width - 64) / 2 + 5} y1="6" x2={width - 64} y2="6" stroke="#dcd3be" strokeWidth="1" />
    </Svg>
  );
}

export default function AdminScreen({ route, navigation }) {
  const user = route.params?.user || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('patients');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.dashboard();
      if (res.success) {
        setData(res);
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      }
    } catch (e) { }
    setLoading(false);
  };

  const stats = data?.stats || {};
  const patients = data?.patients || [];
  const logs = data?.logs || [];

  const STAT_CARDS = [
    { label: 'Patient Count', value: stats.patient_count || 0, color: COLORS.cyan, icon: 'people-outline' },
    { label: 'Total Logs', value: stats.total_logs || 0, color: COLORS.emerald, icon: 'document-text-outline' },
    { label: 'Avg Peak', value: stats.avg_peak ? `${stats.avg_peak}` : '--', unit: 'mg/dL', color: COLORS.orange, icon: 'trending-up-outline' },
    { label: 'Critical Cases', value: stats.critical_count || 0, color: COLORS.red, icon: 'warning-outline' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" />

      {/* Vintage Admin Header */}
      <LinearGradient colors={GRADIENTS.header} style={styles.header}>
        <View style={styles.headerInner}>
          <View>
            <Text style={styles.headerTitle}>Clinician Audit Portal</Text>
            <Text style={styles.headerSub}>EHR CENTRAL CONTROL · {user.name?.toUpperCase()}</Text>
          </View>
          <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
            <Ionicons name="refresh-outline" size={16} color={COLORS.cyan} />
          </TouchableOpacity>
        </View>
        {/* Ornamental accent line */}
        <View style={styles.headerAccentLine}>
          <View style={styles.accentLine} />
          <Ionicons name="shield-checkmark-outline" size={12} color="#caa06d" />
          <View style={styles.accentLine} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.cyan} />
          <Text style={styles.loaderText}>Loading EHR Data...</Text>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView contentContainerStyle={styles.scroll}>

            {/* Stats Grid — Vintage instrument panels */}
            <Text style={styles.sectionTitle}>Clinical Statistics</Text>
            <View style={styles.statsGrid}>
              {STAT_CARDS.map((s, i) => (
                <View key={i} style={[styles.statCard, { borderColor: s.color + '44' }]}>
                  <View style={[styles.statIconRing, { backgroundColor: s.color + '14', borderColor: s.color + '33' }]}>
                    <Ionicons name={s.icon} size={18} color={s.color} />
                  </View>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}{s.unit ? <Text style={styles.statUnit}> {s.unit}</Text> : ''}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Tabs — Vintage file folder style */}
            <View style={styles.tabs}>
              <TouchableOpacity style={[styles.tab, tab === 'patients' && styles.tabActive]} onPress={() => setTab('patients')}>
                <Ionicons name="people-outline" size={15} color={tab === 'patients' ? COLORS.cyan : COLORS.textMuted} />
                <Text style={[styles.tabText, tab === 'patients' && { color: COLORS.cyan }]}>Patient Database</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, tab === 'logs' && styles.tabActive]} onPress={() => setTab('logs')}>
                <Ionicons name="list-outline" size={15} color={tab === 'logs' ? COLORS.emerald : COLORS.textMuted} />
                <Text style={[styles.tabText, tab === 'logs' && { color: COLORS.emerald }]}>Audit Logs</Text>
              </TouchableOpacity>
            </View>

            {/* Patient Database */}
            {tab === 'patients' && (
              <View>
                <Text style={styles.sectionTitle}>Admin Dataset — All Registered Patients</Text>
                {patients.length === 0 ? (
                  <View style={styles.empty}>
                    <Ionicons name="people-outline" size={40} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>No patients registered yet.</Text>
                  </View>
                ) : patients.map((p) => {
                  const bmi = p.height_cm && p.weight_kg ? (p.weight_kg / ((p.height_cm / 100) ** 2)).toFixed(1) : '--';
                  return (
                    <View key={p.id} style={styles.patientCard}>
                      <View style={styles.patientHeader}>
                        {/* Vintage avatar */}
                        <LinearGradient colors={['#dcd3be', '#c8b99c']} style={styles.patientAvatar}>
                          <View style={styles.patientAvatarInner}>
                            <Text style={styles.patientAvatarText}>{p.name?.[0] || 'P'}</Text>
                          </View>
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.patientName}>{p.name}</Text>
                          <Text style={styles.patientMeta}>@{p.username} · Record #{p.id}</Text>
                        </View>
                        <View style={[styles.bmiBadge, { borderColor: parseFloat(bmi) > 30 ? COLORS.red + '55' : COLORS.cyan + '44' }]}>
                          <Text style={[styles.bmiText, { color: parseFloat(bmi) > 30 ? COLORS.red : COLORS.cyan }]}>BMI {bmi}</Text>
                        </View>
                      </View>
                      <View style={styles.patientDivider} />
                      <View style={styles.patientStats}>
                        <PatientStat label="Age" value={p.age} />
                        <PatientStat label="Gender" value={p.gender} />
                        <PatientStat label="Height" value={`${p.height_cm}cm`} />
                        <PatientStat label="Weight" value={`${p.weight_kg}kg`} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Audit Logs */}
            {tab === 'logs' && (
              <View>
                <Text style={styles.sectionTitle}>User Dataset — All Intake Audit Logs</Text>
                {logs.length === 0 ? (
                  <View style={styles.empty}>
                    <Ionicons name="document-text-outline" size={40} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>No intake logs yet.</Text>
                  </View>
                ) : logs.map((log) => {
                  const riskColor = log.risk_level === 'CRITICAL' ? COLORS.red : log.risk_level === 'HIGH' ? COLORS.orange : log.risk_level === 'MODERATE' ? COLORS.yellow : COLORS.emerald;
                  return (
                    <View key={log.id} style={[styles.logCard, { borderLeftColor: riskColor }]}>
                      <View style={styles.logHeader}>
                        <Text style={styles.logPatient}>{log.patient_name}</Text>
                        <View style={[styles.riskTag, { backgroundColor: riskColor + '18', borderColor: riskColor + '44' }]}>
                          <Text style={[styles.riskTagText, { color: riskColor }]}>{log.risk_level || 'LOW'}</Text>
                        </View>
                      </View>
                      <Text style={styles.logFood} numberOfLines={1}>{log.food_name}</Text>
                      <View style={styles.logStats}>
                        <LogStat label="Peak" value={`${log.projected_peak} mg/dL`} color={riskColor} />
                        <LogStat label="Sugar" value={`${log.sugar_g}g`} color={COLORS.yellow} />
                        <LogStat label="HR" value={`${log.vital_heart_rate} bpm`} color={COLORS.purple} />
                        <LogStat label="Crit." value={`${log.criticality_score || '--'}`} color={riskColor} />
                      </View>
                      <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleString()}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

function PatientStat({ label, value }) {
  return (
    <View style={styles.pStat}>
      <Text style={styles.pStatVal}>{value}</Text>
      <Text style={styles.pStatLabel}>{label}</Text>
    </View>
  );
}

function LogStat({ label, value, color }) {
  return (
    <View style={styles.lStat}>
      <Text style={[styles.lStatVal, { color }]}>{value}</Text>
      <Text style={styles.lStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 50, paddingBottom: 0 },
  headerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 20, color: COLORS.textPrimary, ...FONTS.bold },
  headerSub: { fontSize: 10, color: COLORS.textMuted, marginTop: 2, letterSpacing: 0.8 },
  refreshBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.cyan + '14', borderWidth: 1, borderColor: COLORS.cyan + '44', alignItems: 'center', justifyContent: 'center' },
  headerAccentLine: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8, gap: 6 },
  accentLine: { flex: 1, height: 1, backgroundColor: '#dcd3be' },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { color: COLORS.textMuted, fontSize: 13, fontStyle: 'italic' },
  scroll: { padding: 16, paddingBottom: 40 },

  sectionTitle: { fontSize: 10, color: COLORS.textSecondary, ...FONTS.bold, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  statCard: { width: (width - 48) / 2, backgroundColor: '#fffcf7', borderRadius: 14, padding: 16, borderWidth: 1, alignItems: 'center', shadowColor: '#5c483a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statIconRing: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 8 },
  statValue: { fontSize: 26, ...FONTS.bold },
  statUnit: { fontSize: 13, ...FONTS.regular },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },

  // Tabs
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: '#dcd3be', backgroundColor: '#fffcf7' },
  tabActive: { borderColor: COLORS.cyan + '66', backgroundColor: '#f0f8f7' },
  tabText: { fontSize: 12, color: COLORS.textMuted, ...FONTS.semibold },

  // Patient cards
  patientCard: { backgroundColor: '#fffcf7', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#dcd3be', marginBottom: 10, shadowColor: '#5c483a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  patientHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  patientAvatar: { width: 44, height: 44, borderRadius: 22, padding: 2 },
  patientAvatarInner: { flex: 1, borderRadius: 20, backgroundColor: '#fffcf7', alignItems: 'center', justifyContent: 'center' },
  patientAvatarText: { color: COLORS.textPrimary, ...FONTS.bold, fontSize: 18 },
  patientName: { fontSize: 14, color: COLORS.textPrimary, ...FONTS.bold },
  patientMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  bmiBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  bmiText: { fontSize: 11, ...FONTS.bold },
  patientDivider: { height: 1, backgroundColor: '#e6dbca', marginVertical: 10 },
  patientStats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#faf6ee', borderRadius: 8, padding: 10 },
  pStat: { alignItems: 'center' },
  pStatVal: { fontSize: 13, color: COLORS.textPrimary, ...FONTS.semibold },
  pStatLabel: { fontSize: 9, color: COLORS.textMuted, marginTop: 2 },

  // Log cards
  logCard: { backgroundColor: '#fffcf7', borderRadius: 12, padding: 13, borderWidth: 1, borderColor: '#dcd3be', borderLeftWidth: 3, marginBottom: 8 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  logPatient: { fontSize: 13, color: COLORS.textPrimary, ...FONTS.semibold },
  riskTag: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 },
  riskTagText: { fontSize: 9, ...FONTS.bold },
  logFood: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 10 },
  logStats: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#faf6ee', borderRadius: 8, padding: 10, marginBottom: 6 },
  lStat: { alignItems: 'center' },
  lStatVal: { fontSize: 12, ...FONTS.bold },
  lStatLabel: { fontSize: 9, color: COLORS.textMuted, marginTop: 2 },
  logTime: { fontSize: 9, color: COLORS.textMuted, fontStyle: 'italic' },

  empty: { alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
});
