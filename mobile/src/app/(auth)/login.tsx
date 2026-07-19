import { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, useColorScheme 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // AuthContext will trigger root redirect on user session update
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.primary }]}>WHISPRR</Text>
          <Text style={styles.subtitle}>The Home of Creators</Text>

          <Text style={[styles.tabTitle, { color: colors.text }]}>Login to your account</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={scheme === 'dark' ? '#555' : '#aaa'}
              style={[styles.input, { 
                backgroundColor: colors.background, 
                borderColor: colors.border, 
                color: colors.text 
              }]}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={scheme === 'dark' ? '#555' : '#aaa'}
              style={[styles.input, { 
                backgroundColor: colors.background, 
                borderColor: colors.border, 
                color: colors.text 
              }]}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity 
            onPress={handleSignIn} 
            disabled={loading}
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/signup')}
            style={styles.switchContainer}
          >
            <Text style={[styles.switchText, { color: colors.textSecondary }]}>
              Don't have an account? Sign Up
            </Text>
          </TouchableOpacity>
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
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Cormorant Garamond' : 'serif',
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  tabTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255,77,77,0.08)',
    padding: 10,
    borderRadius: 8,
    textAlign: 'center',
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
  button: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
  switchContainer: {
    marginTop: 16,
    padding: 4,
  },
  switchText: {
    fontSize: 12,
    textAlign: 'center',
    textDecorationLine: 'underline',
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
  },
});
