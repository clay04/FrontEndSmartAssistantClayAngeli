import React, { createContext, useContext, useState } from 'react'

type RegisterData = {
    first_name: string;
    last_name: string;
    username: string;
    password: string;
}

type RegisterContextType = {
    data: RegisterData;
    setField: (key: keyof RegisterData, value: string) => void;
    reset: () => void;
}

const RegisterContext = createContext<RegisterContextType | undefined>(undefined);

const RegisterProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [data, setData] = useState<RegisterData>({
        first_name: '',
        last_name: '',
        username: '',
        password: '',
    });

    const setField = (key: keyof RegisterData, value: string) => {
        setData(prev => ({...prev, [key]: value}));
    }

    const reset = () => setData({
        first_name: '',
        last_name: '',
        username: '',
        password: '',
    });

    return (
        <RegisterContext.Provider value={{data, setField, reset}}>
            {children}
        </RegisterContext.Provider>
    )
}

export default RegisterProvider

export const useRegister = () => {
    const ctx = useContext(RegisterContext);
    if (!ctx) {
        throw new Error("useRegister must be used within a RegisterProvider");
    }
    return ctx;
}