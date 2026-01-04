import { NextRequest, NextResponse } from 'next/server';
import getCurrentUser from '@/actions/get-current-user';

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the form data from the request
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Create new FormData for external API
        const externalFormData = new FormData();
        externalFormData.append('media', file);

        // Send to external API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/single`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentUser.accessToken}`
            },
            body: externalFormData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload to external API');
        }

        const data = await response.json();

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}
