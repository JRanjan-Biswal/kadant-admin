"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
    Copy,
    Eye,
    ImageIcon,
    Loader2,
    LogOut,
    Trash2,
    Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type RiseImage = {
    key: string;
    url: string;
    fileName: string;
    contentType: string;
    size: number;
    uploadedAt: string;
};

type BusyPrompt = {
    title: string;
    description: string;
};

const USERNAME = "kraftconcept-developers";
const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
]);

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function formatSize(size: number) {
    if (!size) return "-";
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

async function parseJson(response: Response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || "Request failed");
    }
    return data;
}

export default function RiseUploadPage() {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [checkingSession, setCheckingSession] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);
    const [images, setImages] = useState<RiseImage[]>([]);
    const [loadingImages, setLoadingImages] = useState(false);
    const [busyPrompt, setBusyPrompt] = useState<BusyPrompt | null>(null);
    const [previewImage, setPreviewImage] = useState<RiseImage | null>(null);
    const [deletingKey, setDeletingKey] = useState<string | null>(null);

    const imageCountLabel = useMemo(() => {
        if (images.length === 1) return "1 image";
        return `${images.length} images`;
    }, [images.length]);

    async function loadImages() {
        setLoadingImages(true);
        try {
            const response = await fetch("/api/hidden/rise/images", {
                cache: "no-store",
            });
            if (response.status === 401) {
                setAuthenticated(false);
                setImages([]);
                return;
            }
            const data = await parseJson(response);
            setImages(data.images || []);
            setAuthenticated(true);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not load images");
        } finally {
            setLoadingImages(false);
            setCheckingSession(false);
        }
    }

    useEffect(() => {
        loadImages();
    }, []);

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoginLoading(true);

        try {
            await parseJson(
                await fetch("/api/hidden/rise/auth", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: USERNAME, password }),
                })
            );
            setPassword("");
            setAuthenticated(true);
            await loadImages();
            toast.success("Logged in");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Login failed");
        } finally {
            setLoginLoading(false);
        }
    }

    async function handleLogout() {
        await fetch("/api/hidden/rise/auth", { method: "DELETE" });
        setAuthenticated(false);
        setImages([]);
        toast.success("Logged out");
    }

    async function handleFileChange(file: File | null) {
        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
            toast.error("Only JPEG, PNG, WebP, or GIF images are allowed");
            return;
        }

        setBusyPrompt({
            title: "Uploading image",
            description: file.name,
        });

        try {
            const presign = await parseJson(
                await fetch("/api/hidden/rise/images", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fileName: file.name,
                        contentType: file.type,
                        size: file.size,
                    }),
                })
            );

            const uploadResponse = await fetch(presign.uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!uploadResponse.ok) {
                throw new Error("Upload to S3 failed");
            }

            const committed = await parseJson(
                await fetch("/api/hidden/rise/images", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        key: presign.key,
                        fileName: file.name,
                        contentType: file.type,
                        size: file.size,
                    }),
                })
            );

            setImages(committed.images || []);
            toast.success("Image uploaded");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Upload failed");
        } finally {
            setBusyPrompt(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    async function handleCopy(url: string) {
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Image link copied");
        } catch {
            toast.error("Could not copy link");
        }
    }

    async function handleDelete(image: RiseImage) {
        const confirmed = window.confirm(`Delete "${image.fileName}" from S3?`);
        if (!confirmed) return;

        setDeletingKey(image.key);
        setBusyPrompt({
            title: "Deleting image",
            description: image.fileName,
        });

        try {
            const data = await parseJson(
                await fetch("/api/hidden/rise/images", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ key: image.key }),
                })
            );
            setImages(data.images || []);
            toast.success("Image deleted");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Delete failed");
        } finally {
            setDeletingKey(null);
            setBusyPrompt(null);
        }
    }

    if (checkingSession) {
        return (
            <main className="min-h-screen bg-[#f7f9fb] flex items-center justify-center px-4">
                <div className="flex items-center gap-3 text-[#2D3E5C]">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">Checking access</span>
                </div>
            </main>
        );
    }

    if (!authenticated) {
        return (
            <main className="min-h-screen bg-[#f7f9fb] flex items-center justify-center px-4">
                <form
                    onSubmit={handleLogin}
                    className="w-full max-w-[420px] rounded-lg border border-[#d7dee8] bg-white p-6 shadow-sm"
                >
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#fff7ed] text-[#d45815]">
                            <ImageIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-[#111827]">
                                Rise Upload
                            </h1>
                            <p className="text-sm text-[#607797]">Hidden image uploader</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="rise-username">Username</Label>
                            <Input
                                id="rise-username"
                                value={USERNAME}
                                readOnly
                                className="bg-[#f3f6f9]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rise-password">Password</Label>
                            <Input
                                id="rise-password"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="current-password"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loginLoading}
                        className="mt-6 h-10 w-full bg-[#d45815] hover:bg-[#bf4c12]"
                    >
                        {loginLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "Log In"
                        )}
                    </Button>
                </form>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f7f9fb] p-4 text-[#111827] md:p-8">
            <section className="mx-auto flex max-w-[1180px] flex-col gap-5">
                <div className="flex flex-col gap-4 border-b border-[#d7dee8] pb-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Rise Image Upload</h1>
                        <p className="mt-1 text-sm text-[#607797]">
                            {imageCountLabel} stored in S3
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={(event) =>
                                handleFileChange(event.target.files?.[0] || null)
                            }
                        />
                        <Button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={Boolean(busyPrompt)}
                            className="bg-[#d45815] hover:bg-[#bf4c12]"
                        >
                            <Upload className="h-4 w-4" />
                            Upload Image
                        </Button>
                        <Button type="button" variant="outline" onClick={handleLogout}>
                            <LogOut className="h-4 w-4" />
                            Log Out
                        </Button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-[#d7dee8] bg-white shadow-sm">
                    <Table>
                        <TableHeader className="bg-[#eef3f7]">
                            <TableRow>
                                <TableHead className="w-[185px] px-4">Upload Date</TableHead>
                                <TableHead className="min-w-[320px] px-4">Image Link</TableHead>
                                <TableHead className="w-[170px] px-4">Uploading Image</TableHead>
                                <TableHead className="w-[150px] px-4">Deleting Image</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingImages ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-28 text-center">
                                        <span className="inline-flex items-center gap-2 text-[#607797]">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading images
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ) : images.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-28 text-center">
                                        <span className="text-sm text-[#607797]">
                                            No images uploaded yet.
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                images.map((image) => (
                                    <TableRow key={image.key}>
                                        <TableCell className="px-4 align-top text-sm text-[#2D3E5C]">
                                            {formatDate(image.uploadedAt)}
                                        </TableCell>
                                        <TableCell className="px-4 align-top">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewImage(image)}
                                                    className="h-12 w-16 shrink-0 overflow-hidden rounded-md border border-[#d7dee8] bg-[#f3f6f9]"
                                                    aria-label={`Preview ${image.fileName}`}
                                                >
                                                    <img
                                                        src={image.url}
                                                        alt={image.fileName}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </button>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-sm font-medium text-[#111827]">
                                                        {image.fileName}
                                                    </div>
                                                    <a
                                                        href={image.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="block truncate text-xs text-[#607797] underline-offset-2 hover:text-[#d45815] hover:underline"
                                                    >
                                                        {image.url}
                                                    </a>
                                                    <div className="mt-1 text-xs text-[#607797]">
                                                        {formatSize(image.size)}
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleCopy(image.url)}
                                                    aria-label={`Copy ${image.fileName} link`}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setPreviewImage(image)}
                                                    aria-label={`Open ${image.fileName} preview`}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 align-top text-sm text-[#607797]">
                                            Uploaded
                                        </TableCell>
                                        <TableCell className="px-4 align-top">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(image)}
                                                disabled={deletingKey === image.key}
                                                className="border-[#fecaca] text-[#b91c1c] hover:bg-[#fef2f2] hover:text-[#991b1b]"
                                            >
                                                {deletingKey === image.key ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </section>

            <Dialog open={Boolean(busyPrompt)}>
                <DialogContent showCloseButton={false} className="max-w-sm bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#111827]">
                            <Loader2 className="h-5 w-5 animate-spin text-[#d45815]" />
                            {busyPrompt?.title}
                        </DialogTitle>
                        <DialogDescription className="break-words text-[#607797]">
                            {busyPrompt?.description}
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(previewImage)}
                onOpenChange={(open) => !open && setPreviewImage(null)}
            >
                <DialogContent className="bg-white p-4 sm:max-w-[92vw] lg:max-w-[980px]">
                    <DialogHeader>
                        <DialogTitle className="text-[#111827]">
                            {previewImage?.fileName}
                        </DialogTitle>
                        <DialogDescription className="truncate text-[#607797]">
                            {previewImage?.url}
                        </DialogDescription>
                    </DialogHeader>
                    {previewImage ? (
                        <div className="flex max-h-[72vh] items-center justify-center overflow-hidden rounded-md bg-[#111827]">
                            <img
                                src={previewImage.url}
                                alt={previewImage.fileName}
                                className="max-h-[72vh] w-auto max-w-full object-contain"
                            />
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </main>
    );
}
