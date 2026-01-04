import { NextRequest, NextResponse } from 'next/server';
import getCurrentUser from '@/actions/get-current-user';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files');

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > 4) {
      return NextResponse.json({ error: 'Maximum 4 files allowed' }, { status: 400 });
    }

    const externalApiUrl = process.env.NEXT_PUBLIC_API_URL + '/upload/multiple';
    
    if (!externalApiUrl) {
      throw new Error('File upload API URL not configured');
    }

    const externalFormData = new FormData();
    files.forEach((file) => {
      externalFormData.append('files', file);
    });

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ urls: data.uploadedFiles.map((item: any) => item.url) });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}