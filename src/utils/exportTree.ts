import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';

export const exportTreeAsPNG = async (elementId: string, filename = 'family-tree') => {
    const element = document.getElementById(elementId);
    if (!element) throw new Error('Element not found');

    const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
    });

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
};

export const exportTreeAsJPEG = async (elementId: string, filename = 'family-tree') => {
    const element = document.getElementById(elementId);
    if (!element) throw new Error('Element not found');

    const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
    });

    const link = document.createElement('a');
    link.download = `${filename}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
};

export const exportTreeAsPDF = async (elementId: string, filename = 'family-tree') => {
    const element = document.getElementById(elementId);
    if (!element) throw new Error('Element not found');

    const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${filename}.pdf`);
};

export const exportMembersAsCSV = async (familyId: string, filename = 'family-members') => {
    const { data: familyMembers, error } = await supabase
        .from('family_members')
        .select('*, person:persons(*)')
        .eq('family_id', familyId);

    if (error) throw error;
    if (!familyMembers || familyMembers.length === 0) {
        throw new Error('No members to export');
    }

    const headers = ['Name', 'Display Name', 'Birth Date', 'Death Date', 'Gender', 'Occupation', 'Living', 'Notes'];
    const rows = familyMembers.map((m: any) => [
        m.person?.canonical_name || '',
        m.display_name || '',
        m.person?.birth_date || '',
        m.person?.death_date || '',
        m.person?.gender || '',
        m.person?.occupation || '',
        m.is_living ? 'Yes' : 'No',
        (m.notes || '').replace(/,/g, ';').replace(/\n/g, ' '),
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = `${filename}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
};
