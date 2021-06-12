/*
	2D Vector math compilation
*/
import {sq} from './maths';

class Vec2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add = (addVec: Vec2) => {
        this.x += addVec.x;
        this.y += addVec.y;
    };

    sub = (addVec: Vec2) => {
        this.x -= addVec.x;
        this.y -= addVec.y;
    };

    multiply = (num: number) => {
        this.x *= num;
        this.y *= num;
    };

    divide = (num: number) => {
        this.x /= num;
        this.y /= num;
    };

    clone = () => {
        return new Vec2(this.x, this.y);
    };

    length = () => {
        return Math.sqrt(sq(this.x) + sq(this.y));
    };

    lengthSQ = () => {
        return sq(this.x) + sq(this.y);
    };

    static lerp(vecOne: Vec2, vecTwo: Vec2, amount: number) {
        return new Vec2(
            vecOne.x * (1 - amount) + vecTwo.x * amount,
            vecOne.y * (1 - amount) + vecTwo.y * amount
        );
    }

    static distance(one: Vec2, two: Vec2) {
        return Math.sqrt(sq(one.x - two.x) + sq(one.y - two.y));
    }

    static distanceSQ(one: Vec2, two: Vec2) {
        return sq(one.x - two.x) + sq(one.y - two.y);
    }

    static angleOfVec(inVec: Vec2) {
        return Math.atan2(inVec.y, inVec.x) - Math.atan2(1, 0); //2nd atan is the direction of 0 degrees
    }

    static vecOfAngle(angle: number) {
        return new Vec2(Math.cos(angle), Math.sin(angle));
    }

    static rotateVec(inVec: Vec2, inAngle: number) {
        var angle = Vec2.angleOfVec(inVec);
        angle += inAngle;
        return Vec2.vecOfAngle(angle);
    }

    static addVec(vec: Vec2, addVec: Vec2) {
        return new Vec2(vec.x + addVec.x, vec.y + addVec.y);
    }

    static subtractVec(vec: Vec2, subVec: Vec2) {
        return new Vec2(vec.x - subVec.x, vec.y - subVec.y);
    }

    static multiplyVec(vec: Vec2, num: number) {
        return new Vec2(vec.x * num, vec.y * num);
    }

    static divideVec(vec: Vec2, num: number) {
        return new Vec2(vec.x / num, vec.y / num);
    }

    static normaliseVec(vec: Vec2) {
        var length = Math.sqrt(sq(vec.x) + sq(vec.y));
        if (!length) return vec.clone();
        return Vec2.divideVec(vec, length);
    }

    static dotVec(vec1: Vec2, vec2: Vec2) {
        return vec1.x * vec2.x + vec1.y * vec2.y;
    }
}

export default Vec2;
