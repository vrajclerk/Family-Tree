import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const usePhotoUpload = () => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadPhoto = async (file: File, personId: string): Promise<string> => {
        setUploading(true);
        setError(null);

        try {
            // Validate file
            if (!file.type.startsWith('image/')) {
                throw new Error('Please select an image file');
            }
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('Image must be less than 5MB');
            }

            const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${personId}/${Date.now()}.${ext}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('member-photos')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('member-photos')
                .getPublicUrl(fileName);

            const publicUrl = urlData.publicUrl;

            // Update the person's photo_url
            const { error: updateError } = await supabase
                .from('persons')
                .update({ photo_url: publicUrl })
                .eq('id', personId);

            if (updateError) throw updateError;

            return publicUrl;
        } catch (err: any) {
            const msg = err.message || 'Failed to upload photo';
            setError(msg);
            throw err;
        } finally {
            setUploading(false);
        }
    };

    const deletePhoto = async (personId: string, photoUrl: string) => {
        setError(null);
        try {
            // Extract path from URL
            const parts = photoUrl.split('/member-photos/');
            if (parts.length > 1) {
                const filePath = parts[1];
                await supabase.storage.from('member-photos').remove([filePath]);
            }

            // Clear the photo_url
            const { error: updateError } = await supabase
                .from('persons')
                .update({ photo_url: null })
                .eq('id', personId);

            if (updateError) throw updateError;
        } catch (err: any) {
            setError(err.message || 'Failed to delete photo');
            throw err;
        }
    };

    return { uploadPhoto, deletePhoto, uploading, error };
};
