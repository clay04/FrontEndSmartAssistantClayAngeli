import {StyleSheet, View} from 'react-native';
import React from 'react';

const Gap = ({height}: {height?: number | string}) => {
  return <View style={styles.gap(height)} />;
};

export default Gap;

const styles = StyleSheet.create({
  gap: height => ({
    height: height,
  })
});