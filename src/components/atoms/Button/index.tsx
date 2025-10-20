import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'

const index = ({
    label,
    backgroundColor = backgroundColor,
    borderRadius = borderRadius,
    textColor = '#FFFFFF',
    width,
    fontFamily,
    onPress
}) => {
  return (
    <View style={styles.buttonContainer(borderRadius, width)}>
        <TouchableOpacity
        style={styles.container(backgroundColor, borderRadius)}
        activeOpacity={0.7}
        onPress={onPress}
        >
            <Text style={styles.label(textColor, fontFamily)}>{label}</Text>
        </TouchableOpacity>
    </View>
  )
}

export default index

const styles = StyleSheet.create({
    buttonContainer: (borderRadisus, width) => ({
        borderRadius: borderRadisus,
        width: width,
    }),
    container: (backgroundColor, borderRadius) => ({
        backgroundColor: backgroundColor,
        borderRadius: borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        height: 35,
    }),

    label: (textColor, fontFamily) => ({
        textAlign: 'center',
        color: textColor,
        fontSize: 14,
        fontFamily: fontFamily,
    })
})