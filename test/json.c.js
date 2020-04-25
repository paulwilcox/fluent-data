async function test () {

    let json = await
        fetch('./_toJson.r.js')
        .then(data => data.json());

    

    console.log({json});

}