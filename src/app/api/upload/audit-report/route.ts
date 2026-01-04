import { NextResponse } from 'next/server';
import getCurrentUser from '@/actions/get-current-user';

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();
        
        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const externalApiUrl = process.env.NEXT_PUBLIC_API_URL + '/upload/audit-report';
        if (!externalApiUrl) {
            throw new Error('File upload API URL not configured');
        }

        // Create a new FormData instance for the external API
        const externalFormData = new FormData();
        externalFormData.append('auditReport', file);

        // Forward the file to the external API
        const response = await fetch(externalApiUrl, {
            method: 'POST',
            body: externalFormData,
            headers: {
                'Authorization': `Bearer ${currentUser.accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('External API upload failed');
        }

        const data = await response.json();

        return NextResponse.json({ url: data.media.url });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
} 