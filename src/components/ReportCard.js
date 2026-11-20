import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking, Alert, StyleSheet } from 'react-native';
import { sendIncidentSms } from '../utils/sendIncidentSms';

export default function ReportCard({ report, onToggleStatus, onEdit, onDelete }) {
  const isResolved = report.status === 'Resolved';
  const isSynced = report.syncStatus === 'Synced';

  const confirmDelete = () => {
    Alert.alert(
      'Delete Field Log',
      `Are you sure you want to permanently delete "${report.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(report.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.card, isResolved && styles.cardResolved]}>
      <View style={styles.headerRow}>
        <Text style={styles.categoryBadge}>{report.category}</Text>
        <View style={styles.badgeGroup}>
          <Text style={[styles.syncBadge, isSynced ? styles.synced : styles.pending]}>
            {report.syncStatus || 'Pending'}
          </Text>
          <Text style={[styles.statusBadge, isResolved ? styles.resolved : styles.open]}>
            {report.status}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>{report.title}</Text>
      <Text style={styles.meta}>
        To: {report.recipient} • {new Date(report.createdAt).toLocaleString()}
      </Text>

      <View style={styles.gpsRow}>
        {report.location && !report.location.error && (
          <>
            <Text style={styles.gpsBadge}>
              GPS: {report.location.latitude}, {report.location.longitude}
            </Text>
            {report.location.mapURL && report.location.mapURL !== '#' && (
              <TouchableOpacity onPress={() => Linking.openURL(report.location.mapURL)}>
                <Text style={styles.linkText}>(map)</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <TouchableOpacity onPress={() => sendIncidentSms(report)}>
          <Text style={styles.linkText}>(sms alert)</Text>
        </TouchableOpacity>
      </View>

      {report.orientation && (
        <Text style={styles.sensorBadge}>
          Compass: {report.orientation.heading}° {report.orientation.cardinal} • Pitch:{' '}
          {report.orientation.pitchLabel} ({report.orientation.tiltDegrees}°)
        </Text>
      )}

      {report.photoUri && (
        <Image source={{ uri: report.photoUri }} style={styles.cardImage} />
      )}

      {report.notes ? <Text style={styles.notes}>{report.notes}</Text> : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onToggleStatus(report.id, isResolved ? 'Open' : 'Resolved')}
        >
          <Text style={styles.actionText}>
            {isResolved ? 'Reopen' : 'Mark Resolved'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(report)}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => onDelete(report.id)}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#D97706',
    elevation: 1,
  },
  cardResolved: { borderLeftColor: '#10B981', opacity: 0.88 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  badgeGroup: { flexDirection: 'row', gap: 6 },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B4332',
    backgroundColor: '#D8F3DC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  syncBadge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  synced: { backgroundColor: '#E0E7FF', color: '#3730A3' },
  pending: { backgroundColor: '#F3F4F6', color: '#4B5563' },
  statusBadge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  open: { backgroundColor: '#FEF3C7', color: '#B45309' },
  resolved: { backgroundColor: '#D1FAE5', color: '#065F46' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  meta: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  gpsBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sensorBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5B21B6',
    backgroundColor: '#EDE9FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  linkText: { fontSize: 12, fontWeight: '700', color: '#1D4ED8', textDecorationLine: 'underline' },
  cardImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 8, resizeMode: 'cover' },
  notes: { fontSize: 14, color: '#374151', marginBottom: 10 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  actionText: { fontSize: 12, fontWeight: '600', color: '#1F2937' },
  deleteBtn: { backgroundColor: '#FEE2E2', marginLeft: 'auto' },
  deleteText: { fontSize: 12, fontWeight: '600', color: '#B91C1C' },
});