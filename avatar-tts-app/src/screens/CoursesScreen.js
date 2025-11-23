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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { coursesAPI, authAPI, usersAPI } from '../services/api';

export default function CoursesScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [membership, setMembership] = useState('free');
  const [userId, setUserId] = useState(null);
  
  // Create course form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseLanguage, setCourseLanguage] = useState('en');
  const [courseLevel, setCourseLevel] = useState('beginner');

  useEffect(() => {
    loadUserInfo();
    loadCourses();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userInfo = await authAPI.getStoredUserInfo();
      setMembership(userInfo.membership || 'free');
      setUserId(userInfo.id);
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const loadCourses = async () => {
    try {
      if (!userId) {
        const userInfo = await authAPI.getStoredUserInfo();
        if (userInfo.id) {
          setUserId(userInfo.id);
          await fetchCourses(userInfo.id);
        }
      } else {
        await fetchCourses(userId);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      Alert.alert('Error', 'Failed to load courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCourses = async (id) => {
    try {
      const response = await coursesAPI.getUserCourses(id);
      if (response.data.success) {
        setCourses(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  };

  const handleCreateCourse = async () => {
    if (membership !== 'premium') {
      Alert.alert(
        'Premium Required',
        'Creating courses requires a premium membership. Please upgrade to create courses.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!courseTitle.trim()) {
      Alert.alert('Error', 'Please enter a course title');
      return;
    }

    try {
      setCreating(true);
      const response = await coursesAPI.create({
        title: courseTitle.trim(),
        description: courseDescription.trim() || null,
        language: courseLanguage,
        level: courseLevel,
        is_published: false,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Course created successfully!');
        setCourseTitle('');
        setCourseDescription('');
        setShowCreateForm(false);
        loadCourses(); // Reload courses
      } else {
        Alert.alert('Error', response.data.message || 'Failed to create course');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to create course';
      
      if (error.response?.status === 403) {
        Alert.alert(
          'Premium Required',
          'Creating courses requires a premium membership. Please upgrade to create courses.'
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleViewCourse = async (courseId) => {
    try {
      const response = await coursesAPI.getById(courseId);
      if (response.data.success) {
        // Navigate to course details or show in modal
        Alert.alert(
          'Course Details',
          `Title: ${response.data.data.title}\n\nDescription: ${response.data.data.description || 'N/A'}\n\nLanguage: ${response.data.data.language}\n\nLevel: ${response.data.data.level}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      Alert.alert('Error', 'Failed to load course details');
    }
  };

  const handleViewVideos = (courseId, courseTitle) => {
    navigation.navigate('Videos', {
      courseId,
      courseTitle: courseTitle || 'Course',
    });
  };

  const handleViewReports = (courseId, courseTitle) => {
    navigation.navigate('Reports', {
      courseId,
      courseTitle: courseTitle || 'Course',
    });
  };

  const handleViewSubjects = async (courseId) => {
    try {
      const response = await coursesAPI.getSubjects(courseId);
      if (response.data.success) {
        const subjects = response.data.data || [];
        Alert.alert(
          'Course Subjects',
          subjects.length > 0
            ? `Found ${subjects.length} subject(s)`
            : 'No subjects found for this course',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      Alert.alert('Error', 'Failed to load subjects');
    }
  };

  const handleSetActive = async (courseId) => {
    try {
      const response = await coursesAPI.setActive(courseId);
      if (response.data.success) {
        Alert.alert('Success', 'Course set as active!');
        // Reload courses to update UI
        await loadCourses();
      }
    } catch (error) {
      console.error('Error setting active course:', error);
      Alert.alert('Error', 'Failed to set course as active');
    }
  };

  const handleUpgrade = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found. Please log in again.');
      return;
    }

    Alert.alert(
      'Upgrade to Premium',
      'Are you sure you want to upgrade to Premium? This will unlock all features including unlimited courses and AI-powered features.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: async () => {
            try {
              const response = await usersAPI.upgrade(userId);
              if (response.data.success) {
                Alert.alert('Success', 'Account upgraded to Premium successfully!');
                // Reload user info to update membership
                await loadUserInfo();
                // Reload courses
                await loadCourses();
              } else {
                Alert.alert('Error', response.data.message || 'Failed to upgrade account');
              }
            } catch (error) {
              console.error('Error upgrading:', error);
              const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'Failed to upgrade account';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadCourses} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Courses</Text>
          {renderMembershipBadge()}
        </View>

        {membership !== 'premium' && (
          <View style={styles.upgradeBanner}>
            <Text style={styles.upgradeText}>
              ⭐ Upgrade to Premium to create courses!
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Create Course Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.createButton,
              membership !== 'premium' && styles.createButtonDisabled,
            ]}
            onPress={() => setShowCreateForm(!showCreateForm)}
            disabled={membership !== 'premium'}
          >
            <Text style={styles.createButtonText}>
              {showCreateForm ? 'Cancel' : '+ Create New Course'}
            </Text>
          </TouchableOpacity>

          {/* Create Course Form */}
          {showCreateForm && membership === 'premium' && (
            <View style={styles.createForm}>
              <TextInput
                placeholder="Course Title *"
                placeholderTextColor="#94a3b8"
                value={courseTitle}
                onChangeText={setCourseTitle}
                style={styles.input}
              />

              <TextInput
                placeholder="Description (optional)"
                placeholderTextColor="#94a3b8"
                value={courseDescription}
                onChangeText={setCourseDescription}
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={3}
              />

              <View style={styles.languageContainer}>
                <Text style={styles.label}>Language:</Text>
                <View style={styles.languageButtons}>
                  {['en', 'tr'].map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      style={[
                        styles.languageButton,
                        courseLanguage === lang && styles.languageButtonActive,
                      ]}
                      onPress={() => setCourseLanguage(lang)}
                    >
                      <Text
                        style={[
                          styles.languageButtonText,
                          courseLanguage === lang && styles.languageButtonTextActive,
                        ]}
                      >
                        {lang === 'en' ? '🇺🇸 English' : '🇹🇷 Türkçe'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.levelContainer}>
                <Text style={styles.label}>Level:</Text>
                <View style={styles.levelButtons}>
                  {['beginner', 'intermediate', 'advanced'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.levelButton,
                        courseLevel === level && styles.levelButtonActive,
                      ]}
                      onPress={() => setCourseLevel(level)}
                    >
                      <Text
                        style={[
                          styles.levelButtonText,
                          courseLevel === level && styles.levelButtonTextActive,
                        ]}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, creating && styles.submitButtonDisabled]}
                onPress={handleCreateCourse}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Course</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Courses List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Your Courses ({courses.length})
          </Text>

          {courses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyText}>No courses yet</Text>
              <Text style={styles.emptySubtext}>
                {membership === 'premium'
                  ? 'Create your first course above to start learning!'
                  : 'Upgrade to Premium to create unlimited courses'}
              </Text>
            </View>
          ) : (
            courses.map((course) => (
              <View 
                key={course.id} 
                style={[
                  styles.courseCard,
                  course.is_active && styles.courseCardActive
                ]}
              >
                <View style={styles.courseHeader}>
                  <View style={styles.courseTitleContainer}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    {course.is_active && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>⭐ Active</Text>
                      </View>
                    )}
                    {course.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>🏠 Default</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.courseBadges}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{course.language?.toUpperCase() || 'EN'}</Text>
                    </View>
                    {course.level && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{course.level}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {course.description && (
                  <Text style={styles.courseDescription}>{course.description}</Text>
                )}

                {/* Statistics */}
                <View style={styles.courseStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>🎥</Text>
                    <Text style={styles.statText}>{course.videos_count || 0} Videos</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>📊</Text>
                    <Text style={styles.statText}>{course.reports_count || 0} Reports</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>📚</Text>
                    <Text style={styles.statText}>{course.subjects_count || 0} Subjects</Text>
                  </View>
                </View>

                <View style={styles.courseActions}>
                  {!course.is_active && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonPrimary]}
                      onPress={() => handleSetActive(course.id)}
                    >
                      <Text style={styles.actionButtonText}>⭐ Set Active</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleViewVideos(course.id, course.title)}
                  >
                    <Text style={styles.actionButtonText}>🎥 Videos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleViewReports(course.id, course.title)}
                  >
                    <Text style={styles.actionButtonText}>📊 Reports</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleViewCourse(course.id)}
                  >
                    <Text style={styles.actionButtonText}>📄 Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 10,
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
    marginBottom: 10,
  },
  upgradeButton: {
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1a1a2e',
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: 'bold',
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
    marginBottom: 15,
  },
  createButton: {
    backgroundColor: '#0ea5e9',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#64748b',
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createForm: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#16213e',
    borderRadius: 10,
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  languageContainer: {
    marginBottom: 15,
  },
  levelContainer: {
    marginBottom: 15,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
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
    backgroundColor: '#0f172a',
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
  levelButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  levelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  levelButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  levelButtonText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '600',
  },
  levelButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#0ea5e9',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  courseCard: {
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  courseTitleContainer: {
    flex: 1,
    marginRight: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  activeBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#1a1a2e',
    fontSize: 10,
    fontWeight: 'bold',
  },
  defaultBadge: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  courseBadges: {
    flexDirection: 'row',
    gap: 5,
  },
  badge: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  courseDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 15,
    lineHeight: 20,
  },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    marginBottom: 15,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  courseActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  actionButtonPrimary: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
  actionButtonText: {
    color: '#0ea5e9',
    fontSize: 12,
    fontWeight: '600',
  },
});

