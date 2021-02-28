async function test () {
    


    let data = [
        { cases: 7, distance: 560, time: 16.68 },
        { cases: 3, distance: 220, time: 11.50 },
        { cases: 3, distance: 340, time: 12.03 },
        { cases: 4, distance: 80, time: 14.88 },
        { cases: 6, distance: 150, time: 13.75 },
        { cases: 7, distance: 330, time: 18.11 }
    ];

    let result = 
        $$(data)
        .reduce({
            covMatrix: $$.covMatrix('cases, distance, time'),
            corMatrix: $$.corMatrix('cases, distance, time'),
        })
        .get();

    console.log(result);


/*
    let mx = new $$.matrix([
        [ -9.916378605988822, -2.182362145674306, 1.481854840725445 ],
        [ 8.658747898441487, -3.7252302798757375, -7.162064063929843 ]    
    ]);

    mx.decomposeLU();
*/

}
