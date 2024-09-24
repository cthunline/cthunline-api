import type { MultipartFileData } from '../services/multipart.js';

// allowed mime types with their intern type and allowed extensions
export const mimeTypes = {
    'image/jpeg': {
        type: 'image',
        extensions: ['jpg', 'jpeg']
    },
    'image/png': {
        type: 'image',
        extensions: ['png']
    },
    'image/svg+xml': {
        type: 'image',
        extensions: ['svg']
    },
    'audio/mpeg': {
        type: 'audio',
        extensions: ['mp3']
    }
};

export type MimeType = keyof typeof mimeTypes;

// intern file type
export type FileType = 'image' | 'audio';

export interface TypedFile extends MultipartFileData {
    type: FileType;
}
