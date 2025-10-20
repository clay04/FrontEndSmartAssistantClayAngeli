import React from 'react'

type LoginData = {
    username: string;
    password: string;
}

type LoginContextType = {
    data: LoginData;
    setField: (key: keyof LoginData, value: string) => void;
    reset: () => void;
}

const LoginContext = React.createContext<LoginContextType | undefined>(undefined);

const LoginProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [data, setData] = React.useState<LoginData>({
        username: '',
        password: '',
    });

    const setField = (key: keyof LoginData, value: string) => {
        setData(prev => ({...prev, [key]: value}));
    }

    const reset = () => setData({
        username: '',
        password: '',
    });

    return (
        <LoginContext.Provider value={{data, setField, reset}}>
            {children}
        </LoginContext.Provider>
    )
}

export default LoginProvider

export const useLogin = () => {
    const ctx = React.useContext(LoginContext);
    if (!ctx) {
        throw new Error("useLogin must be used within a LoginProvider");
    }
    return ctx;
}