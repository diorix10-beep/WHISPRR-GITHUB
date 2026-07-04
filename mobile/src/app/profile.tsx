import { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim()
      });
      setMsg('Profile updated successfully!');
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile?.display_name || profile?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {/* Profile Header */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{initials}</Text>
            </View>
            <Text style={styles.displayName}>@{profile?.username || 'member'}</Text>
            <Text style={styles.displayRole}>{profile?.role || 'User'}</Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Edit Details</Text>
            {msg ? <Text style={styles.feedbackMsg}>{msg}</Text> : null}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your Display Name"
                placeholderTextColor="#666"
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textArea]}
              />
            </View>

            <TouchableOpacity 
              onPress={handleSave} 
              disabled={saving}
              style={styles.saveButton}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save Profile</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Badges Earned */}
          <View style={styles.badgesCard}>
            <Text style={styles.sectionTitle}>Badges Gallery</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badgeItem}>
                <Text style={styles.badgeIcon}>🛡️</Text>
                <Text style={styles.badgeName}>Early Member</Text>
              </View>
              <View style={styles.badgeItem}>
                <Text style={styles.badgeIcon}>🎙️</Text>
                <Text style={styles.badgeName}>Voice Pioneer</Text>
              </View>
            </View>
          </View>

          {/* Account Actions */}
          <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sign Out of WHISPRR</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff4d8020',
    borderWidth: 2,
    borderColor: '#ff4d80',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLargeText: {
    color: '#ff4d80',
    fontSize: 28,
    fontWeight: 'bold',
  },
  displayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  displayRole: {
    fontSize: 11,
    color: '#ff4d80',
    marginTop: 2,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  formCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 14,
  },
  feedbackMsg: {
    fontSize: 12,
    color: '#ff4d80',
    marginBottom: 12,
    textAlign: 'center',
    backgroundColor: '#ff4d8010',
    padding: 8,
    borderRadius: 8,
  },
  inputContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    color: '#aaa',
    textTransform: 'uppercase',
    marginBottom: 6,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2d2d2d',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#fff',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#ff4d80',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  badgesCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  badgeItem: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  badgeName: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff4d4d30',
  },
  logoutText: {
    color: '#ff4d4d',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
