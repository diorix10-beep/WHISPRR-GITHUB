import { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, useColorScheme 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/theme';

export default function OnboardingScreen() {
  const { user, profile, updateProfile } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [selectedAvatar, setSelectedAvatar] = useState('👤');
  const [selectedMood, setSelectedMood] = useState('Neutral');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [homeCountry, setHomeCountry] = useState('United States');
  const [saving, setSaving] = useState(false);

  const moods = ['Calm', 'Inspired', 'Thoughtful', 'Anxious', 'Grateful', 'Restless', 'Happy', 'Neutral'];
  const interests = ['AI & Tech', 'Art & Design', 'Philosophy', 'Daily Reflections', 'Creative Writing', 'Wellness', 'Music', 'Poetry'];
  const avatars = ['👤', '🦁', '🦊', '🐱', '🐨', '🐼', '🦄', '🐳', '🌟', '🌙', '☕', '🎨'];

  // Check username uniqueness on step 1 transition
  const handleCheckUsername = async () => {
    if (!username.trim() || username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }
    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setUsernameError('Letters, numbers, and underscores only');
      return;
    }

    setCheckingUsername(true);
    setUsernameError('');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setUsernameError('This username is already taken');
      } else {
        // Safe to go to Step 2
        setStep(2);
      }
    } catch (err) {
      setUsernameError('Failed to verify username uniqueness');
    } finally {
      setCheckingUsername(false);
    }
  };

  // Resolve user location on load
  useEffect(() => {
    async function detectLocation() {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data && data.country_name) {
          setHomeCountry(data.country_name);
        }
      } catch {
        // Fallback silently to default United States
      }
    }
    detectLocation();
  }, []);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
  };

  const handleCompleteOnboarding = async () => {
    setSaving(true);
    try {
      await updateProfile({
        username: username.trim().toLowerCase(),
        display_name: displayName.trim() || username.trim(),
        avatar_emoji: selectedAvatar,
        mood: selectedMood,
        interests: selectedInterests,
        bio: bio.trim() || null,
        home_country: homeCountry,
        onboarding_complete: true,
      });
      // Auth context will reload and trigger redirect to (app)
    } catch (err: any) {
      console.warn('Failed to complete onboarding:', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Progress header */}
        <View style={styles.header}>
          <Text style={[styles.progressTitle, { color: colors.primary }]}>WHISPRR Onboarding</Text>
          <View style={[styles.progressBarBg, { backgroundColor: colors.backgroundElement }]}>
            <View style={[styles.progressBar, { width: `${(step / 7) * 100}%`, backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.stepText, { color: colors.textSecondary }]}>Step {step} of 7</Text>
        </View>

        {/* Wizard Cards */}
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          {/* Step 1: User details */}
          {step === 1 && (
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Choose your identity</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                Pick a unique username. This is how other members will tag you in conversations.
              </Text>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Username</Text>
                <TextInput
                  value={username}
                  onChangeText={(val) => {
                    setUsername(val.replace(/\s+/g, ''));
                    setUsernameError('');
                  }}
                  placeholder="username"
                  placeholderTextColor={scheme === 'dark' ? '#555' : '#aaa'}
                  autoCapitalize="none"
                  style={[styles.input, { 
                    backgroundColor: colors.background, 
                    borderColor: usernameError ? '#ff4d4d' : colors.border, 
                    color: colors.text 
                  }]}
                />
                {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Display Name (Optional)</Text>
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

              <TouchableOpacity 
                onPress={handleCheckUsername}
                disabled={checkingUsername || !username.trim()}
                style={[styles.button, { backgroundColor: colors.primary }, !username.trim() && styles.buttonDisabled]}
              >
                {checkingUsername ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Avatar select */}
          {step === 2 && (
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Select an Avatar</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>Pick an emoji representation for your profile badge.</Text>
              
              <View style={styles.avatarGrid}>
                {avatars.map((av) => (
                  <TouchableOpacity 
                    key={av} 
                    onPress={() => setSelectedAvatar(av)}
                    style={[
                      styles.avatarBubble, 
                      { backgroundColor: colors.background },
                      selectedAvatar === av && { borderColor: colors.primary, borderWidth: 2 }
                    ]}
                  >
                    <Text style={styles.avatarEmoji}>{av}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.navRow}>
                <TouchableOpacity onPress={() => setStep(1)} style={[styles.backButton, { borderColor: colors.primary }]}>
                  <Text style={[styles.backButtonText, { color: colors.primary }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep(3)} style={[styles.nextButton, { backgroundColor: colors.primary }]}>
                  <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3: Current Mood */}
          {step === 3 && (
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>How are you feeling today?</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>Set your starting mood. You can change this anytime from your profile.</Text>

              <View style={styles.flexGrid}>
                {moods.map((mood) => {
                  const isSelected = selectedMood === mood;
                  return (
                    <TouchableOpacity 
                      key={mood}
                      onPress={() => setSelectedMood(mood)}
                      style={[
                        styles.gridItem, 
                        { backgroundColor: colors.background, borderColor: colors.border },
                        isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                      ]}
                    >
                      <Text style={[styles.gridText, { color: colors.text }, isSelected && { color: colors.primary, fontWeight: 'bold' }]}>
                        {mood}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.navRow}>
                <TouchableOpacity onPress={() => setStep(2)} style={[styles.backButton, { borderColor: colors.primary }]}>
                  <Text style={[styles.backButtonText, { color: colors.primary }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep(4)} style={[styles.nextButton, { backgroundColor: colors.primary }]}>
                  <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 4: Interests */}
          {step === 4 && (
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>What interests you?</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>Choose topics you want to explore and discuss inside communities.</Text>

              <View style={styles.flexGrid}>
                {interests.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <TouchableOpacity 
                      key={interest}
                      onPress={() => handleInterestToggle(interest)}
                      style={[
                        styles.gridItem, 
                        { backgroundColor: colors.background, borderColor: colors.border },
                        isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                      ]}
                    >
                      <Text style={[styles.gridText, { color: colors.text }, isSelected && { color: colors.primary, fontWeight: 'bold' }]}>
                        {interest}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.navRow}>
                <TouchableOpacity onPress={() => setStep(3)} style={[styles.backButton, { borderColor: colors.primary }]}>
                  <Text style={[styles.backButtonText, { color: colors.primary }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep(5)} style={[styles.nextButton, { backgroundColor: colors.primary }]}>
                  <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 5: Bio */}
          {step === 5 && (
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Share your story</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>Write a short bio to introduce yourself to other network members.</Text>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Short Bio</Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="I love meaningful conversations..."
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

              <View style={styles.navRow}>
                <TouchableOpacity onPress={() => setStep(4)} style={[styles.backButton, { borderColor: colors.primary }]}>
                  <Text style={[styles.backButtonText, { color: colors.primary }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep(6)} style={[styles.nextButton, { backgroundColor: colors.primary }]}>
                  <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 6: Region */}
          {step === 6 && (
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Where are you located?</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>We use this to display localized community recommendations.</Text>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Country Name</Text>
                <TextInput
                  value={homeCountry}
                  onChangeText={setHomeCountry}
                  placeholder="e.g. United States"
                  placeholderTextColor={scheme === 'dark' ? '#555' : '#aaa'}
                  style={[styles.input, { 
                    backgroundColor: colors.background, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }]}
                />
              </View>

              <View style={styles.navRow}>
                <TouchableOpacity onPress={() => setStep(5)} style={[styles.backButton, { borderColor: colors.primary }]}>
                  <Text style={[styles.backButtonText, { color: colors.primary }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep(7)} style={[styles.nextButton, { backgroundColor: colors.primary }]}>
                  <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 7: Review */}
          {step === 7 && (
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Verify your parameters</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>Everything looks solid! Click "Continue" to launch your profile.</Text>

              <View style={[styles.reviewSection, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.reviewHeader, { color: colors.text }]}>
                  {selectedAvatar} @{username}
                </Text>
                <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>DISPLAY NAME: <Text style={{ color: colors.text }}>{displayName || username}</Text></Text>
                <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>MOOD: <Text style={{ color: colors.text }}>{selectedMood}</Text></Text>
                <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>INTERESTS: <Text style={{ color: colors.text }}>{selectedInterests.join(', ') || 'None'}</Text></Text>
                <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>BIO: <Text style={{ color: colors.text }}>{bio || 'Not provided'}</Text></Text>
                <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>LOCATION: <Text style={{ color: colors.text }}>{homeCountry}</Text></Text>
              </View>

              <View style={styles.navRow}>
                <TouchableOpacity onPress={() => setStep(6)} style={[styles.backButton, { borderColor: colors.primary }]}>
                  <Text style={[styles.backButtonText, { color: colors.primary }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleCompleteOnboarding} 
                  disabled={saving}
                  style={[styles.nextButton, { backgroundColor: colors.primary }]}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.nextButtonText}>Continue</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
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
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Cormorant Garamond' : 'serif',
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  stepText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
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
  errorText: {
    color: '#ff4d4d',
    fontSize: 11,
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  button: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginVertical: 10,
  },
  avatarBubble: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  flexGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 10,
  },
  gridItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  gridText: {
    fontSize: 12.5,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  nextButton: {
    flex: 1.5,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  reviewSection: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 10,
  },
  reviewHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  reviewLabel: {
    fontSize: 12,
    marginVertical: 4,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
});
