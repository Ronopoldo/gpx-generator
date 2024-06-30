
let fs = require('fs')
var convert = require('xml-js');



function getActivities(path) {

    var xml = require('fs').readFileSync(path, 'utf8');
    var options = {ignoreComment: true, alwaysChildren: true};
    var result = convert.xml2js(xml, options); // or convert.xml2json(xml, options)
    let allActivities = []
    result.elements[0].elements.forEach(ele => {
        ele.elements.forEach(ele2 => {
            if (ele2.elements[2] != null) {
                if (((ele2.elements[2].elements[1].elements[0].elements).length > 0) && (ele2.elements[1].elements.length == 0)) {
                    // console.log(ele2.elements[2].elements[1].elements[0].elements[0].text)
                    allActivities.push(ele2.elements[2].elements[1].elements[0].elements[0].text)
                }
            }
            // console.log('-=========-')
        })
    })
    console.log(path)
    let uniq = [...new Set(allActivities)];
    return uniq
}




// let uniq = [...new Set(allActivities)];

let files = fs.readdirSync('./KMLS')

let total = []

files.forEach(ele =>
total = total.concat(getActivities(`./KMLS/${ele}`))
)

let finalObj = {}

total.forEach(ele => {
    finalObj[ele] = '#ffffff'
})

console.log(finalObj)

fs.writeFileSync('./activitiesColors.json', JSON.stringify(finalObj) )

console.log(getActivities('./KMLS/2024-06-01.kml'))


/*

{
  type: 'element',
  name: 'ExtendedData',
  elements: [
    {
      type: 'element',
      name: 'Data',
      attributes: [Object],
      elements: [Array]
    },
    {
      type: 'element',
      name: 'Data',
      attributes: [Object],
      elements: [Array]
    },
    {
      type: 'element',
      name: 'Data',
      attributes: [Object],
      elements: [Array]
    }
  ]
}

 */