export interface CoverRect {
    rw: number;   // rendered image width  (>= cw)
    rh: number;   // rendered image height (>= ch)
    offX: number; // <= 0  horizontal overflow offset
    offY: number; // <= 0  vertical overflow offset
}

/** object-position:bottom  =>  px = 0.5 (center X), py = 1.0 (bottom Y). */
export function coverRect(
    cw: number,
    ch: number,
    iw: number,
    ih: number,
    px = 0.5,
    py = 1.0
): CoverRect | null {
    if (!cw || !ch || !iw || !ih) return null;
    const scale = Math.max(cw / iw, ch / ih);
    const rw = iw * scale;
    const rh = ih * scale;
    const offX = (cw - rw) * px;
    const offY = (ch - rh) * py;
    return { rw, rh, offX, offY };
}

/** image-normalized % (0..100) -> container px. */
export function normToPx(
    rect: CoverRect,
    left: number,
    top: number,
    width: number
) {
    return {
        xPx: rect.offX + (left / 100) * rect.rw,
        yPx: rect.offY + (top / 100) * rect.rh,
        wPx: (width / 100) * rect.rw,
    };
}

/** container px -> image-normalized % (0..100). Inverse of normToPx for left/top. */
export function pxToNorm(rect: CoverRect, xPx: number, yPx: number) {
    return {
        left: ((xPx - rect.offX) / rect.rw) * 100,
        top: ((yPx - rect.offY) / rect.rh) * 100,
    };
}

/** px delta -> image-normalized % delta (for drag/resize). */
export function pxDeltaToNorm(rect: CoverRect, dxPx: number, dyPx: number) {
    return { dLeft: (dxPx / rect.rw) * 100, dTop: (dyPx / rect.rh) * 100 };
}
