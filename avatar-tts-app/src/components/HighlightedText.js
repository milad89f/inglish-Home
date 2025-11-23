import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

const HighlightedText = ({ words, style }) => {
  if (!words || words.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>
        {words.map((wordObj, index) => (
          <Text
            key={index}
            style={[
              styles.word,
              !wordObj.isCorrect && styles.incorrectWord,
            ]}
          >
            {wordObj.word}
            {index < words.length - 1 && ' '}
          </Text>
        ))}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  text: {
    fontSize: 14,
    color: '#E0E0E0',
    lineHeight: 24,
  },
  word: {
    fontSize: 14,
    color: '#E0E0E0',
  },
  incorrectWord: {
    color: '#FF0000', // أحمر داكن وواضح للكلمات الخاطئة
    backgroundColor: '#FF000020', // خلفية حمراء فاتحة
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    textDecorationColor: '#FF0000',
    paddingHorizontal: 2,
    borderRadius: 3,
  },
});

export default HighlightedText;















