import { StyleSheet, Text, View, TextInput } from 'react-native'
import React from 'react'

interface TextInputProps {
    label : string;
    placeholder : string;
    value : string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    error?: string;
}

const TextInputComponent = ({
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
    error
}: TextInputProps
) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        style={[styles.input,
            error ? {borderColor: 'red'} : {borderColor: 'gray'}
        ]}
      />
      {error && <Text style={{color: 'red'}}>{error}</Text>}
    </View>
  )
}

export default TextInputComponent

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },

    label: {
        fontSize: 16,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1.2,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: "#fff",
    },
    error: {
        marginTop: 4,
        color: "#ff4444",
        fontSize: 13,
    }
})