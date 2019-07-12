// Aggregators such as 'sum' or 'avg' operate on
// columnar data.  But the values passed to the
// aggregators, such as 'x' in 'sum(x)' or 'avg(x)'
// are point data.  'emulator' stores the row value,
// but it also stores the the intented function (the 
// one it emulates), for later loading into a master 
// aggregators object.    
export class emulator {
    constructor(processor, rowValue) {
        this.rowValue = rowValue;
        this.processor = processor;
    }
}

// 'emulatorsFunc' is what the user will pass in.
export let runEmulators = function (
    dataset,
    emulatorsFunc
) {

    let keyStores = {};
    let isNaked = false;

    for (let row of dataset) {

        let emulators = emulatorsFunc(row);
        
        if (emulators instanceof emulator) {
            isNaked = true;
            emulators = { x: emulators };
        }

        for (let key of Object.keys(emulators)) {

            let rowValue = emulators[key].rowValue;

            if (!keyStores[key]) 
                keyStores[key] = {
                    processor: emulators[key].processor,
                    data: []
                };

            keyStores[key].data.push(rowValue);

        }

    }

    for (let key of Object.keys(keyStores)) 
        keyStores[key] = keyStores[key].processor(keyStores[key].data);

    if (isNaked)
        keyStores = keyStores.x;

    return keyStores;

}
