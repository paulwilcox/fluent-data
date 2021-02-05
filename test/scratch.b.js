
async function test () {

    let mx = new $$.matrix([
        [1, -1,  4], 
        [1,  4, -2], 
        [1,  4,  2], 
        [1, -1,  0]
    ])
    
    let d = mx.clone().decom.QR();    

    console.log(d);

}
