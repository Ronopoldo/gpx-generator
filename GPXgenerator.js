const fs = require('fs');
const path = require('path');
const xmlbuilder = require('xmlbuilder');
const xml2js = require('xml2js');

inputFile = './KMLS/2024-05-31.kml'


excepts = {
    "Home": "Дом",
    "Work": "Работа"
}

niceList = [
    "Transportation service",
    "Train station",
    // "Subway station",
    "Shopping mall",
    "Supermarket",
    "International airport",
    "Airport",
    "Bus station"
]


activities = JSON.parse(fs.readFileSync('./activitiesColors.json'))
labels = JSON.parse(fs.readFileSync('./labels.json'))
activitiesNames = JSON.parse(fs.readFileSync('./activitiesTranslation.json'))

console.log(Object.keys(activities))

// function createGPX(data) {
//     const gpx = xmlbuilder.create('gpx', { encoding: 'UTF-8' })
//         .att('version', '1.1')
//         .att('creator', 'Ronopoldo')
//         .att('xmlns', 'http://www.topografix.com/GPX/1/1')
//         .att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
//         .att('xsi:schemaLocation', 'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd')
//         .att('xmlns:gpxtpx', 'http://www.garmin.com/xmlschemas/TrackPointExtension/v1')
//     .att('xmlns:gpxx', 'http://www.garmin.com/xmlschemas/GpxExtensions/v3')
//     .att('targetNamespace','http://www.topografix.com/GPX/1/1')
//     .att('elementFormDefault','qualified')
//     .att(' xsi:schemaLocation', 'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd');
//
//     const trk = gpx.ele('trk');
//     const trkseg = trk.ele('trkseg');
//
//     for (const [timestamp, coords] of Object.entries(data)) {
//         for (const [lat, lon, ele] of coords) {
//             const trkpt = trkseg.ele('trkpt', {
//                 lat: (lat / 1e7).toFixed(7),
//                 lon: (lon / 1e7).toFixed(7)
//             });
//             if (ele !== null) {
//                 trkpt.ele('ele', {}, (ele / 1e3).toFixed(2));
//             }
//             trkpt.ele('time', {}, new Date(timestamp).toISOString());
//         }
//     }
//
//     const xml = gpx.end({ pretty: true });
//     fs.writeFileSync('output.gpx', xml);
// }
//
// createGPX(ORIGIN);
function getFilesStartingWith(dir, prefix) {
    let result = [];

    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            result = result.concat(getFilesStartingWith(fullPath, prefix));
        } else if (item.startsWith(prefix)) {
            result.push(fullPath);
        }
    }

    return result;
}


const JSONStream = require('JSONStream');

function getMinutesDifference(startTimestamp, endTimestamp) {
    const startDate = new Date(startTimestamp);
    const endDate = new Date(endTimestamp);

    const diffMilliseconds = endDate - startDate;
    const diffMinutes = diffMilliseconds / (1000 * 60);

    return diffMinutes;
}

function binarySearch(arr, target, comparator) {
    let low = 0;
    let high = arr.length - 1;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const comp = comparator(arr[mid], target);

        if (comp < 0) {
            low = mid + 1;
        } else if (comp > 0) {
            high = mid - 1;
        } else {
            return mid;
        }
    }

    return low;
}

function generateTimestamps(startTime, endTime, numberOfPoints) {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const interval = (end - start) / (numberOfPoints - 1);
    const timestamps = [];

    for (let i = 0; i < numberOfPoints; i++) {
        timestamps.push(new Date(start + i * interval).toISOString());
    }

    return timestamps;
}

function extractRange(data, begin, end) {
    const keys = Object.keys(data);

    // Компаратор для бинарного поиска
    const comparator = (a, b) => new Date(a) - new Date(b);

    const startIndex = binarySearch(keys, begin, comparator);

    const endIndex = binarySearch(keys, end, comparator);

    const result = {};
    for (let i = startIndex; i < endIndex && i < keys.length; i++) {
        const key = keys[i];
        if (new Date(key) > new Date(end)) break;
        result[key] = data[key];
    }

    return result;
}


