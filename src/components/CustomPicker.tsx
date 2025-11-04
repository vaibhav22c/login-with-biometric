import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Country } from '../types';

interface CustomPickerProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  items: Country[];
  error?: string;
  touched?: boolean;
}

const CustomPicker: React.FC<CustomPickerProps> = ({
  label,
  value,
  onValueChange,
  items,
  error,
  touched,
}) => {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const hasError = touched && error;

  const selectedCountry = items.find(item => item.code === value);
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.pickerButton,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.inputBackground,
          },
          hasError && { borderColor: theme.colors.error },
        ]}
        onPress={() => setModalVisible(true)}
        accessibilityLabel={label}
        accessibilityHint="Opens country selection"
      >
        <Text
          style={[
            styles.pickerText,
            { color: value ? theme.colors.text : theme.colors.placeholder },
          ]}
        >
          {selectedCountry ? selectedCountry.name : 'Select a country'}
        </Text>
        <Text style={[styles.arrow, { color: theme.colors.textSecondary }]}>▼</Text>
      </TouchableOpacity>
      {hasError && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View
              style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Select Country
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: theme.colors.textSecondary }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.searchInput,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                },
              ]}
              placeholder="Search countries..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.placeholder}
            />
            <FlatList
              data={filteredItems}
              keyExtractor={item => item.code}
              renderItem={({ item }) => {
                const isSelected = item.code === value;
                const selectedBgColor = theme.isDark ? '#1A3A52' : '#E3F2FD';
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.countryItem,
                      { borderBottomColor: theme.colors.border },
                      isSelected && { backgroundColor: selectedBgColor },
                    ]}
                    onPress={() => {
                      onValueChange(item.code);
                      setModalVisible(false);
                      setSearchQuery('');
                    }}
                  >
                    <Text style={[styles.countryName, { color: theme.colors.text }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.countryCode, { color: theme.colors.textSecondary }]}>
                      {item.phoneCode}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pickerText: {
    fontSize: 16,
  },
  arrow: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
  },
  searchInput: {
    margin: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  countryName: {
    fontSize: 16,
  },
  countryCode: {
    fontSize: 14,
  },
});

export default CustomPicker;

