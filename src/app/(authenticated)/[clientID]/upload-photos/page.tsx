import UploadPhotos from "@/app/components/UploadPhotos";

interface PageProps {
    params: Promise<{ clientID: string }>;
}

export default async function UploadPhotosPage({ params }: PageProps) {
    const { clientID } = await params;
    return (
        <div>
            <UploadPhotos clientId={clientID} />
        </div>
    );
}