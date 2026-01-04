import { usePathname } from "next/navigation";
import { useMemo } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export const useBreadcrumbs = () => {
  const pathname = usePathname();

  return useMemo(() => {
    const pathSegments = pathname ? pathname.split("/").filter(Boolean) : [];

    const breadcrumbs: BreadcrumbItem[] = [
      { label: "Home", href: "/" },
      ...pathSegments.map((segment, index) => ({
        label:
          segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
        href: `/${pathSegments.slice(0, index + 1).join("/")}`,
      })),
    ];

    return breadcrumbs;
  }, [pathname]);
};
