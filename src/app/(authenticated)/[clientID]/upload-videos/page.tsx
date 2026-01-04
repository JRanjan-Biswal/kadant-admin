import UploadVideos from "@/app/components/UploadVidoes";

interface PageProps {
    params: Promise<{ clientID: string }>;
}

export default async function UploadVideosPage({ params }: PageProps) {
    const { clientID } = await params;
    return (
        <div>
            <UploadVideos clientId={clientID} />
        </div>
    );
} 