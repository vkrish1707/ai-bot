import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { claudeClient } from '@/services/ai/ClaudeClient';
import { PROXY_URL } from '@/services/ai/config';

type Status = 'idle' | 'streaming' | 'done' | 'error';

export default function SettingsScreen() {
  const [status, setStatus] = useState<Status>('idle');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<string>('');

  const runTest = useCallback(async () => {
    setStatus('streaming');
    setError(null);
    setOutput('');
    try {
      const stream = await claudeClient.streamChat({
        sessionId: `test-${Date.now()}`,
        messages: [
          {
            role: 'user',
            content: 'Say hi as the photographer. One sentence.',
          },
        ],
      });
      let buf = '';
      for await (const chunk of stream) {
        buf += chunk;
        setOutput(buf);
      }
      setStatus('done');
    } catch (e) {
      setError(String(e));
      setStatus('error');
    }
  }, []);

  const checkBudget = useCallback(async () => {
    try {
      const b = await claudeClient.getBudget();
      setBudget(`$${b.used_usd.toFixed(4)} / $${b.cap_usd} (resets ${new Date(b.resets_at).toLocaleTimeString()})`);
    } catch (e) {
      setBudget(`err: ${e}`);
    }
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Proxy</Text>
        <Text style={styles.kv}>{PROXY_URL}</Text>

        <View style={styles.section}>
          <Pressable style={styles.button} onPress={runTest}>
            <Text style={styles.buttonText}>
              {status === 'streaming' ? 'Streaming…' : 'Test /v1/chat'}
            </Text>
          </Pressable>

          {status !== 'idle' && (
            <View style={styles.outputBox}>
              <Text style={styles.outputText}>{output || (status === 'streaming' ? '…' : '')}</Text>
              {error && <Text style={styles.error}>{error}</Text>}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Pressable style={styles.button} onPress={checkBudget}>
            <Text style={styles.buttonText}>Check daily budget</Text>
          </Pressable>
          {!!budget && <Text style={styles.kv}>{budget}</Text>}
        </View>

        <View style={styles.section}>
          <Pressable
            style={styles.buttonGhost}
            onPress={async () => {
              await claudeClient.resetToken();
              setOutput('');
              setBudget('');
            }}
          >
            <Text style={styles.buttonGhostText}>Reset device token</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  container: { padding: 20, gap: 16 },
  heading: { color: '#bbb', fontSize: 12, letterSpacing: 1.2, fontWeight: '700' },
  kv: { color: '#888', fontSize: 13, fontFamily: 'Menlo' },
  section: { gap: 8, marginTop: 12 },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#000', fontWeight: '700' },
  buttonGhost: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
  },
  buttonGhostText: { color: '#bbb', fontWeight: '600' },
  outputBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 8,
    minHeight: 60,
  },
  outputText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  error: { color: '#ff6b6b', fontSize: 12, marginTop: 8, fontFamily: 'Menlo' },
});
