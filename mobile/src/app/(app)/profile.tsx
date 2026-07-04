import { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, useColorScheme 
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      setMessage('Display name is required');
      setIsError(true);
      return;
    }

    setUpdating(true);
    setMessage('');
    try {
      await updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim() || null,
      });
      setMessage('Profile updated successfully! ✨');
      setIsError(false);
    } catch (err: any) {
      setMessage(err.message || 'Failed to update profile');
      setIsError(true);
    } finally {
      setUpdating(false);
    }
  };

  const initials = (profile?.display_name || profile?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Avatar Display */}
        <View style={styles.avatarSection}>
          <View style={[styles.largeAvatar, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '50' }]}>
            {profile?.avatar_emoji ? (
              <Text style={styles.avatarEmoji}>{profile.avatar_emoji}</Text>
            ) : (
              <Text style={[styles.avatarInitials, { color: colors.primary }]}>{initials}</Text>
            )}
          </View>
          <Text style={[styles.displayNameTitle, { color: colors.text }]}>
            {profile?.display_name || 'WHISPRR Member'}
          </Text>
          <Text style={[styles.usernameSubtitle, { color: colors.textSecondary }]}>
            @{profile?.username || 'username'}
          </Text>
        </View>

        {/* Form Fields */}
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Edit Profile Details</Text>

          {message ? (
            <Text style={[
              styles.messageText, 
              { color: isError ? '#ff4d4d' : '#2e7d32', backgroundColor: isError ? 'rgba(255,77,77,0.08)' : 'rgba(46,125,50,0.08)' }
            ]}>
              {message}
            </Text>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Display Name</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your display name"
              placeholderTextColor={scheme === 'dark' ? '#555' : '#aaa'}
              style={[styles.input, { 
                backgroundColor: colors.background, 
                borderColor: colors.border, 
                color: colors.text 
              }]}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor={scheme === 'dark' ? '#555' : '#aaa'}
              multiline
              numberOfLines={4}
              maxLength={200}
              style={[styles.input, styles.textarea, { 
                backgroundColor: colors.background, 
                borderColor: colors.border, 
                color: colors.text 
              }]}
            />
            <Text style={styles.charCount}>{bio.length}/200</Text>
          </View>

          <TouchableOpacity 
            onPress={handleUpdateProfile} 
            disabled={updating}
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            {updating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats card */}
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border, marginTop: 16 }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Ecosystem Metrics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{profile?.referrals_count || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Referrals</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {profile?.home_country ? '🌍' : '🏠'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {profile?.home_country || 'None'}
              </Text>
            </View>
          </View>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity 
          onPress={signOut}
          style={[styles.logoutButton, { borderColor: colors.primary + '50' }]}
        >
          <Text style={[styles.logoutButtonText, { color: colors.primary }]}>Sign Out of WHISPRR</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  largeAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  displayNameTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Cormorant Garamond' : 'serif',
  },
  usernameSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  messageText: {
    fontSize: 12,
    marginBottom: 16,
    padding: 10,
    borderRadius: 8,
    textAlign: 'center',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  button: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
});
