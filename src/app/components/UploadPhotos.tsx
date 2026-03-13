"use client";

import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MachineUpload from './MachineUpload';
import VisitUpload from './VisitUpload';

interface UploadPhotosProps {
    clientId: string;
}

const UploadPhotos = ({ clientId }: UploadPhotosProps) => {
    const [activeTab, setActiveTab] = useState<'machine' | 'visit'>('machine');

    return (
        <div className="relative mt-4">
            {/* ── Header ── */}
            <div className="flex flex-row items-center justify-between px-4 pb-4">
                <div className="text-left">
                    <h1 className="text-2xl text-foreground font-bold">Upload Image</h1>
                    <p className="text-sm text-muted-foreground mt-1">Upload and manage your business imagery here</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Select Region and Customer</span>
                        <div className="flex items-center gap-3">
                            <Select defaultValue="asia">
                                <SelectTrigger className="w-[140px] h-10 bg-card border-border">
                                    <SelectValue placeholder="Region" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="asia">Asia</SelectItem>
                                    <SelectItem value="europe">Europe</SelectItem>
                                    <SelectItem value="americas">Americas</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select>
                                <SelectTrigger className="w-[140px] h-10 bg-card border-border">
                                    <SelectValue placeholder="Customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="customer-1">Customer 1</SelectItem>
                                    <SelectItem value="customer-2">Customer 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tab Bar ── */}
            <div className="flex items-center gap-6 px-4 border-b border-border">
                <button
                    onClick={() => setActiveTab('machine')}
                    className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${activeTab === 'machine'
                            ? 'text-foreground border-b-2 border-orange'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Machine Upload
                </button>
                <button
                    onClick={() => setActiveTab('visit')}
                    className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${activeTab === 'visit'
                            ? 'text-foreground border-b-2 border-orange'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Visit Upload
                </button>
            </div>

            {/* ── Tab Content ── */}
            <div className="p-4">
                {activeTab === 'machine' ? (
                    <MachineUpload />
                ) : (
                    <VisitUpload />
                )}
            </div>
        </div>
    );
};

export default UploadPhotos;