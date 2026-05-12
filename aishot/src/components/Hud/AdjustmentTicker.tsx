import { StyleSheet, Text, View } from 'react-native';
import { useAiStore, type TickerEntry } from '@/stores/aiStore';

const VISIBLE_COUNT = 4;
const FADE_AFTER_MS = 2400;

export function AdjustmentTicker() {
  const ticker = useAiStore((s) => s.ticker);
  const now = Date.now();
  const visible = ticker.slice(-VISIBLE_COUNT);

  return (
    <View pointerEvents="none" style={styles.container}>
      {visible.map((entry) => {
        const age = now - entry.at;
        const opacity = Math.max(0.15, 1 - age / FADE_AFTER_MS);
        return (
          <View key={entry.id} style={[styles.row, { opacity }]}>
            <Text style={[styles.kind, kindStyle(entry.kind)]}>{kindLabel(entry.kind)}</Text>
            <Text style={styles.text}>{entry.text}</Text>
          </View>
        );
      })}
    </View>
  );
}

function kindLabel(k: TickerEntry['kind']): string {
  switch (k) {
    case 'adjust':
      return '·';
    case 'say':
      return '"';
    case 'wait':
      return '…';
    case 'reframe':
      return '→';
    case 'lock':
      return '◎';
  }
}

function kindStyle(k: TickerEntry['kind']) {
  switch (k) {
    case 'adjust':
      return { color: '#fff' };
    case 'say':
      return { color: '#ffd166' };
    case 'wait':
      return { color: '#8aa' };
    case 'reframe':
      return { color: '#9ad' };
    case 'lock':
      return { color: '#9be7a8' };
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    top: 64,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  kind: { fontSize: 13, fontWeight: '800' },
  text: { color: '#fff', fontSize: 12, fontWeight: '500' },
});
