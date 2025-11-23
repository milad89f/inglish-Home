import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { llmAPI, coursesAPI } from '../services/api';
import { authAPI } from '../services/api';

export default function LLMFeaturesScreen() {
  const [loading, setLoading] = useState(false);
  const [membership, setMembership] = useState('free');
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [reportResult, setReportResult] = useState(null);
  const [sentencesResult, setSentencesResult] = useState(null);
  
  // Sentences generation inputs
  const [sentenceTopic, setSentenceTopic] = useState('general');
  const [sentenceLevel, setSentenceLevel] = useState('beginner');
  const [sentenceCount, setSentenceCount] = useState(10);
  const [sentenceLanguage, setSentenceLanguage] = useState('en');

  useEffect(() => {
    loadUserInfo();
    loadCourses();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userInfo = await authAPI.getStoredUserInfo();
      setMembership(userInfo.membership || 'free');
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const loadCourses = async () => {
    try {
      const userInfo = await authAPI.getStoredUserInfo();
      if (userInfo.id) {
        const response = await coursesAPI.getUserCourses(userInfo.id);
        if (response.data.success) {
          setCourses(response.data.data || []);
          if (response.data.data.length > 0) {
            setSelectedCourseId(response.data.data[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleGenerateAnalysis = async () => {
    if (membership !== 'premium') {
      Alert.alert(
        'Premium Required',
        'This feature requires a premium membership. Please upgrade to access AI-powered analysis.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setLoading(true);
      setAnalysisResult(null);

      // Example report data - in real app, get from user's actual performance
      const reportData = {
        total_sessions: 15,
        avg_accuracy: 85.5,
        improvement_rate: 12.3,
        time_spent: 120,
      };

      const response = await llmAPI.generateAnalysis(reportData);

      if (response.data.success) {
        setAnalysisResult(response.data.data);
        Alert.alert('Success', 'Analysis generated successfully!');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to generate analysis');
      }
    } catch (error) {
      console.error('Error generating analysis:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to generate analysis';
      
      if (error.response?.status === 403) {
        Alert.alert(
          'Premium Required',
          'This feature requires a premium membership. Please upgrade to access this feature.'
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (membership !== 'premium') {
      Alert.alert(
        'Premium Required',
        'This feature requires a premium membership. Please upgrade to access AI-powered reports.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!selectedCourseId) {
      Alert.alert('Error', 'Please select a course first');
      return;
    }

    try {
      setLoading(true);
      setReportResult(null);

      const performanceMetrics = {
        total_sessions: 20,
        avg_accuracy: 88.2,
        improvement_rate: 15.5,
        time_spent: 180,
        completed_subjects: 5,
      };

      const response = await llmAPI.generateReport(selectedCourseId, performanceMetrics);

      if (response.data.success) {
        setReportResult(response.data.data);
        Alert.alert('Success', 'Report generated successfully!');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to generate report';
      
      if (error.response?.status === 403) {
        Alert.alert(
          'Premium Required',
          'This feature requires a premium membership. Please upgrade to access this feature.'
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSentences = async () => {
    if (membership !== 'premium') {
      Alert.alert(
        'Premium Required',
        'This feature requires a premium membership. Please upgrade to access AI-powered sentence generation.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!selectedCourseId) {
      Alert.alert('Error', 'Please select a course first');
      return;
    }

    try {
      setLoading(true);
      setSentencesResult(null);

      const sentenceParams = {
        topic: sentenceTopic,
        level: sentenceLevel,
        count: sentenceCount,
        language: sentenceLanguage,
      };

      const response = await llmAPI.generateSentences(selectedCourseId, sentenceParams);

      if (response.data.success) {
        setSentencesResult(response.data.data);
        Alert.alert('Success', `${response.data.data.sentences.length} sentences generated successfully!`);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to generate sentences');
      }
    } catch (error) {
      console.error('Error generating sentences:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to generate sentences';
      
      if (error.response?.status === 403) {
        Alert.alert(
          'Premium Required',
          'This feature requires a premium membership. Please upgrade to access this feature.'
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderMembershipBadge = () => {
    const isPremium = membership === 'premium';
    return (
      <View
        style={[
          styles.membershipBadge,
          isPremium ? styles.premiumBadge : styles.freeBadge,
        ]}
      >
        <Text style={styles.membershipText}>
          {isPremium ? '⭐ Premium' : '🆓 Free'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>AI-Powered Features</Text>
          {renderMembershipBadge()}
        </View>

        {membership !== 'premium' && (
          <View style={styles.upgradeBanner}>
            <Text style={styles.upgradeText}>
              ⭐ Upgrade to Premium to unlock all AI features!
            </Text>
          </View>
        )}

        {/* Course Selection */}
        {courses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Course:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {courses.map((course) => (
                <TouchableOpacity
                  key={course.id}
                  style={[
                    styles.courseButton,
                    selectedCourseId === course.id && styles.courseButtonActive,
                  ]}
                  onPress={() => setSelectedCourseId(course.id)}
                >
                  <Text
                    style={[
                      styles.courseButtonText,
                      selectedCourseId === course.id && styles.courseButtonTextActive,
                    ]}
                  >
                    {course.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Generate Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Performance Analysis</Text>
          <Text style={styles.sectionDescription}>
            Get AI-powered insights about your learning performance
          </Text>
          <TouchableOpacity
            style={[
              styles.actionButton,
              membership !== 'premium' && styles.actionButtonDisabled,
            ]}
            onPress={handleGenerateAnalysis}
            disabled={loading || membership !== 'premium'}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Generate Analysis</Text>
            )}
          </TouchableOpacity>
          {analysisResult && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Analysis Result:</Text>
              <Text style={styles.resultText}>{analysisResult.analysis_text}</Text>
              <Text style={styles.resultMeta}>
                Generated at: {new Date(analysisResult.generated_at).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Generate Report */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Learning Report</Text>
          <Text style={styles.sectionDescription}>
            Generate comprehensive learning progress reports
          </Text>
          <TouchableOpacity
            style={[
              styles.actionButton,
              membership !== 'premium' && styles.actionButtonDisabled,
            ]}
            onPress={handleGenerateReport}
            disabled={loading || membership !== 'premium' || !selectedCourseId}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Generate Report</Text>
            )}
          </TouchableOpacity>
          {reportResult && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Report Result:</Text>
              <Text style={styles.resultText}>{reportResult.report_text}</Text>
              <Text style={styles.resultMeta}>
                Generated at: {new Date(reportResult.generated_at).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Generate Practice Sentences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Generate Practice Sentences</Text>
          <Text style={styles.sectionDescription}>
            Generate AI-powered practice sentences for pronunciation training
          </Text>

          <View style={styles.topicContainer}>
            <Text style={styles.label}>Topic:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.topicButtons}>
                {[
                  { key: 'general', label: 'General' },
                  { key: 'grammar', label: 'Grammar' },
                  { key: 'vocabulary', label: 'Vocabulary' },
                  { key: 'daily', label: 'Daily Conversations' },
                  { key: 'business', label: 'Business' },
                  { key: 'travel', label: 'Travel' },
                ].map((topic) => (
                  <TouchableOpacity
                    key={topic.key}
                    style={[
                      styles.topicButton,
                      sentenceTopic === topic.key && styles.topicButtonActive,
                    ]}
                    onPress={() => setSentenceTopic(topic.key)}
                  >
                    <Text
                      style={[
                        styles.topicButtonText,
                        sentenceTopic === topic.key && styles.topicButtonTextActive,
                      ]}
                    >
                      {topic.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.difficultyContainer}>
            <Text style={styles.label}>Level:</Text>
            <View style={styles.difficultyButtons}>
              {['beginner', 'intermediate', 'advanced'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.difficultyButton,
                    sentenceLevel === level && styles.difficultyButtonActive,
                  ]}
                  onPress={() => setSentenceLevel(level)}
                >
                  <Text
                    style={[
                      styles.difficultyButtonText,
                      sentenceLevel === level && styles.difficultyButtonTextActive,
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.countContainer}>
            <Text style={styles.label}>Number of Sentences:</Text>
            <View style={styles.countButtons}>
              {[5, 10, 15, 20].map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.countButton,
                    sentenceCount === count && styles.countButtonActive,
                  ]}
                  onPress={() => setSentenceCount(count)}
                >
                  <Text
                    style={[
                      styles.countButtonText,
                      sentenceCount === count && styles.countButtonTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.languageContainer}>
            <Text style={styles.label}>Language:</Text>
            <View style={styles.languageButtons}>
              {['en', 'tr'].map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.languageButton,
                    sentenceLanguage === lang && styles.languageButtonActive,
                  ]}
                  onPress={() => setSentenceLanguage(lang)}
                >
                  <Text
                    style={[
                      styles.languageButtonText,
                      sentenceLanguage === lang && styles.languageButtonTextActive,
                    ]}
                  >
                    {lang === 'en' ? '🇺🇸 English' : '🇹🇷 Türkçe'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              membership !== 'premium' && styles.actionButtonDisabled,
            ]}
            onPress={handleGenerateSentences}
            disabled={loading || membership !== 'premium' || !selectedCourseId}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Generate Sentences</Text>
            )}
          </TouchableOpacity>

          {sentencesResult && sentencesResult.sentences && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>
                Generated {sentencesResult.sentences.length} Sentences:
              </Text>
              <Text style={styles.resultMeta}>
                Topic: {sentenceTopic} | Level: {sentenceLevel} | Language: {sentenceLanguage}
              </Text>
              <ScrollView style={styles.sentencesList} nestedScrollEnabled>
                {sentencesResult.sentences.map((sentence, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.sentenceItem}
                    onPress={() => {
                      Clipboard.setString(sentence);
                      Alert.alert(
                        'Copied!',
                        'Sentence copied to clipboard. You can paste it in the text input to create a video.',
                        [{ text: 'OK' }]
                      );
                    }}
                  >
                    <Text style={styles.sentenceNumber}>{index + 1}.</Text>
                    <Text style={styles.sentenceText}>{sentence}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.resultMeta}>
                Generated at: {new Date(sentencesResult.generated_at).toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  membershipBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  premiumBadge: {
    backgroundColor: '#fbbf24',
  },
  freeBadge: {
    backgroundColor: '#64748b',
  },
  membershipText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  upgradeBanner: {
    backgroundColor: '#fbbf24',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  upgradeText: {
    color: '#1a1a2e',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 15,
  },
  courseButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    backgroundColor: '#16213e',
  },
  courseButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  courseButtonText: {
    color: '#0ea5e9',
    fontWeight: '600',
  },
  courseButtonTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#16213e',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    fontSize: 16,
  },
  difficultyContainer: {
    marginBottom: 15,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  difficultyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  difficultyButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  difficultyButtonText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '600',
  },
  difficultyButtonTextActive: {
    color: '#fff',
  },
  languageContainer: {
    marginBottom: 15,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  languageButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  languageButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  languageButtonText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '600',
  },
  languageButtonTextActive: {
    color: '#fff',
  },
  actionButton: {
    backgroundColor: '#0ea5e9',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  actionButtonDisabled: {
    backgroundColor: '#64748b',
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#16213e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 10,
  },
  resultSubjectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 10,
  },
  resultMeta: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 5,
  },
  topicContainer: {
    marginBottom: 15,
  },
  topicButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  topicButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    backgroundColor: '#16213e',
    marginRight: 8,
  },
  topicButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  topicButtonText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '600',
  },
  topicButtonTextActive: {
    color: '#fff',
  },
  countContainer: {
    marginBottom: 15,
  },
  countButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  countButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  countButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  countButtonText: {
    color: '#0ea5e9',
    fontSize: 16,
    fontWeight: '600',
  },
  countButtonTextActive: {
    color: '#fff',
  },
  sentencesList: {
    maxHeight: 300,
    marginTop: 10,
  },
  sentenceItem: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#16213e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  sentenceNumber: {
    color: '#0ea5e9',
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 14,
    minWidth: 25,
  },
  sentenceText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
});

