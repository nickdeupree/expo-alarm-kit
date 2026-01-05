import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, ScrollView, Alert, TextInput, Switch, Modal } from 'react-native';
import * as AlarmKit from 'expo-alarm-kit';
import { useState, useEffect } from 'react';
import RNFS from 'react-native-fs';
import { Asset } from 'expo-asset';

export default function App() {
  const [status, setStatus] = useState<string>('Ready');
  const [alarms, setAlarms] = useState<string[]>([]);
  
  // App Group Configuration
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [appGroupInput, setAppGroupInput] = useState<string>('group.com.example.alarmkit');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  
  // Advanced options state
  const [soundName, setSoundName] = useState<string>('test_sound.wav');
  const [useSoundName, setUseSoundName] = useState<boolean>(true);
  
  const [launchAppOnDismiss, setLaunchAppOnDismiss] = useState<boolean>(true);
  
  const [stopButtonLabel, setStopButtonLabel] = useState<string>('Stop');
  const [useStopButtonLabel, setUseStopButtonLabel] = useState<boolean>(true);
  
  const [snoozeButtonLabel, setSnoozeButtonLabel] = useState<string>('Snooze');
  const [useSnoozeButtonLabel, setUseSnoozeButtonLabel] = useState<boolean>(true);
  
  const [stopButtonColor, setStopButtonColor] = useState<string>('#FF0000');
  const [useStopButtonColor, setUseStopButtonColor] = useState<boolean>(true);
  
  const [snoozeButtonColor, setSnoozeButtonColor] = useState<string>('#00FF00');
  const [useSnoozeButtonColor, setUseSnoozeButtonColor] = useState<boolean>(true);
  
  const [tintColor, setTintColor] = useState<string>('#0000FF');
  const [useTintColor, setUseTintColor] = useState<boolean>(true);
  
  const [snoozeDuration, setSnoozeDuration] = useState<string>('540'); // String for TextInput
  const [useSnoozeDuration, setUseSnoozeDuration] = useState<boolean>(true);

  useEffect(() => {
    // Check if app was launched from an alarm
    const payload = AlarmKit.getLaunchPayload();
    if (payload) {
      setStatus(`Launched from alarm: ${JSON.stringify(payload)}`);
      Alert.alert('Launched from Alarm', JSON.stringify(payload));
    }
    refreshAlarms();
    prepareSound();
  }, []);

  const handleConfigureAppGroup = () => {
    if (!appGroupInput.trim()) {
      Alert.alert('Error', 'Please enter an App Group identifier');
      return;
    }
    
    try {
      const success = AlarmKit.configure(appGroupInput.trim());
      if (success) {
        setIsConfigured(true);
        setStatus(`Configured with App Group: ${appGroupInput.trim()}`);
        setShowConfigModal(false);
      } else {
        Alert.alert('Error', 'Failed to configure App Group. Please check the identifier.');
      }
    } catch (e) {
      const error = e as Error;
      Alert.alert('Error', `Configuration failed: ${error.message}`);
    }
  };

  const prepareSound = async () => {
    try {
      const libraryDir = RNFS.LibraryDirectoryPath;
      const soundsDir = `${libraryDir}/Sounds`;
      
      // Ensure directory exists
      const exists = await RNFS.exists(soundsDir);
      if (!exists) {
        await RNFS.mkdir(soundsDir);
      }

      const targetPath = `${soundsDir}/${soundName}`;
      
      // Load asset
      const soundAsset = Asset.fromModule(require('./assets/test_sound.wav'));
      await soundAsset.downloadAsync(); // Ensure it's available locally

      if (soundAsset.localUri) {
        // Check if file exists and delete it to ensure we copy the fresh asset
        const fileExists = await RNFS.exists(targetPath);
        if (fileExists) {
          await RNFS.unlink(targetPath);
        }
        
        await RNFS.copyFile(soundAsset.localUri, targetPath);
        console.log('Copied sound file to:', targetPath);
      } else {
        console.error('Could not get localUri for sound asset');
        setStatus('Error: Could not load sound asset');
      }
    } catch (e) {
      const error = e as Error;
      console.error('Error preparing sound:', error);
      setStatus(`Sound Error: ${error.message}`);
    }
  };

  const refreshAlarms = () => {
    const all = AlarmKit.getAllAlarms();
    setStatus(`Found ${all.length} active alarms`);
    setAlarms(all);
  };

  const requestPermissions = async () => {
    try {
      const result = await AlarmKit.requestAuthorization();
      setStatus(`Auth Status: ${result}`);
    } catch (e) {
      const error = e as Error;
      setStatus(`Error: ${error.message}`);
    }
  };

  const scheduleOneTimeAlarm = async () => {
    try {
      const now = new Date();
      const alarmTime = new Date(now.getTime() + 5000); // 15 seconds from now
      const epochSeconds = Math.floor(alarmTime.getTime() / 1000);
      const id = AlarmKit.generateUUID();

      const success = await AlarmKit.scheduleAlarm({
        id: id,
        epochSeconds: epochSeconds,
        title: 'Test Alarm (5s)',
        launchAppOnDismiss: launchAppOnDismiss,
        soundName: useSoundName ? soundName : undefined,
        stopButtonLabel: useStopButtonLabel ? stopButtonLabel : undefined,
        snoozeButtonLabel: useSnoozeButtonLabel ? snoozeButtonLabel : undefined,
        stopButtonColor: useStopButtonColor ? stopButtonColor : undefined,
        snoozeButtonColor: useSnoozeButtonColor ? snoozeButtonColor : undefined,
        tintColor: useTintColor ? tintColor : undefined,
        snoozeDuration: useSnoozeDuration ? (parseInt(snoozeDuration) || 540) : undefined,
      });

      setStatus(`One-time alarm scheduled (${id}): ${success}`);
      refreshAlarms();
    } catch (e) {
      const error = e as Error;
      setStatus(`Error: ${error.message}`);
    }
  };

  const scheduleOneTimeAlarmWithDate = async () => {
    try {
      const alarmTime = new Date();
      alarmTime.setSeconds(alarmTime.getSeconds() + 5); // 15 seconds from now
      const id = AlarmKit.generateUUID();

      const success = await AlarmKit.scheduleAlarm({
        id: id,
        date: alarmTime, // Using Date object instead of epochSeconds
        title: 'Test Alarm with Date (5s)',
        launchAppOnDismiss: launchAppOnDismiss,
        soundName: useSoundName ? soundName : undefined,
        stopButtonLabel: useStopButtonLabel ? stopButtonLabel : undefined,
        snoozeButtonLabel: useSnoozeButtonLabel ? snoozeButtonLabel : undefined,
        stopButtonColor: useStopButtonColor ? stopButtonColor : undefined,
        snoozeButtonColor: useSnoozeButtonColor ? snoozeButtonColor : undefined,
        tintColor: useTintColor ? tintColor : undefined,
        snoozeDuration: useSnoozeDuration ? (parseInt(snoozeDuration) || 540) : undefined,
      });

      setStatus(`One-time alarm with Date scheduled (${id}): ${success}`);
      refreshAlarms();
    } catch (e) {
      const error = e as Error;
      setStatus(`Error: ${error.message}`);
    }
  };

  const scheduleRepeatingAlarm = async () => {
    try {
      const id = AlarmKit.generateUUID();
      const success = await AlarmKit.scheduleRepeatingAlarm({
        id: id,
        hour: 8,
        minute: 30,
        weekdays: [2, 3, 4, 5, 6], // Mon-Fri
        title: 'Weekday Morning Alarm',
        launchAppOnDismiss: launchAppOnDismiss,
        soundName: useSoundName ? soundName : undefined,
        stopButtonLabel: useStopButtonLabel ? stopButtonLabel : undefined,
        snoozeButtonLabel: useSnoozeButtonLabel ? snoozeButtonLabel : undefined,
        stopButtonColor: useStopButtonColor ? stopButtonColor : undefined,
        snoozeButtonColor: useSnoozeButtonColor ? snoozeButtonColor : undefined,
        tintColor: useTintColor ? tintColor : undefined,
        snoozeDuration: useSnoozeDuration ? (parseInt(snoozeDuration) || 540) : undefined,
      });
      setStatus(`Repeating alarm scheduled (${id}): ${success}`);
      refreshAlarms();
    } catch (e) {
      const error = e as Error;
      setStatus(`Error: ${error.message}`);
    }
  };

  const cancelLastAlarm = async () => {
    if (alarms.length === 0) return;
    const lastId = alarms[alarms.length - 1];
    try {
      const success = await AlarmKit.cancelAlarm(lastId);
      setStatus(`Cancelled ${lastId}: ${success}`);
      refreshAlarms();
    } catch (e) {
      const error = e as Error;
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Expo Alarm Kit Tester</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listLabel}>Active Alarms ({alarms.length}):</Text>
        <ScrollView style={styles.scrollView}>
          {alarms.map(id => (
            <Text key={id} style={styles.alarmItem}>• {id}</Text>
          ))}
        </ScrollView>
      </View>

      <View style={styles.optionsContainer}>
        <Text style={styles.optionsHeader}>Options</Text>
        <ScrollView style={styles.optionsScroll}>
          <View style={styles.optionRow}>
            <Text>Launch App on Dismiss:</Text>
            <Switch value={launchAppOnDismiss} onValueChange={setLaunchAppOnDismiss} />
          </View>
          
          <View style={styles.optionRow}>
            <View style={styles.optionLabelRow}>
              <Switch value={useSoundName} onValueChange={setUseSoundName} style={styles.toggle} />
              <Text>Sound Name:</Text>
            </View>
            <TextInput 
              style={[styles.input, !useSoundName && styles.disabledInput]} 
              value={soundName} 
              onChangeText={setSoundName} 
              editable={useSoundName}
            />
          </View>
          
          <View style={styles.optionRow}>
            <View style={styles.optionLabelRow}>
              <Switch value={useStopButtonLabel} onValueChange={setUseStopButtonLabel} style={styles.toggle} />
              <Text>Stop Label:</Text>
            </View>
            <TextInput 
              style={[styles.input, !useStopButtonLabel && styles.disabledInput]} 
              value={stopButtonLabel} 
              onChangeText={setStopButtonLabel} 
              editable={useStopButtonLabel}
            />
          </View>
          
          <View style={styles.optionRow}>
            <View style={styles.optionLabelRow}>
              <Switch value={useSnoozeButtonLabel} onValueChange={setUseSnoozeButtonLabel} style={styles.toggle} />
              <Text>Snooze Label:</Text>
            </View>
            <TextInput 
              style={[styles.input, !useSnoozeButtonLabel && styles.disabledInput]} 
              value={snoozeButtonLabel} 
              onChangeText={setSnoozeButtonLabel} 
              editable={useSnoozeButtonLabel}
            />
          </View>
          
          <View style={styles.optionRow}>
            <View style={styles.optionLabelRow}>
              <Switch value={useStopButtonColor} onValueChange={setUseStopButtonColor} style={styles.toggle} />
              <Text>Stop Color:</Text>
            </View>
            <TextInput 
              style={[styles.input, !useStopButtonColor && styles.disabledInput]} 
              value={stopButtonColor} 
              onChangeText={setStopButtonColor} 
              editable={useStopButtonColor}
            />
          </View>
          
          <View style={styles.optionRow}>
            <View style={styles.optionLabelRow}>
              <Switch value={useSnoozeButtonColor} onValueChange={setUseSnoozeButtonColor} style={styles.toggle} />
              <Text>Snooze Color:</Text>
            </View>
            <TextInput 
              style={[styles.input, !useSnoozeButtonColor && styles.disabledInput]} 
              value={snoozeButtonColor} 
              onChangeText={setSnoozeButtonColor} 
              editable={useSnoozeButtonColor}
            />
          </View>
          
          <View style={styles.optionRow}>
            <View style={styles.optionLabelRow}>
              <Switch value={useTintColor} onValueChange={setUseTintColor} style={styles.toggle} />
              <Text>Tint Color:</Text>
            </View>
            <TextInput 
              style={[styles.input, !useTintColor && styles.disabledInput]} 
              value={tintColor} 
              onChangeText={setTintColor} 
              editable={useTintColor}
            />
          </View>
          
          <View style={styles.optionRow}>
            <View style={styles.optionLabelRow}>
              <Switch value={useSnoozeDuration} onValueChange={setUseSnoozeDuration} style={styles.toggle} />
              <Text>Snooze Duration (s):</Text>
            </View>
            <TextInput 
              style={[styles.input, !useSnoozeDuration && styles.disabledInput]} 
              value={snoozeDuration} 
              onChangeText={setSnoozeDuration} 
              keyboardType="numeric" 
              editable={useSnoozeDuration}
            />
          </View>
        </ScrollView>
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.configButtonRow}>
          <View style={styles.configButtonWrapper}>
            <Button 
              title={isConfigured ? "✓ App Group Configured" : "Configure App Group"} 
              onPress={() => setShowConfigModal(true)} 
              color={isConfigured ? "#4CAF50" : "#2196F3"}
            />
          </View>
        </View>
        <Button title="Request Permissions" onPress={requestPermissions} />
        <Button title="Schedule Alarm (5s)" onPress={scheduleOneTimeAlarm} />
        <Button title="Schedule Alarm with Date (5s)" onPress={scheduleOneTimeAlarmWithDate} />
        <Button title="Schedule Weekday Alarm (8:30)" onPress={scheduleRepeatingAlarm} />
        <Button title="Cancel Last Alarm" onPress={cancelLastAlarm} color="red" />
        <Button title="Refresh List" onPress={refreshAlarms} />
        <Button title="Clear All Alarms (UserDefaults)" onPress={() => {
          AlarmKit.clearAllAlarms();
          setStatus('Cleared all alarms from UserDefaults');
          refreshAlarms();
        }} color="orange" />
      </View>

      <Modal
        visible={showConfigModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configure App Group</Text>
            <Text style={styles.modalSubtitle}>Enter your App Group identifier</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., group.com.example.alarmkit"
              value={appGroupInput}
              onChangeText={setAppGroupInput}
              placeholderTextColor="#999"
            />
            
            <Text style={styles.modalInfo}>
              The App Group must match the one configured in your iOS project capabilities.
            </Text>
            
            <View style={styles.modalButtonContainer}>
              <View style={styles.modalButtonWrapper}>
                <Button 
                  title="Cancel" 
                  onPress={() => setShowConfigModal(false)} 
                  color="#888"
                />
              </View>
              <View style={styles.modalButtonWrapper}>
                <Button 
                  title="Configure" 
                  onPress={handleConfigureAppGroup} 
                  color="#2196F3"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statusContainer: {
    width: '100%',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusText: {
    color: '#333',
  },
  listContainer: {
    width: '100%',
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionsContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionsHeader: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  optionsScroll: {
    flex: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  optionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggle: {
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
    marginRight: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 5,
    width: 150,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  listLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scrollView: {
    flex: 1,
  },
  alarmItem: {
    paddingVertical: 2,
    fontSize: 14,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  configButtonRow: {
  },
  configButtonWrapper: {
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  modalInfo: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButtonWrapper: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
