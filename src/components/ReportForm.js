import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const CATEGORIES = [
  { label: 'Wildlife', recipient: 'Environmental Team' },
  { label: 'Fly-tipping', recipient: 'Waste & Grounds' },
  { label: 'Fault', recipient: 'Estates Maintenance' },
  { label: 'Maintenance', recipient: 'Site Operations' },
];

export default function ReportForm({ onSubmit, editingReport, onCancelEdit }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Fault');
  const [notes, setNotes] = useState('');

  // Populate form when updating an existing report
  useEffect(() => {
    if (editingReport) {
      setTitle(editingReport.title);
      setCategory(editingReport.category);
      setNotes(editingReport.notes);
    } else {
      setTitle('');
      setCategory('Fault');
      setNotes('');
    }
  }, [editingReport]);

  const handleSave = () => {
    if (!title.trim()) return;
    const selectedCat = CATEGORIES.find((c) => c.label === category);
    onSubmit({
      title: title.trim(),
      category,
      recipient: selectedCat ? selectedCat.recipient : 'General Ops',
      notes: notes.trim(),
    });
    if (!editingReport) {
      setTitle('');
      setNotes('');
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>
        {editingReport ? 'Edit Site Report' : 'Log New Site Incident'}
      </Text>

      <Text style={styles.label}>Incident Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Fallen tree blocking North Trail"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Category (Auto-Routes Department)</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.label}
            style={[
              styles.chip,
              category === cat.label && styles.chipSelected,
            ]}
            onPress={() => setCategory(cat.label)}
          >
            <Text
              style={[
                styles.chipText,
                category === cat.label && styles.chipTextSelected,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Field Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe hazard severity, species, or access details..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>
            {editingReport ? 'Update Report' : 'Save Report'}
          </Text>
        </TouchableOpacity>

        {editingReport && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancelEdit}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  heading: { fontSize: 18, fontWeight: '700', color: '#1B4332', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#F9FAFB',
  },
  textArea: { height: 75, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  chipSelected: { backgroundColor: '#2D6A4F' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  chipTextSelected: { color: '#FFFFFF' },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  saveBtn: {
    flex: 1,
    backgroundColor: '#2D6A4F',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
  },
  cancelBtnText: { color: '#374151', fontWeight: '600' },
});