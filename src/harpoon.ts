import Fish from './fish';
import Player from './player';
import Vec2 from './Utilities/vectors';

class Harpoon {
    active: boolean;

    position: Vec2;
    velocity: Vec2;
    angle: number;

    player: Player;
    attachedTo?: Fish;

    constructor(player: Player) {
        this.player = player;

        this.position = new Vec2(0, 0);
        this.velocity = new Vec2(0, 0);

        this.active = false;
        this.angle = 0;
    }

    logic(inDelta: number) {
        if (this.attachedTo) {
            this.position = this.attachedTo.position.clone();
        } else {
            const deltaVel = Vec2.multiplyVec(this.velocity, inDelta);
            this.position.add(deltaVel);
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.save();

        ctx.beginPath();
        ctx.moveTo(this.player.position.x, this.player.position.y);
        ctx.lineTo(this.position.x, this.position.y);

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.restore();

        if (!this.attachedTo) {
            ctx.save();

            ctx.translate(this.position.x, this.position.y);
            ctx.rotate(this.angle);

            ctx.fillStyle = 'black';
            ctx.fillRect(0, -5, 20, 10);

            ctx.restore();
        }
    }
}

export default Harpoon;
