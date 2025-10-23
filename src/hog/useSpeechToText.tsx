import { useEffect, useState } from "react";
import Voice from "@react-native-voice/voice";

export function useSpeechToText(){
    const [text, setText] = useState('');
    const [isReacognizing, setIsRecognizing] = useState(false);

    useEffect(() => {
        Voice.onSpeechStart = () => setIsRecognizing(true);
        Voice.onSpeechEnd = () => setIsRecognizing(false);
        Voice.onSpeechResults = (event) => {
            const result = event.value?.[0] || '';
            setText(result);
            console.log("🗣️ Recognized text:", result);
        };

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        }

    }, []);

    async function start() {
        try {
            await Voice.start('id-ID');
        } catch (e) {
            console.error("❌ Speech recognition start error:", e);
        }
    }

    async function stop() {
        try {
            await Voice.stop();
        } catch (e) {
            console.error("❌ Speech recognition stop error:", e);
        }
    }

    return { text, isReacognizing, start, stop, setText };
}