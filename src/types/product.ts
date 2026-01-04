export interface ProductCategory {
    _id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Product {
    _id: string;
    name: string;
    category: ProductCategory;
    isActive: number;
    createdAt: string;
    updatedAt: string;
}