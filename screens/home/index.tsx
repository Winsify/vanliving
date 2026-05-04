import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Screen } from '@/components/Screen';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome6 } from '@expo/vector-icons';

interface CoffeeRecord {
  id: number;
  region: string;
  ratio: string;
  brew_time: number;
  water_temp: number;
  equipment: string | null;
  created_at: string;
}

const getBackendUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    return `http://localhost:9091`;
  }
  return process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';
};

export default function HomeScreen() {
  const [records, setRecords] = useState<CoffeeRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/v1/coffee-records`);
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('获取记录失败:', error);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecords();
    setRefreshing(false);
  }, [fetchRecords]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: CoffeeRecord }) => (
    <Link href={`/record?id=${item.id}&region=${encodeURIComponent(item.region)}&ratio=${encodeURIComponent(item.ratio)}&brewTime=${item.brew_time}&waterTemp=${item.water_temp || 93}&equipment=${encodeURIComponent(item.equipment || '')}`} asChild>
      <TouchableOpacity style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.region}</Text>
          <Text style={styles.cardTime}>{formatTime(item.brew_time)}</Text>
        </View>
        <View style={styles.cardTags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.ratio}</Text>
          </View>
          {item.water_temp && (
            <View style={[styles.tag, styles.tagAccent]}>
              <Text style={[styles.tagText, styles.tagTextAccent]}>{item.water_temp}°C</Text>
            </View>
          )}
          {item.equipment && (
            <View style={[styles.tag, styles.tagPurple]}>
              <Text style={[styles.tagText, styles.tagTextPurple]}>{item.equipment}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>☕ Vanliving</Text>
        <Text style={styles.headerSubtitle}>手冲咖啡记录</Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6F4E37" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome6 name="coffee" size={64} color="#D4C4B5" />
            <Text style={styles.emptyText}>还没有记录</Text>
            <Text style={styles.emptySubtext}>点击下方按钮添加第一条咖啡记录</Text>
          </View>
        }
      />

      <Link href="/record" asChild>
        <TouchableOpacity style={styles.fab}>
          <FontAwesome6 name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#6F4E37',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#D4C4B5',
    marginTop: 4,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3D2914',
    flex: 1,
  },
  cardTime: {
    fontSize: 14,
    color: '#9E8B7D',
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F5E6D3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    color: '#6F4E37',
  },
  tagAccent: {
    backgroundColor: '#C4A77D',
  },
  tagTextAccent: {
    color: '#fff',
  },
  tagPurple: {
    backgroundColor: '#E8E0F0',
  },
  tagTextPurple: {
    color: '#6B4E8B',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6F4E37',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#9E8B7D',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C4B5A5',
    marginTop: 8,
  },
});
