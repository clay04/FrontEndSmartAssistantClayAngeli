import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'

const index = ({
    label,
    backgroundColor = '#7A45FF',
    borderRadius = 8,
    textColor = '#FFFFFF',
    onPress
}) => {
  return (
    <View>
        <TouchableOpacity
        style={styles.container(backgroundColor, borderRadius)}
        activeOpacity={0.7}
        onPress={onPress}
        >
            <Text style={styles.label(textColor)}>{label}</Text>
        </TouchableOpacity>
    </View>
  )
}

export default index

const styles = StyleSheet.create({
    container: (backgroundColor, borderRadius) => ({
        backgroundColor: backgroundColor,
        paddingVertical: 2,
        borderRadisus: borderRadius,
        width: 68,
        height: 25,
    }),

    label: (textColor) => ({
        textAlign: 'center',
        color: textColor,
        fontSize: 12,
        fontFamily: 'Onest-Medium',
    })
})