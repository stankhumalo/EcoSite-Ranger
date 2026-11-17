// Demonstrates JSON upload/sync to a REST endpoint (JSONPlaceholder test server)
const SYNC_ENDPOINT = 'https://jsonplaceholder.typicode.com/posts';

export const syncReportsToServer = async (reports, isConnected) => {
  if (!isConnected) {
    throw new Error('Device is offline. Reports remain queued in local storage.');
  }

  const pendingReports = reports.filter((r) => r.syncStatus !== 'Synced');
  if (pendingReports.length === 0) {
    return { syncedIds: [], message: 'All reports are already synced.' };
  }

  const syncedIds = [];

  for (const report of pendingReports) {
    const payload = {
      id: report.id,
      title: report.title,
      category: report.category,
      recipient: report.recipient,
      recipientPhone: report.recipientPhone || null,
      createdAt: report.createdAt,
      location: report.location || null,
      orientation: report.orientation || null,
      notes: report.notes || '',
      hasPhoto: Boolean(report.photoUri),
    };

    const response = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    syncedIds.push(report.id);
  }

  return {
    syncedIds,
    message: `Successfully synced ${syncedIds.length} report(s) as JSON to server.`,
  };
};