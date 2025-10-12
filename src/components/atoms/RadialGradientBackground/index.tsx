import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

export default function RadialGradientBackground({
  centerColor = '#6C54A8',
  edgeColor = '#160B33',
  radius = '80%',
  children,
}) {
  return (
    <View style={styles.container}>
      <Svg height="100%" width="100%" >
        <Defs>
          <RadialGradient
            id="grad"
            cx="15%"
            cy="10%"
            r={radius}
            fx="30%"
            fy="20%"
          >
            <Stop offset="0%" stopColor={centerColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={edgeColor} stopOpacity="1" />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
      </Svg>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
})