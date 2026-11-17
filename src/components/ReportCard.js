import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ReportCard({ report, onToggleStatus, onEdit, onDelete }) {
  const isResolved = report.status === 'Resolved';

  return (
    <View style={[styles.card, isResolved && styles.cardResolved]}>
      <View style={styles.headerRow}>
        <Text style={styles.categoryBadge}>{report.category}</Text>
        <Text style={[styles.statusBadge, isResolved ? styles.resolved : styles.open]}>
          {report.status}
        </Text>
      </View>

      <Text style={styles.title}>{report.title}</Text>
      <Text style={styles.meta}>
        Routed to: {report.recipient} • {new Date(report.createdAt).toLocaleString()}
      </Text>

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
  cardResolved: { borderLeftColor: '#10B981', opacity: 0.85 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B4332',
    backgroundColor: '#D8F3DC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  open: { backgroundColor: '#FEF3C7', color: '#B45309' },
  resolved: { backgroundColor: '#D1FAE5', color: '#065F46' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  meta: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
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