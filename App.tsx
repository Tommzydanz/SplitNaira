import React, { useEffect, useMemo, useState } from 'react';
import {
  AppState,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import codePush from '@bitrise/code-push-sdk';
import { SafeAreaView } from 'react-native-safe-area-context';

const CURRENCY_SYMBOL = '₦';
const APP_VERSION = `${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`;
const TIP_PRESETS = [10, 15, 20];

function App(): React.JSX.Element {
  const [bill, setBill] = useState('');
  const [tipPercent, setTipPercent] = useState<number>(TIP_PRESETS[1]);
  const [customTip, setCustomTip] = useState('');
  const [people, setPeople] = useState(1);

  const billValue = parseFloat(bill) || 0;
  const effectiveTip = customTip ? parseFloat(customTip) || 0 : tipPercent;

  const { tipAmount, total, perPerson } = useMemo(() => {
    const tip = (billValue * effectiveTip) / 100;
    const totalValue = billValue + tip;
    return {
      tipAmount: tip,
      total: totalValue,
      perPerson: totalValue / Math.max(people, 1),
    };
  }, [billValue, effectiveTip, people]);

  const format = (n: number) => `${CURRENCY_SYMBOL}${n.toFixed(2)}`;
  useEffect(() => {
    const syncOptions = {
      installMode: codePush.InstallMode.ON_NEXT_RESUME,
    };
    codePush.sync(syncOptions);

    const subscription = AppState.addEventListener("change", (newState) => {
      if (newState === "active") {
        codePush.sync(syncOptions);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>SplitNaira</Text>
      <Text style={styles.subtitle}>Split any bill in seconds</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Bill amount</Text>
        <View style={styles.inputRow}>
          <Text style={styles.currency}>{CURRENCY_SYMBOL}</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="0.00"
            value={bill}
            onChangeText={setBill}
          />
        </View>

        <Text style={styles.label}>Tip</Text>
        <View style={styles.tipRow}>
          <TextInput
            style={styles.customTipInput}
            keyboardType="decimal-pad"
            placeholder="Custom %"
            value={customTip}
            onChangeText={setCustomTip}
          />
          {TIP_PRESETS.map(preset => (
            <TouchableOpacity
              key={preset}
              style={[
                styles.tipButton,
                !customTip && tipPercent === preset && styles.tipButtonActive,
              ]}
              onPress={() => {
                setTipPercent(preset);
                setCustomTip('');
              }}>
              <Text
                style={[
                  styles.tipButtonText,
                  !customTip && tipPercent === preset && styles.tipButtonTextActive,
                ]}>
                {preset}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Split between</Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setPeople(p => Math.max(1, p - 1))}>
            <Text style={styles.stepperButtonText}>–</Text>
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{people}</Text>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setPeople(p => p + 1)}>
            <Text style={styles.stepperButtonText}>+</Text>
          </TouchableOpacity>
          <Text style={styles.stepperSuffix}>
            {people === 1 ? 'person' : 'people'}
          </Text>
        </View>
      </View>

      <View style={styles.resultCard}>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Tip</Text>
          <Text style={styles.resultValue}>{format(tipAmount)}</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Total</Text>
          <Text style={styles.resultValue}>{format(total)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.resultRow}>
          <Text style={styles.perPersonLabel}>Per person</Text>
          <Text style={styles.perPersonValue}>{format(perPerson)}</Text>
        </View>
      </View>

      <Text style={styles.footer}>v{APP_VERSION}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', paddingHorizontal: 24, paddingTop: 24, marginTop: Platform.OS === 'ios' ? 40 : 0 },
  title: { fontSize: 32, fontWeight: '700', color: '#111827', },
  subtitle: { fontSize: 16, color: '#737881', marginTop: 2, marginBottom: 20 },
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  label: { fontSize: 12, color: '#6b7280', textTransform: 'uppercase', marginTop: 14, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 8 },
  currency: { fontSize: 20, color: '#111827', marginRight: 6 },
  input: { flex: 1, fontSize: 20, color: '#111827', padding: 0 },
  tipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  tipButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  tipButtonActive: { backgroundColor: '#111827' },
  tipButtonText: { color: '#111827', fontWeight: '600' },
  tipButtonTextActive: { color: 'white' },
  customTipInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
    minWidth: 80,
    color: '#111827',
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center' },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: { fontSize: 20, color: '#111827' },
  stepperValue: { fontSize: 18, fontWeight: '700', color: '#111827', marginHorizontal: 16 },
  stepperSuffix: { color: '#6b7280', marginLeft: 8 },
  resultCard: {
    backgroundColor: '#0d5d51',
    borderRadius: 14,
    padding: 18,
    marginTop: 16,
  },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  resultLabel: { color: '#9ca3af', fontSize: 14 },
  resultValue: { color: 'white', fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f9f9fa', marginVertical: 8 },
  perPersonLabel: { color: 'white', fontSize: 16, fontWeight: '700' },
  perPersonValue: { color: '#c1f005', fontSize: 22, fontWeight: '800' },
  footer: { color: '#9ca3af', fontSize: 12, textAlign: 'center', marginTop: 20 },
});

export default App;