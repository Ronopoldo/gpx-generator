const fs = require('fs');
const { parser } = require('stream-json');
const { streamArray } = require('stream-json/streamers/StreamArray');
const { chain } = require('stream-chain');
const { pick } = require('stream-json/filters/Pick');
const { ignore } = require('stream-json/filters/Ignore');

// Путь к вашему JSON файлу
const filePath = './Records.json';

let outObj = {}
let repeats = 0

// Создаем цепочку для потокового чтения и обработки файла
const pipeline = chain([
    fs.createReadStream(filePath),
    parser(),
    pick({ filter: 'locations' }),
    streamArray()
]);

pipeline.on('data', ({ key, value }) => {
    // Здесь вы можете обрабатывать каждую запись из массива locations
    outObj[value.timestamp] = []
});

pipeline.on('data', ({ key, value }) => {
    // Здесь вы можете обрабатывать каждую запись из массива locations
    outObj[value.timestamp].push([value.latitudeE7,value.longitudeE7, value.altitude])
    if (outObj[value.timestamp].length > 1) {
        console.log(outObj[value.timestamp])
        repeats+=1
    }
    console.log(value.timestamp, repeats, outObj[value.timestamp])
});

pipeline.on('end', () => {
    console.log('Чтение и обработка файла завершены.');
    const writeStream = fs.createWriteStream('large-file-inverted.json');

// Функция для записи большого объекта в JSON файл
    function writeLargeObjectToFile(obj, stream) {
        stream.write('{\n');

        const keys = Object.keys(obj);
        const totalKeys = keys.length;

        keys.forEach((key, index) => {
            const jsonString = `"${key}": ${JSON.stringify(obj[key])}`;
            stream.write(jsonString);

            if (index < totalKeys - 1) {
                stream.write(',\n');
            } else {
                stream.write('\n');
            }
        });

        stream.write('}\n');
        stream.end();
    }

// Запись объекта в файл
    writeLargeObjectToFile(outObj, writeStream);

    writeStream.on('finish', () => {
        console.log('Запись завершена.');
    });

    writeStream.on('error', (err) => {
        console.error('Произошла ошибка при записи файла:', err);
    });
});

pipeline.on('error', (err) => {
    console.error('Произошла ошибка:', err);
});
