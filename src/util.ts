export const findRequiredLvl1Attributes = (start: number, end: number) => {
    return toLvl1Attributes(end) - toLvl1Attributes(start);
};

export const toLvl1Attributes = (lvl: number) => {
    return Math.pow(2, lvl - 1);
};

export function formatNumber(value: number): string {
    return Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 2,
    }).format(value);
}
