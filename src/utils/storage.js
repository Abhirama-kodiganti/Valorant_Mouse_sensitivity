// src/utils/storage.js

/**
 * Simple wrapper around localStorage for the Aim Trainer app.
 * All data is stored under a single namespace "aimTrainer" to avoid key collisions.
 */
const STORAGE_KEY = "aimTrainer";

function _getStore() {
    const raw = localStorage.getItem(STORAGE_KEY);
    try {
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        console.error("Failed to parse storage data", e);
        return {};
    }
}

function _saveStore(store) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
        console.error("Failed to save storage data", e);
    }
}

// Profile handling (e.g., DPI, preferred game, last used sensitivity)
export function saveProfile(profile) {
    const store = _getStore();
    store.profile = profile;
    _saveStore(store);
}

export function loadProfile() {
    const store = _getStore();
    return store.profile || null;
}

// Session history – an array of past game results
export function saveSession(session) {
    const store = _getStore();
    if (!Array.isArray(store.sessions)) store.sessions = [];
    store.sessions.push(session);
    _saveStore(store);
}

export function loadSessions() {
    const store = _getStore();
    return store.sessions || [];
}

// Export all settings (profile + sessions) as a JSON string
export function exportSettings() {
    const store = _getStore();
    return JSON.stringify(store, null, 2);
}

// Import settings from a JSON string – replaces existing data
export function importSettings(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        _saveStore(data);
        return true;
    } catch (e) {
        console.error("Invalid import data", e);
        return false;
    }
}

// Utility to clear all stored data (useful for debugging)
export function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
}
