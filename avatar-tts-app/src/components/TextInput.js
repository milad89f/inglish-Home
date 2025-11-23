import React from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
} from 'react-native';

const TextInput = ({ value, onChangeText, placeholder, multiline = true, language = 'english' }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {language === 'turkish' ? 'Metninizi Girin:' : 'Enter Your Text:'}
      </Text>
      <RNTextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        maxLength={500}
        returnKeyType="done"
        blurOnSubmit={true}
      />
      <Text style={styles.characterCount}>
        {language === 'turkish' 
          ? `${value.length}/500 karakter` 
          : `${value.length}/500 characters`
        }
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 3,
    borderColor: '#444444',
    borderRadius: 15,
    padding: 18,
    fontSize: 16,
    backgroundColor: '#2a2a2a',
    color: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    fontWeight: '500',
  },
  multilineInput: {
    height: 140,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 13,
    color: '#E0E0E0',
    textAlign: 'right',
    marginTop: 8,
    fontWeight: '500',
  },
});

export default TextInput;
