import React, { createContext, useState, useEffect, useContext } from 'react';
import { settingService } from '../services/setting';

const SettingContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingProvider');
    }
    return context;
};

export const SettingProvider = ({ children }) => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await settingService.getSettings();
            setSettings(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const refreshSettings = () => {
        return fetchSettings();
    };

    const getSetting = (key, defaultValue = null) => {
        return settings[key] !== undefined ? settings[key] : defaultValue;
    };

    const value = {
        settings,
        loading,
        error,
        refreshSettings,
        getSetting
    };

    return (
        <SettingContext.Provider value={value}>
            {children}
        </SettingContext.Provider>
    );
};

export default SettingContext;
