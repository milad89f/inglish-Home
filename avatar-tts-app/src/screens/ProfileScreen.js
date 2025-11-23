import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authAPI, usersAPI } from '../services/api';

export default function ProfileScreen({ onLogout, navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadUserInfo();
  }, []);

  // إعادة تحميل البيانات عند فتح الشاشة (إذا كان navigation موجود)
  useEffect(() => {
    if (navigation?.addListener) {
      const unsubscribe = navigation.addListener('focus', () => {
        loadUserInfo();
      });
      return unsubscribe;
    }
  }, [navigation]);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const userInfo = await authAPI.getStoredUserInfo();
      console.log('ProfileScreen - Loaded user info:', userInfo);
      
      // إذا لم تكن البيانات موجودة محلياً، حاول جلبها من Backend
      if (!userInfo.email && !userInfo.name && userInfo.id) {
        try {
          const currentUserResponse = await authAPI.getCurrentUser();
          if (currentUserResponse.data.success) {
            const backendUser = currentUserResponse.data.data;
            setUser({
              id: backendUser.id,
              email: backendUser.email || '',
              name: backendUser.name || '',
              membership: backendUser.membership || 'free',
            });
            // حفظ البيانات محلياً
            const AsyncStorage = require('@react-native-async-storage/async-storage');
            await AsyncStorage.setItem('user_email', backendUser.email || '');
            await AsyncStorage.setItem('user_name', backendUser.name || '');
            await AsyncStorage.setItem('user_membership', backendUser.membership || 'free');
            return;
          }
        } catch (backendError) {
          console.log('Could not fetch user from backend, using stored data');
        }
      }
      
      setUser({
        id: userInfo.id,
        email: userInfo.email || '',
        name: userInfo.name || '',
        membership: userInfo.membership || 'free',
      });
    } catch (error) {
      console.error('Error loading user info:', error);
      Alert.alert('Error', 'Failed to load user information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!user) return;

    Alert.alert(
      'Upgrade to Premium',
      'Are you sure you want to upgrade to Premium?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: async () => {
            try {
              const response = await usersAPI.upgrade(user.id);
              if (response.data.success) {
                Alert.alert('Success', 'Account upgraded to Premium!');
                // Update user info
                setUser({ ...user, membership: 'premium' });
                // Update stored membership
                const AsyncStorage = require('@react-native-async-storage/async-storage');
                await AsyncStorage.setItem('user_membership', 'premium');
              }
            } catch (error) {
              console.error('Error upgrading:', error);
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to upgrade account'
              );
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirmation do not match');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await usersAPI.changePassword(user.id, {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Password changed successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setShowChangePassword(false);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to change password'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authAPI.logout();
            if (onLogout) {
              onLogout();
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Profile Header with Avatar */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLargeContainer}>
            <Text style={styles.avatarLargeText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email || ''}</Text>
          <View style={[
            styles.membershipBadgeLarge,
            user?.membership === 'premium' ? styles.membershipBadgeLargePremium : styles.membershipBadgeLargeFree
          ]}>
            <Text style={styles.membershipBadgeLargeText}>
              {user?.membership === 'premium' ? '⭐ Premium Member' : '🆓 Free Member'}
            </Text>
          </View>
        </View>

        {/* User Info Card */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{user?.name || 'Loading...'}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user?.email || 'Loading...'}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <Text style={styles.label}>Account Type:</Text>
            <View style={styles.membershipContainer}>
              <Text
                style={[
                  styles.membershipBadge,
                  user?.membership === 'premium'
                    ? styles.membershipBadgePremium
                    : styles.membershipBadgeFree,
                ]}
              >
                {user?.membership === 'premium' ? '⭐ Premium' : '🆓 Free'}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {user?.membership === 'free' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleUpgrade}
            >
              <Text style={styles.actionButtonText}>⭐ Upgrade to Premium</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.changePasswordButton]}
            onPress={() => setShowChangePassword(true)}
          >
            <Text style={styles.actionButtonText}>🔐 Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={styles.actionButtonText}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChangePassword(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <TextInput
              style={styles.input}
              placeholder="Current Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowChangePassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
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
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#16213e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  avatarLargeContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 4,
    borderColor: '#1e40af',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarLargeText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 15,
  },
  membershipBadgeLarge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 2,
  },
  membershipBadgeLargePremium: {
    backgroundColor: '#fbbf24',
    borderColor: '#f59e0b',
  },
  membershipBadgeLargeFree: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0284c7',
  },
  membershipBadgeLargeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#0f172a',
    marginVertical: 8,
  },
  membershipContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  membershipBadge: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  membershipBadgePremium: {
    backgroundColor: '#fbbf24',
    color: '#1a1a2e',
  },
  membershipBadgeFree: {
    backgroundColor: '#0ea5e9',
    color: '#fff',
  },
  actionsContainer: {
    gap: 15,
  },
  actionButton: {
    backgroundColor: '#16213e',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  changePasswordButton: {
    borderColor: '#0ea5e9',
  },
  logoutButton: {
    borderColor: '#dc2626',
    backgroundColor: '#3a1a1a',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 25,
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#3a3a3a',
  },
  submitButton: {
    backgroundColor: '#0ea5e9',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

