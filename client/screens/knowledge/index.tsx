import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/Screen';
import { router } from 'expo-router';

interface Article {
  id: number;
  title: string;
  category: string;
  content: string;
  cover_image: string;
  read_count: number;
}

const categories = ['全部', '入门', '进阶', '技巧', '品鉴'];

const getBackendUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    return `http://localhost:9091`;
  }
  return process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';
};

export default function KnowledgeScreen() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');

  const fetchArticles = useCallback(async () => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/v1/knowledge`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      }
    } catch (error) {
      console.error('获取知识库失败:', error);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const filteredArticles = selectedCategory === '全部'
    ? articles
    : articles.filter(a => a.category === selectedCategory);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 咖啡知识库</Text>
        <Text style={styles.headerSubtitle}>学习手冲咖啡技巧</Text>
      </View>

      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryItem, selectedCategory === item && styles.categoryItemActive]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[styles.categoryText, selectedCategory === item && styles.categoryTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              router.push({
                pathname: '/knowledge-detail',
                params: {
                  id: item.id.toString(),
                  title: item.title,
                  content: item.content,
                  category: item.category,
                  readCount: item.read_count.toString(),
                },
              });
            }}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.cardMeta}>
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>{item.category}</Text>
                </View>
                <Text style={styles.readCount}>👁 {item.read_count}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
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
  categoryContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E6DC',
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5E6D3',
  },
  categoryItemActive: {
    backgroundColor: '#6F4E37',
  },
  categoryText: {
    fontSize: 14,
    color: '#6F4E37',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    padding: 16,
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
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D2914',
    flex: 1,
  },
  cardMeta: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  categoryTag: {
    backgroundColor: '#C4A77D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  categoryTagText: {
    fontSize: 11,
    color: '#fff',
  },
  readCount: {
    fontSize: 12,
    color: '#9E8B7D',
  },
});