// Функция для чтения и парсинга KML файла
function parseKML(filePath, coords) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Ошибка при чтении файла:', err);
            return;
        }

        xml2js.parseString(data, (err, result) => {
            if (err) {
                console.error('Ошибка при парсинге XML:', err);
                return;
            }


            const gpx = xmlbuilder.create('gpx', {encoding: 'UTF-8'})
                .att('version', '1.1')
                .att('creator', 'Ronopoldo')
                .att('xmlns', 'http://www.topografix.com/GPX/1/1')
                .att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
                .att('xmlns:gpxtpx', 'http://www.garmin.com/xmlschemas/TrackPointExtension/v1')
                .att('xmlns:gpxx', 'http://www.garmin.com/xmlschemas/GpxExtensions/v3')
                .att('targetNamespace', 'http://www.topografix.com/GPX/1/1')
                .att('elementFormDefault', 'qualified')
                .att('xsi:schemaLocation', 'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd');

            const trk = gpx.ele('trk');


            // console.log(JSON.stringify(result, null, 2));
            // console.log('-===================================-')

            for (let i = 0; i < result.kml.Document[0].Placemark.length; i++) {
                const ele = result.kml.Document[0].Placemark[i];
                isEnd = false
                isBegin = false
                const eleNext = result.kml.Document[0].Placemark[i + 1];
                if (eleNext != null) {
                    isActivityNext = (Object.keys(activities).includes(eleNext.name[0]))
                }
                if (i == (result.kml.Document[0].Placemark.length - 1)) {
                    isEnd = true
                }

                const elePrev = result.kml.Document[0].Placemark[i - 1];
                if (elePrev != null) {
                    isActivityPrev = (Object.keys(activities).includes(elePrev.name[0]))
                } else {
                    isActivityPrev = true
                }
                if (i == 0) {
                    isBegin = true
                }

                isActivity = (Object.keys(activities).includes(ele.name[0]))
                name = ele.name[0]
                category = '-1'
                if (ele.ExtendedData != null) {
                    category = ele.ExtendedData[0].Data.find(data => data.$.name === 'Category').value[0];
                    // console.log(ele.ExtendedData)
                }

                time = [ele.TimeSpan[0].begin[0], ele.TimeSpan[0].end[0]]
                // console.log(name, time, isActivity)
                // console.log(gpx)

                const trkseg = trk.ele('trkseg')
                if (isActivity == true) {


                    if ((name != 'On the subway') && (name != 'Moving')) {
                        console.log("АКТИВНОСТЬ")
                        console.log(time)

                        if ((isActivityPrev == false) && (isBegin == false)) {

                            timeP = [elePrev.TimeSpan[0].begin[0], elePrev.TimeSpan[0].end[0]]
                            console.log(timeP)
                            //
                            ned = Object.entries(extractRange(coords, timeP[0], timeP[1]))

                            if (ned.length < 2) {
                                pointCords = elePrev.Point[0].coordinates[0];
                                lon = pointCords.split(',')[0]
                                lat = pointCords.split(',')[1]
                            }

                            if (lon > 180) {
                                (lon = lon / 1e7).toFixed(7)
                            }
                            if (lat > 90) {
                                (lat = lat / 1e7).toFixed(7)
                            }

                            const trkpt = trkseg.ele('trkpt', {
                                lat: lat,
                                lon: lon
                            });
                            trkpt.ele('time', {}, new Date(timeP[0]).toISOString());

                        }


                        // extractRangeFromJSON('./large-file-inverted.json', time[0], time[1], (result) => {
                        //     console.log(result);
                        //     console.log('callback is done')
                        // });

                        // console.log(Object.entries(extractRange(coords, time[0], time[1])));


                        Object.entries(extractRange(coords, time[0], time[1])).forEach(element => {
                            timestamp = element[0]
                            lat = element[1][0][0]
                            lon = element[1][0][1]
                            elevation = element[1][0][2]

                            // console.log(lat, lon, elevation)
                            const trkpt = trkseg.ele('trkpt', {
                                lat: (lat / 1e7).toFixed(7),
                                lon: (lon / 1e7).toFixed(7)
                            });
                            if (elevation !== null) {
                                trkpt.ele('ele', {}, elevation);
                            }
                            trkpt.ele('time', {}, new Date(timestamp).toISOString());

                        })


                        //// ТОЧКИ СТЫКОВ

                        //
                        // if ((isActivityPrev == true) && (isBegin == false)) {
                        //
                        //     timeP = [elePrev.TimeSpan[0].begin[0], elePrev.TimeSpan[0].end[0]]
                        //     console.log(timeN)
                        //     //
                        //     ned = Object.entries(extractRange(coords, timeP[0], timeP[1]))
                        //
                        //     // else {
                        //     //     // timestamp =
                        //     lat = (Object.entries(extractRange(coords, timeP[0], timeP[1]))[0][1][0][0] / 1e7).toFixed(7)
                        //     lon = (Object.entries(extractRange(coords, timeP[0], timeP[1]))[0][1][0][1]/ 1e7).toFixed(7)
                        //     // }
                        //     // elevation = Object.entries(extractRange(coords, timeN[0], timeN[1]))[0][1][0][2]
                        //     //
                        //     // // console.log(lat, lon, elevation)
                        //     const trkpt = trkseg.ele('trkpt', {
                        //         lat: lat,
                        //         lon: lon
                        //     });
                        //     trkpt.ele('time', {}, new Date(timeP[0]).toISOString());
                        //
                        // }


                        if ((isActivityNext == false) && (isEnd == false)) {

                            timeN = [eleNext.TimeSpan[0].begin[0], eleNext.TimeSpan[0].end[0]]
                            console.log(timeN)
                            //
                            ned = Object.entries(extractRange(coords, timeN[0], timeN[1]))

                            if (ned.length < 1) {
                                pointCords = eleNext.Point[0].coordinates[0];
                                lon = pointCords.split(',')[0]
                                lat = pointCords.split(',')[1]
                            }
                            if (eleNext.ExtendedData != null) {
                                categoryNext = eleNext.ExtendedData[0].Data.find(data => data.$.name === 'Category').value[0];
                                // console.log(ele.ExtendedData)
                            }
                            if (((Object.entries(extractRange(coords, timeN[0], timeN[1])))[0] != null) && (categoryNext != 'Subway station')) {
                                lat = (Object.entries(extractRange(coords, timeN[0], timeN[1]))[0][1][0][0] / 1e7).toFixed(7)
                                lon = (Object.entries(extractRange(coords, timeN[0], timeN[1]))[0][1][0][1] / 1e7).toFixed(7)
                            }
                            if (lon > 180) {
                                (lon = lon / 1e7).toFixed(7)
                            }
                            if (lat > 90) {
                                (lat = lat / 1e7).toFixed(7)
                            }
                            // if (lat < 1) { (lat = lon )}
                            const trkpt = trkseg.ele('trkpt', {
                                lat: lat,
                                lon: lon
                            });
                            trkpt.ele('time', {}, new Date(timeN[0]).toISOString());

                        }


                        if ((isActivityNext == true) && (isEnd == false)) {

                            timeN = [eleNext.TimeSpan[0].begin[0], eleNext.TimeSpan[0].end[0]]
                            console.log(timeN)
                            //
                            ned = Object.entries(extractRange(coords, timeN[0], timeN[1]))

                            // else {
                            //     // timestamp =

                            if ((Object.entries(extractRange(coords, timeN[0], timeN[1])))[0] != null) {
                                lat = (Object.entries(extractRange(coords, timeN[0], timeN[1]))[0][1][0][0] / 1e7).toFixed(7)
                                lon = (Object.entries(extractRange(coords, timeN[0], timeN[1]))[0][1][0][1] / 1e7).toFixed(7)

                                // }
                                // elevation = Object.entries(extractRange(coords, timeN[0], timeN[1]))[0][1][0][2]
                                //
                                // // console.log(lat, lon, elevation)
                                const trkpt = trkseg.ele('trkpt', {
                                    lat: lat,
                                    lon: lon
                                });
                                trkpt.ele('time', {}, new Date(timeN[0]).toISOString());
                            }
                        }

                    } else {
                        // console.log('AFSJAKFAJFSK')
                        timeN = [ele.TimeSpan[0].begin[0], ele.TimeSpan[0].end[0]]
                        cords = ele.LineString[0].coordinates[0].split(' ')
                        for (let i = 0; i < cords.length; i++) {
                            locCORD = ele.LineString[0].coordinates[0].split(' ')[i]
                            timestamps = generateTimestamps(timeN[0], timeN[1], cords.length)
                            lon = locCORD.split(',')[0]
                            lat = locCORD.split(',')[1]
                            timestampp = timestamps[i]

                            console.log(lon, lat, timestampp)
                            const trkpt = trkseg.ele('trkpt', {
                                lat: lat,
                                lon: lon
                            });
                            trkpt.ele('time', {}, new Date(timestampp).toISOString());

                        }
                    }
                    //////////////////


                    const extensions = trkseg.ele('extensions', {})
                    extensions.ele('gte:name', {}, activitiesNames[name])
                    extensions.ele('gte:color', {}, activities[name])


                } else {
                    console.log("МЕСТО")
                    timeBetween = getMinutesDifference(time[0], time[1])


                    condition = ((((timeBetween <= 60) || (niceList.includes(category))) && (Object.keys(excepts).includes(name) == false))) && (category != 'Subway station')

                    // if (category == null) {
                    //     let category = '-1'
                    // }
                    // console.log(`CONDITION: ${condition}    ${name.toLowerCase().includes('метро') == false}   ${name.toLowerCase()}`)
                    pointCords = '-1'


                    if (ele.Point != null) {
                        pointCords = ele.Point[0].coordinates[0];
                        console.log(pointCords)
                    }


                    if (condition) {


                        console.log(category)
                        Object.entries(extractRange(coords, time[0], time[1])).forEach(element => {
                            timestamp = element[0]
                            lat = element[1][0][0]
                            lon = element[1][0][1]
                            elevation = element[1][0][2]

                            // console.log(lat, lon, elevation)
                            const trkpt = trkseg.ele('trkpt', {
                                lat: (lat / 1e7).toFixed(7),
                                lon: (lon / 1e7).toFixed(7)
                            });
                            if (elevation !== null) {
                                trkpt.ele('ele', {}, elevation);
                            }
                            trkpt.ele('time', {}, new Date(timestamp).toISOString());

                        })

                    } else {
                        tempTimeStamp = '2000-05-01T20:57:26.000Z'
                        console.log(category)
                        Object.entries(extractRange(coords, time[0], time[1])).forEach(element => {

                            timestamp = element[0]
                            if (getMinutesDifference(tempTimeStamp, timestamp) >= 60) {
                                lat = (element[1][0][0] / 1e7).toFixed(7)
                                lon = (element[1][0][1] / 1e7).toFixed(7)
                                elevation = element[1][0][2]


                                pointCords = ele.Point[0].coordinates[0];
                                lon = pointCords.split(',')[0]
                                lat = pointCords.split(',')[1]

                                // console.log(lat, lon, elevation)
                                const trkpt = trkseg.ele('trkpt', {
                                    lat: lat,
                                    lon: lon
                                });
                                if (elevation !== null) {
                                    trkpt.ele('ele', {}, elevation);
                                }
                                trkpt.ele('time', {}, new Date(timestamp).toISOString());
                                tempTimeStamp = timestamp
                            }
                        })


                    }

                    finalName = name
                    // console.log(Object.keys(labels).join('_').includes(pointCords), pointCords.split(',')[0])
                    if (Object.keys(labels).join('_').includes(pointCords.split(',')[0])) {
                        keyFound = Object.keys(labels).find(key => key.startsWith(pointCords.split(',')[0]));
                        finalName = labels[keyFound]
                        console.log('FOUND ' + finalName + ' ' + pointCords)
                    }

                    if (Object.keys(excepts).includes(name)) {
                        finalName = excepts[name]
                    }

                    if (category == 'Train station') {
                        finalName = 'ст. ' + finalName
                    }
                    if ((category == 'Subway station')) {
                        finalName = 'м. ' + finalName
                    }
                    if (category == 'Airport') {
                        finalName = 'Аэропорт ' + finalName
                    }

                    if (category == 'International airport') {
                        finalName = 'Аэропорт ' + finalName
                    }
                    if (category == 'Shopping mall') {
                        finalName = 'ТЦ ' + finalName
                    }
                    if ('Bus station' == 'Shopping mall') {
                        finalName = 'авт. ст. ' + finalName
                    }
                    /*
                        "Transportation service",
"Train station",
"Subway station",
"Shopping mall",
"Supermarket",
"International airport",
"Airport"
                     */

                    const extensions = trkseg.ele('extensions', {})
                    extensions.ele('gte:name', {}, finalName)
                    extensions.ele('gte:color', {}, '#000000')

                }

                console.log('-===============-')
                // console.log(ele)
            }
            const xml = gpx.end({pretty: true});
            fs.writeFileSync(`./TRANSFERED/${filePath.match(/\d{4}-\d{2}-\d{2}/)}.gpx`, xml);
            console.log('THIS IS THE END')
        });

    });

}


coords = fs.readFile('./large-file-inverted.json', (err, data) => {
    coords = JSON.parse(data)

    getFilesStartingWith('./KMLS', '2023-').forEach(file => {
        console.log(parseKML(file, coords))
        // console.log(Object.keys(coords)[12342])
    });
});

