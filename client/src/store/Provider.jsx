import Context from './Context';
import CryptoJS from 'crypto-js';
import cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import { requestAuth } from '../config/request';

export function Provider({ children }) {
    const [dataUser, setDataUser] = useState({});
    const [isAuthLoading, setIsAuthLoading] = useState(!!cookies.get('logged'));

    const fetchAuth = async () => {
        try {
            const res = await requestAuth();
            const bytes = CryptoJS.AES.decrypt(res.metadata, import.meta.env.VITE_SECRET_CRYPTO);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            if (!originalText) {
                console.error('Failed to decrypt data');
                return;
            }
            const user = JSON.parse(originalText);
            setDataUser(user);
        } catch (error) {
            console.error('Auth error:', error);
        } finally {
            setIsAuthLoading(false);
        }
    };

    useEffect(() => {
        const token = cookies.get('logged');
        if (!token) {
            setIsAuthLoading(false);
            return;
        }
        fetchAuth();
    }, []);

    return (
        <Context.Provider
            value={{
                dataUser,
                isAuthLoading,
                fetchAuth,
                setDataUser,
            }}
        >
            {children}
        </Context.Provider>
    );
}
