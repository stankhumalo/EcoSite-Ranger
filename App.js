import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, StatusBar } from 'react-native';
import { getReports, createReport, updateReport, deleteReport } from './src/storage/reportStorage';
import ReportForm from './src/components/ReportForm';
import ReportCard from './src/components/ReportCard';

export default function App() {
  const [reports, setReports] = useState([]);
  const [editingReport, setEditingReport] = useState(null);

  // Load persisted reports when app starts
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const saved = await getReports();
    setReports(saved);
  };

  const handleFormSubmit = async (formData) => {
    if (editingReport) {
      const updated = await updateReport(editingReport.id, formData);
      setReports(updated);
      setEditingReport(null);
    } else {
      const updated = await createReport(formData);
      setReports(updated);
    }
  };

  const handleToggleStatus = async (id, newStatus) => {
    const updated = await updateReport(id, { status: newStatus });
    setReports(updated);
  };

  const handleDelete = async (id) => {
    const updated = await deleteReport(id);
    setReports(updated);
    if (editingReport?.id === id) setEditingReport(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B4332" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>EcoSite Ranger</Text>
        <Text style={styles.headerSub}>Field Incident & Maintenance Log</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ReportForm
          onSubmit={handleFormSubmit}
          editingReport={editingReport}
          onCancelEdit={() => setEditingReport(null)}
        />

        <Text style={styles.sectionTitle}>Saved Field Logs ({reports.length})</Text>
        {reports.length === 0 ? (
          <Text style={styles.emptyText}>No incidents logged yet. Add one above.</Text>
        ) : (
          reports.map((item) => (
            <ReportCard
              key={item.id}
              report={item}
              onToggleStatus={handleToggleStatus}
              onEdit={setEditingReport}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#1B4332', padding: 18, paddingTop: 24 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: '#B7E4C7', marginTop: 2 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 10 },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 20, fontSize: 14 },
});