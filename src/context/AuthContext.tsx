
import { createContext } from 'react'

type AuthContextType = {
    role: string, 
    userId: string,
    onRoleChange: (role: string) => void,
}

const AuthContext = createContext<AuthContextType | null>(null);

export { AuthContext };