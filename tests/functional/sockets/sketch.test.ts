import { expect } from 'chai';

import Data, { sessionsData } from '../helpers/data.helper';
import Sockets from '../helpers/sockets.helper';

import { assertUser, assertSketch } from '../helpers/assert.helper';

const sketchData = sessionsData[0].sketch;

describe('[Sockets] Sketch', () => {
    before(async () => {
        await Data.reset();
    });

    it('Should fail to update sketch because of invalid data', async () => {
        await Sockets.testError(
            'sketchUpdate',
            'sketchUpdate',
            [{}, undefined, {
                dislayed: true,
                paths: [],
                images: [],
                invalidKey: 'value'
            }, {
                dislayed: 'invalidValue',
                paths: [],
                images: []
            }, {
                dislayed: true,
                paths: 'invalidValue',
                images: []
            }, {
                dislayed: false,
                paths: [],
                images: 'invalidValue'
            }, {
                dislayed: false,
                images: []
            }, {
                dislayed: false,
                paths: []
            }, {
                dislayed: false
            }],
            400,
            true
        );
    });

    it('Should update sketch', async () => {
        const [
            masterSocket,
            player1Socket,
            player2Socket
        ] = await Sockets.setupSession();
        await Promise.all([
            ...[player1Socket, player2Socket].map((socket) => (
                new Promise<void>((resolve, reject) => {
                    socket.on('sketchUpdate', ({
                        user,
                        isMaster,
                        sketch
                    }: any) => {
                        assertUser(user);
                        expect(isMaster).to.be.true;
                        assertSketch(sketch, sketchData);
                        socket.disconnect();
                        resolve();
                    });
                    socket.on('error', (err: any) => {
                        socket.disconnect();
                        reject(err);
                    });
                })
            )),
            (async () => {
                masterSocket.emit('sketchUpdate', sketchData);
            })()
        ]);
    });
});
