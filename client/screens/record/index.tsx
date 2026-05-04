import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/Screen';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome6 } from '@expo/vector-icons';

const ratios = ['1:12', '1:13', '1:14', '1:15', '1:16', '1:17', '1:18'];
const waterTemps = ['85', '88', '90', '91', '92', '93', '94', '95', '96'];
const equipmentList = ['V60', 'Kalita Wave', 'Chemex', 'AeroPress', '法压壶', '聪明杯'];

const getBackendUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    return `http://localhost:9091`;
  }
  return process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';
};

export default function RecordScreen() {
  const params = useLocalSearchParams();
  const isEdit = !!params.id;

  const [region, setRegion] = useState((params.region as string) || '');
  const [ratio, setRatio] = useState((params.ratio as string) || '1:15');
  const [brewTime, setBrewTime] = useState(params.brewTime ? String(params.brewTime) : '150');
  const [waterTemp, setWaterTemp] = useState((params.waterTemp as string) || '93');
  const [equipment, setEquipment] = useState((params.equipment as string) || '');
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!region.trim()) {
      Alert.alert('提示', '请输入咖啡豆产区');
      return;
    }
    if (!brewTime || parseInt(brewTime) <= 0) {
      Alert.alert('提示', '请输入有效的冲煮时间');
      return;
    }

    setSaving(true);
    try {
      const deviceId = await AsyncStorage.getItem('device_id');
      const backendUrl = getBackendUrl();
      const payload = {
        region: region.trim(),
        ratio,
        brewTime: parseInt(brewTime),
        waterTemp: parseInt(waterTemp),
        equipment: equipment || null,
      };

      let response;
      if (isEdit) {
        response = await fetch(`${backendUrl}/api/v1/coffee-records/${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-user-id': deviceId || '' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${backendUrl}/api/v1/coffee-records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': deviceId || '' },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        router.back();
      } else {
        Alert.alert('错误', '保存失败');
      }
    } catch (error) {
      Alert.alert('错误', '保存失败');
    }
    setSaving(false);
  };

  const handleAIRecommend = async () => {
    if (!region.trim()) {
      Alert.alert('提示', '请先输入咖啡豆产区');
      return;
    }

    setLoadingAI(true);
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/v1/coffee-records/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: region.trim(),
          ratio,
          brewTime: parseInt(brewTime) || 150,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiRecommendation(data.recommendation);
        if (data.equipment) setEquipment(data.equipment);
        if (data.waterTemp) setWaterTemp(String(data.waterTemp));
      } else {
        setAiRecommendation('抱歉，AI服务暂时不可用，请稍后重试。');
      }
    } catch (error) {
      setAiRecommendation('网络错误，请检查网络连接后重试。');
    }
    setLoadingAI(false);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome6 name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? '✏️ 编辑记录' : '☕ 新增记录'}</Text>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
        {/* 产区 */}
        <View style={styles.field}>
          <Text style={styles.label}>咖啡豆产区</Text>
          <TextInput
            style={styles.input}
            value={region}
            onChangeText={setRegion}
            placeholder="如：埃塞俄比亚 耶加雪菲"
            placeholderTextColor="#9E8B7D"
          />
        </View>

        {/* 粉水比 */}
        <View style={styles.field}>
          <Text style={styles.label}>粉水比</Text>
          <View style={styles.optionGroup}>
            {ratios.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.option, ratio === r && styles.optionActive]}
                onPress={() => setRatio(r)}
              >
                <Text style={[styles.optionText, ratio === r && styles.optionTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 冲煮时间 */}
        <View style={styles.field}>
          <Text style={styles.label}>冲煮时间（秒）</Text>
          <View style={styles.timeRow}>
            <TextInput
              style={[styles.input, styles.timeInput]}
              value={brewTime}
              onChangeText={setBrewTime}
              keyboardType="number-pad"
              placeholder="150"
              placeholderTextColor="#9E8B7D"
            />
            <Text style={styles.timeHint}>
              ≈ {Math.floor((parseInt(brewTime) || 0) / 60)}分{(parseInt(brewTime) || 0) % 60}秒
            </Text>
          </View>
        </View>

        {/* 水温 */}
        <View style={styles.field}>
          <Text style={styles.label}>水温（°C）</Text>
          <View style={styles.optionGroup}>
            {waterTemps.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.option, waterTemp === t && styles.optionActive]}
                onPress={() => setWaterTemp(t)}
              >
                <Text style={[styles.optionText, waterTemp === t && styles.optionTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 器具 */}
        <View style={styles.field}>
          <Text style={styles.label}>冲煮器具</Text>
          <View style={styles.optionGroup}>
            {equipmentList.map((e) => (
              <TouchableOpacity
                key={e}
                style={[styles.option, equipment === e && styles.optionActive]}
                onPress={() => setEquipment(equipment === e ? '' : e)}
              >
                <Text style={[styles.optionText, equipment === e && styles.optionTextActive]}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* AI推荐 */}
        <TouchableOpacity
          style={styles.aiButton}
          onPress={handleAIRecommend}
          disabled={loadingAI}
        >
          {loadingAI ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <FontAwesome6 name="magic" size={16} color="#fff" />
              <Text style={styles.aiButtonText}>🤖 AI智能推荐器具</Text>
            </>
          )}
        </TouchableOpacity>

        {aiRecommendation && (
          <View style={styles.aiResult}>
            <Text style={styles.aiResultTitle}>💡 AI推荐</Text>
            <Text style={styles.aiResultText}>{aiRecommendation}</Text>
          </View>
        )}

        {/* 保存按钮 */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>{isEdit ? '保存修改' : '保存记录'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#6F4E37',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 20,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D2914',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#3D2914',
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    backgroundColor: '#F5E6D3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  optionActive: {
    backgroundColor: '#6F4E37',
  },
  optionText: {
    fontSize: 14,
    color: '#6F4E37',
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  timeInput: {
    flex: 1,
  },
  timeHint: {
    fontSize: 14,
    color: '#9E8B7D',
  },
  aiButton: {
    backgroundColor: '#C4A77D',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  aiResult: {
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  aiResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6F4E37',
    marginBottom: 8,
  },
  aiResultText: {
    fontSize: 14,
    color: '#3D2914',
    lineHeight: 22,
  },
  saveButton: {
    backgroundColor: '#6F4E37',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
