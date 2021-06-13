import Game from './game';

const main = () => {
    (window as any).game = new Game();
};

main();
