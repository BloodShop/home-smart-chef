import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ingredient, IngredientCategory } from '../../src/types';
import { loadIngredients, saveIngredients } from '../../src/utils/storage';
import { translations } from '../../src/i18n/translations';

const t = translations.he;

const CATEGORIES: { key: IngredientCategory; label: string; emoji: string }[] = [
  { key: 'fridge', label: t.categoryFridge, emoji: '🧊' },
  { key: 'pantry', label: t.categoryPantry, emoji: '🗄️' },
  { key: 'freezer', label: t.categoryFreezer, emoji: '❄️' },
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function IngredientRow({
  item,
  onDelete,
}: {
  item: Ingredient;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={styles.ingredientRow}>
      <View style={styles.ingredientInfo}>
        <Text style={styles.ingredientName}>{item.nameHe}</Text>
        <Text style={styles.ingredientMeta}>
          {item.quantity} {item.unit}
          {item.expiryDate ? ` · תוקף: ${item.expiryDate}` : ''}
        </Text>
      </View>
      <View style={styles.ingredientActions}>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
          <Text style={styles.categoryBadgeText}>
            {CATEGORIES.find((c) => c.key === item.category)?.emoji}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getCategoryColor(cat: IngredientCategory): string {
  switch (cat) {
    case 'fridge': return '#E3F2FD';
    case 'pantry': return '#FFF9C4';
    case 'freezer': return '#E8EAF6';
  }
}

export default function IngredientsScreen() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [activeCategory, setActiveCategory] = useState<IngredientCategory | 'all'>('all');
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [nameHe, setNameHe] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [category, setCategory] = useState<IngredientCategory>('fridge');

  useEffect(() => {
    loadIngredients().then(setIngredients);
  }, []);

  const handleAddIngredient = useCallback(async () => {
    if (!nameHe.trim()) {
      Alert.alert(t.error, 'אנא הכנס שם מצרך');
      return;
    }
    const newIngredient: Ingredient = {
      id: generateId(),
      nameHe: nameHe.trim(),
      nameEn: nameHe.trim(), // placeholder
      quantity: quantity || '1',
      unit: unit || 'יחידות',
      category,
      expiryDate: expiryDate || undefined,
    };
    const updated = [...ingredients, newIngredient];
    await saveIngredients(updated);
    setIngredients(updated);
    setModalVisible(false);
    setNameHe('');
    setQuantity('');
    setUnit('');
    setExpiryDate('');
    setCategory('fridge');
  }, [nameHe, quantity, unit, expiryDate, category, ingredients]);

  const handleDelete = useCallback(async (id: string) => {
    const updated = ingredients.filter((i) => i.id !== id);
    await saveIngredients(updated);
    setIngredients(updated);
  }, [ingredients]);

  const filtered = activeCategory === 'all'
    ? ingredients
    : ingredients.filter((i) => i.category === activeCategory);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Category filter tabs */}
        <View style={styles.categoryTabs}>
          <TouchableOpacity
            style={[styles.catTab, activeCategory === 'all' && styles.catTabActive]}
            onPress={() => setActiveCategory('all')}
          >
            <Text style={[styles.catTabText, activeCategory === 'all' && styles.catTabTextActive]}>
              הכל
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map(({ key, label, emoji }) => (
            <TouchableOpacity
              key={key}
              style={[styles.catTab, activeCategory === key && styles.catTabActive]}
              onPress={() => setActiveCategory(key)}
            >
              <Text style={[styles.catTabText, activeCategory === key && styles.catTabTextActive]}>
                {emoji} {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Smart Home sync button (placeholder) */}
        <TouchableOpacity style={styles.syncBtn} onPress={() => Alert.alert('בקרוב!', 'סנכרון Smart Home יהיה זמין בקרוב')}>
          <Text style={styles.syncBtnText}>{t.smartHomeSync}</Text>
        </TouchableOpacity>

        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyText}>{t.noIngredients}</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <IngredientRow item={item} onDelete={handleDelete} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Text style={styles.fabText}>+ {t.addIngredient}</Text>
        </TouchableOpacity>
      </View>

      {/* Add ingredient modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.addIngredient}</Text>

            <Text style={styles.inputLabel}>{t.ingredientName} *</Text>
            <TextInput
              style={styles.input}
              value={nameHe}
              onChangeText={setNameHe}
              placeholder="לדוגמה: עגבניות"
              textAlign="right"
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>{t.ingredientQuantity}</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="4"
                  keyboardType="numeric"
                  textAlign="right"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>{t.ingredientUnit}</Text>
                <TextInput
                  style={styles.input}
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="גרם / יחידות"
                  textAlign="right"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>{t.ingredientExpiry}</Text>
            <TextInput
              style={styles.input}
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="YYYY-MM-DD"
              textAlign="right"
            />

            <Text style={styles.inputLabel}>קטגוריה</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map(({ key, label, emoji }) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.catChip, category === key && styles.catChipSelected]}
                  onPress={() => setCategory(key)}
                >
                  <Text style={[styles.catChipText, category === key && styles.catChipTextSelected]}>
                    {emoji} {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddIngredient}>
                <Text style={styles.saveBtnText}>{t.add}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ORANGE = '#FF6B35';
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F3' },
  container: { flex: 1 },
  categoryTabs: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8,
    flexWrap: 'wrap',
  },
  catTab: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ddd',
  },
  catTabActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  catTabText: { fontSize: 13, color: '#666', fontWeight: '600' },
  catTabTextActive: { color: '#fff' },
  syncBtn: {
    marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 10,
    backgroundColor: '#E3F2FD', borderWidth: 1, borderColor: '#90CAF9',
    alignItems: 'center',
  },
  syncBtnText: { color: '#1565C0', fontWeight: '600', fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#999', fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  listContent: { paddingHorizontal: 16, paddingBottom: 80, gap: 8 },
  ingredientRow: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  ingredientInfo: { flex: 1 },
  ingredientName: { fontSize: 15, fontWeight: '700', color: '#222', textAlign: 'right' },
  ingredientMeta: { fontSize: 12, color: '#888', textAlign: 'right', marginTop: 2 },
  ingredientActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  categoryBadgeText: { fontSize: 16 },
  deleteBtn: { padding: 6 },
  deleteBtnText: { color: '#FF5252', fontSize: 16, fontWeight: 'bold' },
  fab: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    backgroundColor: ORANGE, borderRadius: 14, padding: 16, alignItems: 'center',
    shadowColor: ORANGE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#222', textAlign: 'right', marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#555', textAlign: 'right', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12,
    fontSize: 15, borderWidth: 1, borderColor: '#E0E0E0',
  },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
    backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0',
  },
  catChipSelected: { backgroundColor: ORANGE, borderColor: ORANGE },
  catChipText: { fontSize: 13, color: '#555' },
  catChipTextSelected: { color: '#fff', fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, color: '#666', fontWeight: '600' },
  saveBtn: {
    flex: 2, padding: 14, borderRadius: 12, backgroundColor: ORANGE,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 15, color: '#fff', fontWeight: 'bold' },
});
