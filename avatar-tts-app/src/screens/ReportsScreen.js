import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { coursesAPI } from '../services/api';

export default function ReportsScreen({ route, navigation }) {
  const { courseId, courseTitle } = route.params;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getReports(courseId);
      if (response.data.success) {
        setReports(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 90) return '#4CAF50';
    if (accuracy >= 70) return '#FF9800';
    return '#F44336';
  };

  const getAccuracyLabel = (accuracy) => {
    if (accuracy >= 90) return 'Excellent';
    if (accuracy >= 70) return 'Good';
    return 'Needs Practice';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{courseTitle} - Reports</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reports yet</Text>
            <Text style={styles.emptySubtext}>
              Practice pronunciation in the Home tab to generate reports
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>📊 Statistics</Text>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{reports.length}</Text>
                  <Text style={styles.statLabel}>Total Sessions</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>
                    {reports.length > 0
                      ? (
                          reports.reduce((sum, r) => sum + (r.accuracy || 0), 0) /
                          reports.length
                        ).toFixed(1)
                      : '0'}
                    %
                  </Text>
                  <Text style={styles.statLabel}>Avg Accuracy</Text>
                </View>
              </View>
            </View>

            {reports.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <Text style={styles.reportTitle}>
                    Accuracy: {report.accuracy?.toFixed(1)}%
                  </Text>
                  <View
                    style={[
                      styles.accuracyBadge,
                      { backgroundColor: getAccuracyColor(report.accuracy) },
                    ]}
                  >
                    <Text style={styles.accuracyText}>
                      {getAccuracyLabel(report.accuracy)}
                    </Text>
                  </View>
                </View>

                <View style={styles.reportContent}>
                  <Text style={styles.reportLabel}>Reference Text:</Text>
                  <Text style={styles.reportText}>{report.reference_text}</Text>

                  <Text style={styles.reportLabel}>Your Pronunciation:</Text>
                  <Text style={styles.reportText}>{report.transcribed_text}</Text>

                  {report.incorrect_words &&
                    report.incorrect_words.length > 0 && (
                      <>
                        <Text style={styles.reportLabel}>Incorrect Words:</Text>
                        <Text style={styles.incorrectWords}>
                          {report.incorrect_words.join(', ')}
                        </Text>
                      </>
                    )}

                  {report.audio_duration && (
                    <Text style={styles.reportMeta}>
                      Duration: {report.audio_duration}s
                    </Text>
                  )}

                  {report.created_at && (
                    <Text style={styles.reportMeta}>
                      Date: {new Date(report.created_at).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  backButton: {
    color: '#0ea5e9',
    fontSize: 16,
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0ea5e9',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#94a3b8',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#16213e',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  reportCard: {
    backgroundColor: '#16213e',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  accuracyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  accuracyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reportContent: {
    marginTop: 10,
  },
  reportLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginTop: 10,
    marginBottom: 5,
  },
  reportText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 10,
    lineHeight: 20,
  },
  incorrectWords: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
    marginBottom: 10,
  },
  reportMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 5,
  },
});

