'use client';
import type { Audit } from '@/lib/types';
import initialAudits from '@/lib/data/audits.json';

const STORAGE_KEY = 'audits_data';

export function getAudits(): Audit[] {
    if (typeof window === 'undefined') {
        return initialAudits as Audit[];
    }
    try {
        const storedData = window.localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            return JSON.parse(storedData) as Audit[];
        } else {
            // First time load, initialize with data from json
            const audits = initialAudits as Audit[];
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(audits));
            return audits;
        }
    } catch (error) {
        console.error("Error reading from localStorage", error);
        return initialAudits as Audit[];
    }
}

export function saveAudit(audit: Audit): void {
    if (typeof window === 'undefined') return;
    try {
        const audits = getAudits();
        audits.unshift(audit);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(audits));
    } catch (error) {
        console.error("Error saving to localStorage", error);
        throw new Error("No se pudo guardar los datos. El almacenamiento local del navegador podría estar lleno o deshabilitado.");
    }
}

export function deleteAudit(id: string): void {
    if (typeof window === 'undefined') return;
    try {
        let audits = getAudits();
        audits = audits.filter(a => a.id !== id);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(audits));
    } catch (error) {
        console.error("Error deleting from localStorage", error);
        throw new Error("No se pudo eliminar la auditoría localmente.");
    }
}

export function getAuditById(id: string): Audit | null {
    const audits = getAudits();
    return audits.find(a => a.id === id) || null;
}
