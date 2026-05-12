import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSessionStore } from '@/stores/sessionStore';

export default function IntentModal() {
  const router = useRouter();
  const current = useSessionStore((s) => s.intent);
  const setIntent = useSessionStore((s) => s.setIntent);
  const newSession = useSessionStore((s) => s.newSession);

  const [subject, setSubject] = useState(current.subject ?? '');
  const [mood, setMood] = useState(current.mood ?? '');
  const [style, setStyle] = useState(current.style ?? '');
  const [constraints, setConstraints] = useState(current.constraints ?? '');

  const apply = () => {
    setIntent({
      subject: subject.trim() || undefined,
      mood: mood.trim() || undefined,
      style: style.trim() || undefined,
      constraints: constraints.trim() || undefined,
    });
    newSession();
    router.back();
  };

  const clear = () => {
    setSubject('');
    setMood('');
    setStyle('');
    setConstraints('');
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>What are we shooting?</Text>
          <Pressable onPress={apply}>
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          <Field label="Subject" value={subject} onChange={setSubject} placeholder="my dog, the bridge, the kid in red" />
          <Field label="Mood" value={mood} onChange={setMood} placeholder="moody, bright, candid" />
          <Field label="Style" value={style} onChange={setStyle} placeholder="film, documentary, portrait" />
          <Field label="Constraints" value={constraints} onChange={setConstraints} placeholder="handheld, low light, no flash" />

          <Pressable style={styles.clearButton} onPress={clear}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

function Field({ label, value, onChange, placeholder }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#555"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  cancel: { color: '#888', fontSize: 16 },
  done: { color: '#ffd166', fontSize: 16, fontWeight: '700' },
  title: { color: '#fff', fontSize: 16, fontWeight: '600' },
  body: { padding: 20, gap: 18 },
  field: { gap: 6 },
  label: {
    color: '#888',
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  input: {
    color: '#fff',
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  clearButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginTop: 12,
  },
  clearText: { color: '#bbb', fontWeight: '600' },
});
