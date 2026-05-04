import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Screen } from '@/components/Screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome6 } from '@expo/vector-icons';

interface User {
  id: number;
  device_id: string;
  nickname: string;
  is_vip: boolean;
  vip_expire_date: string | null;
  created_at: string;
}

const getBackendUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    return `http://localhost:9091`;
  }
  return process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';
};

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('device_id', deviceId);
      }

      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/v1/user`, {
        headers: { 'x-user-id': deviceId },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setNickname(data.nickname || '');
      }
    } catch (error) {
      console.error('获取用户失败:', error);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleSaveNickname = async () => {
    if (!nickname.trim()) {
      Alert.alert('提示', '请输入昵称');
      return;
    }
    setLoading(true);
    try {
      const deviceId = await AsyncStorage.getItem('device_id');
      const backendUrl = getBackendUrl();
      await fetch(`${backendUrl}/api/v1/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': deviceId || '' },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      setEditModalVisible(false);
      fetchUser();
    } catch (error) {
      Alert.alert('错误', '保存失败');
    }
    setLoading(false);
  };

  const handleUpgradeVIP = () => {
    Alert.alert(
      '开通VIP会员',
      '确定要开通30天VIP会员吗？\n\n尊享权益：\n• AI智能推荐无限使用\n• 专属冲煮方案\n• 优先客服支持',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '立即开通',
          onPress: async () => {
            try {
              const deviceId = await AsyncStorage.getItem('device_id');
              const backendUrl = getBackendUrl();
              await fetch(`${backendUrl}/api/v1/user/vip`, {
                method: 'POST',
                headers: { 'x-user-id': deviceId || '' },
              });
              fetchUser();
              Alert.alert('恭喜', 'VIP会员开通成功！');
            } catch (error) {
              Alert.alert('错误', '开通失败');
            }
          },
        },
      ]
    );
  };

  const getVIPDaysLeft = () => {
    if (!user?.vip_expire_date) return 0;
    const expire = new Date(user.vip_expire_date);
    const now = new Date();
    const diff = expire.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👤 我的</Text>
      </View>

      <View style={styles.content}>
        {/* 用户卡片 */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <FontAwesome6 name="user" size={32} color="#fff" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.nickname}>{user?.nickname || '咖啡爱好者'}</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(true)}>
              <Text style={styles.editText}>✏️ 编辑昵称</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* VIP卡片 */}
        {user?.is_vip ? (
          <View style={[styles.vipCard, styles.vipCardActive]}>
            <View style={styles.vipHeader}>
              <Text style={styles.vipTitle}>👑 VIP会员</Text>
              <Text style={styles.vipDays}>剩余 {getVIPDaysLeft()} 天</Text>
            </View>
            <Text style={styles.vipExpire}>到期时间：{formatDate(user.vip_expire_date || '')}</Text>
            <View style={styles.vipBenefits}>
              <Text style={styles.vipBenefit}>✓ AI智能推荐无限使用</Text>
              <Text style={styles.vipBenefit}>✓ 专属冲煮方案</Text>
              <Text style={styles.vipBenefit}>✓ 优先客服支持</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.vipCard} onPress={handleUpgradeVIP}>
            <Text style={styles.vipCardTitle}>👑 开通VIP会员</Text>
            <Text style={styles.vipCardDesc}>解锁更多高级功能</Text>
            <View style={styles.vipCardBtn}>
              <Text style={styles.vipCardBtnText}>立即开通</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* 统计数据 */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>使用统计</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>-</Text>
              <Text style={styles.statLabel}>冲煮次数</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.is_vip ? '∞' : '5'}</Text>
              <Text style={styles.statLabel}>AI推荐次数</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>-</Text>
              <Text style={styles.statLabel}>累计天数</Text>
            </View>
          </View>
        </View>

        {/* 会员等级 */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelTitle}>会员等级</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{user?.is_vip ? 'VIP' : '普通会员'}</Text>
          </View>
        </View>
      </View>

      {/* 编辑昵称弹窗 */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>修改昵称</Text>
            <TextInput
              style={styles.modalInput}
              value={nickname}
              onChangeText={setNickname}
              placeholder="请输入昵称"
              placeholderTextColor="#9E8B7D"
              maxLength={20}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveNickname} disabled={loading}>
                <Text style={styles.modalSaveText}>{loading ? '保存中...' : '保存'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
    padding: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6F4E37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  nickname: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3D2914',
  },
  editText: {
    fontSize: 14,
    color: '#9E8B7D',
    marginTop: 4,
  },
  vipCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#C4A77D',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  vipCardActive: {
    backgroundColor: 'linear-gradient(135deg, #6F4E37, #8B6B4D)',
  },
  vipCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6F4E37',
    marginBottom: 4,
  },
  vipCardDesc: {
    fontSize: 14,
    color: '#9E8B7D',
  },
  vipCardBtn: {
    backgroundColor: '#6F4E37',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  vipCardBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  vipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C9A96E',
  },
  vipDays: {
    fontSize: 14,
    color: '#C9A96E',
  },
  vipExpire: {
    fontSize: 12,
    color: '#9E8B7D',
    marginBottom: 12,
  },
  vipBenefits: {
    gap: 4,
  },
  vipBenefit: {
    fontSize: 13,
    color: '#3D2914',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D2914',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6F4E37',
  },
  statLabel: {
    fontSize: 12,
    color: '#9E8B7D',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0E6DC',
  },
  levelCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  levelHeader: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D2914',
  },
  levelBadge: {
    backgroundColor: '#6F4E37',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  levelBadgeText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3D2914',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#3D2914',
  },
  modalBtns: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5E6D3',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#6F4E37',
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#6F4E37',
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '600',
  },
});
