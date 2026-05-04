import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/Screen';
import { router, useLocalSearchParams } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';

export default function KnowledgeDetailScreen() {
  const params = useLocalSearchParams();
  const [expanded, setExpanded] = useState(false);

  const content = (params.content as string) || '';
  const title = (params.title as string) || '知识详情';
  const category = (params.category as string) || '技巧';
  const readCount = parseInt((params.readCount as string) || '0');

  const paragraphs = content.split('\n\n').filter(p => p.trim());

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome6 name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.meta}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{category}</Text>
          </View>
          <Text style={styles.readCount}>👁 {readCount} 阅读</Text>
        </View>

        <Text style={styles.title}>{title}</Text>

        {paragraphs.map((paragraph, index) => (
          <View key={index} style={styles.paragraph}>
            {paragraph.startsWith('## ') ? (
              <Text style={styles.heading2}>{paragraph.replace('## ', '')}</Text>
            ) : paragraph.startsWith('**') && paragraph.endsWith('**') ? (
              <Text style={styles.bold}>{paragraph.replace(/\*\*/g, '')}</Text>
            ) : paragraph.startsWith('- **') ? (
              <View style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{paragraph.replace('- **', '').replace('**', '')}</Text>
              </View>
            ) : (
              <Text style={styles.text}>{paragraph}</Text>
            )}
          </View>
        ))}
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
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  categoryTag: {
    backgroundColor: '#C4A77D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  readCount: {
    color: '#9E8B7D',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3D2914',
    marginBottom: 20,
  },
  paragraph: {
    marginBottom: 16,
  },
  heading2: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3D2914',
    marginTop: 16,
    marginBottom: 8,
  },
  bold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3D2914',
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    color: '#3D2914',
    lineHeight: 24,
  },
  listItem: {
    flexDirection: 'row',
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 14,
    color: '#6F4E37',
    marginRight: 8,
    lineHeight: 24,
  },
  listText: {
    fontSize: 15,
    color: '#3D2914',
    lineHeight: 24,
    flex: 1,
  },
});
