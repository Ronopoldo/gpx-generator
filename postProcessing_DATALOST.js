const fs = require('fs');
const path = require('path')
const xml2js = require('xml2js');

const parser = new xml2js.Parser();
const builder = new xml2js.Builder();


function getFilesStartingWith(dir, prefix) {
    let result = [];

    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            result = result.concat(getFilesStartingWith(fullPath, prefix));
        } else if (item.startsWith(prefix)) {
            result.push(item);
        }
    }

    return result;
}


function process(name) {

    const transferedFile = `./TRANSFERED/${name}`;
    const legacyFile = `./LEGACY/${name}`;
    const targetNames = ['Метро', 'Самолёт'];

    fs.readFile(transferedFile, 'utf8', (err, transferedData) => {
        if (err) {
            console.error('Error reading TRANSFERED file:', err);
            return;
        }

        fs.readFile(legacyFile, 'utf8', (err, legacyData) => {
            if (err) {
                console.error('Error reading LEGACY file:', err);
                return;
            }

            // Парсинг файлов
            parser.parseString(transferedData, (err, transferedResult) => {
                if (err) {
                    console.error('Error parsing TRANSFERED XML:', err);
                    return;
                }

                parser.parseString(legacyData, (err, legacyResult) => {
                    if (err) {
                        console.error('Error parsing LEGACY XML:', err);
                        return;
                    }

                    // Функция для замены trkseg
                    const replaceTrkseg = (transferedTrksegs, legacyTrksegs) => {
                        transferedTrksegs.forEach((trkseg, index) => {
                            const extensions = trkseg.extensions && trkseg.extensions[0];
                            const gteName = extensions && extensions['gte:name'] && extensions['gte:name'][0];

                            if ((targetNames.includes(gteName)) || (gteName.startsWith('м. '))) {
                                // Заменяем trkseg в transferedResult на соответствующий trkseg из legacyResult
                                transferedTrksegs[index] = legacyTrksegs[index];
                            }
                        });
                    };

                    // Замена trkseg
                    const transferedTrksegs = transferedResult.gpx.trk[0].trkseg;
                    const legacyTrksegs = legacyResult.gpx.trk[0].trkseg;
                    replaceTrkseg(transferedTrksegs, legacyTrksegs);

                    // Запись обновленного файла
                    const updatedTransferedData = builder.buildObject(transferedResult);
                    fs.writeFile(`./FINAL/${name}`, updatedTransferedData, 'utf8', (err) => {
                        if (err) {
                            console.error('Error writing updated TRANSFERED file:', err);
                        } else {
                            console.log('File successfully updated');
                        }
                    });
                });
            });
        });
    });
}




getFilesStartingWith('./TRANSFERED/', '2023-').forEach(file => {
    console.log(process(file))
    // console.log(Object.keys(coords)[12342])
});