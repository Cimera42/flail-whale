export const clamp = (inNum: number, inMin: number, inMax: number) => {
    return Math.max(inMin, Math.min(inMax, inNum));
};

export const getRandomNum = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
};

export const getRandomInt = (min: number, max: number) => {
    return Math.floor(getRandomNum(min, max));
};

export const sq = (num: number) => {
    return num * num;
};
