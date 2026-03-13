import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.6 }}>
      {emoji}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#eee', height: 60 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
        headerStyle: { backgroundColor: '#FF6B35' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'בית',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          headerTitle: 'HomeSmartChef 🍳',
        }}
      />
      <Tabs.Screen
        name="ingredients"
        options={{
          title: 'מצרכים',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" focused={focused} />,
          headerTitle: 'מה יש לי בבית',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'הגדרות',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
          headerTitle: 'הגדרות ופרופיל',
        }}
      />
    </Tabs>
  );
}
