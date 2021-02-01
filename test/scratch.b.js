import { default as matrix } from '../src/matrix.js';
import { default as oldMatrix } from '../src/oldMatrix.js';

async function test () {

    console.log(matrix.identity(5).data)
    console.log(oldMatrix.identity(5).data)

}
