var _ = require('underscore');

var path = require('path');
var rp = require('request-promise');
var common = require("./common");
var PdfPrinter = require('pdfmake/src/printer');
var fs = require('fs');
var pdfMake = require('pdfmake');
var http = require('http');
var url = require('url');
var mime = require('mime-types');
var secrets = require('./secrets');
var cheerio = require('cheerio');
var q = require('q');
var fonts = require('./fonts');

function tearSheetGenerator(event, context, callback) {

    // Configurable bucket name for testing;
    var bucketName = 'sunvalleybronze.com';
    if (event.hasOwnProperty('awsBucket')) {
        // If no bucketName is passed, use the default
        bucketName = event.awsBucket;
    }

    var options = {
        url: event.documentLocation,
        method: 'GET',
        json: true,
        headers: {
            'User-Agent': 'javascript'
        }
    };

    rp(options)
        .then(function (results) {

            if (results && results.item) {
                var item = results.item;
                if (!(item && item.customContent)) {
                    callback(" Could not get Json for Item");
                } else {

                    var custom = item.customContent,
                        isSwatchType = custom.customType == 'swatch',
                        fileName = item.title,
                        item_id = custom.itemID || '',
                        itemId = isSwatchType ? 'FINISH ' + item_id : item_id,
                        title = custom.itemTitle.source || '',
                        body = item.body || '',
                        series = _.without(item.tags, '* Featured', 'Specialty'),
                        $Body = cheerio.load(body.replace(/<br \/>/g, '</p><p>'));
                        $ItemTitle = cheerio.load(title),
                        textItems = [],
                        assetUrl = '',
                        specUrl = '',
                        swatchUrl = '',
                        useLargeSpecImage = custom['specImage-lrg'] || false;






                    $Body('p').each(function (i, elem) {
                        textItems.push($Body(this).text());
                    });

                    itemTitle = $ItemTitle('p').text();

                    if (item.customContent && item.customContent.customMainImage) {
                        assetUrl = item.customContent.customMainImage.assetUrl;
                    } else {
                        assetUrl = item.assetUrl;
                    }

                    if (custom.secondarySwatch) {
                        swatchUrl = custom.secondarySwatch.assetUrl;
                    }

                    if (custom.specImage && custom.specImage.assetUrl) {
                        specUrl = custom.specImage.assetUrl;
                    }

                    if (assetUrl === "") {
                        callback("AssetUrl can not be empty");
                    }
                    return {
                        assetUrl: assetUrl,
                        isSwatchType: isSwatchType,
                        secondaryUrl: specUrl || swatchUrl,
                        useLargeSpecImage: useLargeSpecImage,
                        textItems: textItems,
                        itemId: itemId,
                        title: itemTitle,
                        series: series,
                        fileName: fileName
                    };
                }
            }
        })
            .then(function (results) {
                var defer = q.defer();

                if (results.secondaryUrl) { // grabbing
                    var opts = url.parse(results.secondaryUrl);

                    opts.headers = {'User-Agent': 'javascript'};
                    opts.protocol = "http:";
                    http.get(opts, function (response) {

                        var type = response.headers["content-type"],
                            prefix = "data:" + type + ";base64,",
                            body = "";

                        response.setEncoding('binary');

                        response.on('data', function (chunk) {
                            if (response.statusCode == 200) {
                                body += chunk;
                            }
                        });
                        response.on('end', function () {

                            var base64 = new Buffer(body, 'binary').toString('base64');
                            results.secondaryData = prefix + base64;
                            defer.resolve(results);
                        });
                    })
                } else {
                    defer.resolve(results);
                }
                return defer.promise;
            })
            .then(function (results) {
                var defer = q.defer();

                if (results.assetUrl) {
                    var opts = url.parse(results.assetUrl);

                    opts.headers = {'User-Agent': 'javascript'};
                    opts.protocol = "http:";
                    http.get(opts, function (response) {

                        var type = response.headers["content-type"],
                            prefix = "data:" + type + ";base64,",
                            body = "";

                        response.setEncoding('binary');

                        response.on('data', function (chunk) {
                            if (response.statusCode == 200) body += chunk;
                        });
                        response.on('end', function () {
                            var base64 = new Buffer(body, 'binary').toString('base64');
                            results.assetData = prefix + base64;
                            defer.resolve(results);
                        });
                    });
                } else {
                    callback('Could not convert AssetUrl')
                }

                return defer.promise;
            })
            .then(function (results) {

                var itemId = results.itemId,
                    title = results.title,
                    assetData = results.assetData,
                    isSwatchType = results.isSwatchType,
                    series = results.series,
                    textItems = results.textItems,
                    fileName = results.fileName,
                    useLargeSpecImage = results.useLargeSpecImage,
                    firstColumnWidth = useLargeSpecImage ? '50%' : '60%',
                    secondColumnWidth = useLargeSpecImage ? '50%' : '40%',
                    secondaryData = results.secondaryData,
                    secondaryFit = useLargeSpecImage ? [200, 200] : isSwatchType ? [100, 100] : [150, 150],
                    assetFit = isSwatchType ? [300, 300] : [400, 400],
                    secondaryMargin = isSwatchType ? [0, 40, 50, 0] : [0, 20, 10, 0],
                    secondaryRow = isSwatchType ? 1 : 0,
                    secondaryCell = isSwatchType ? 0 : 1,
                    rowOne = 0,
                    rowTwo = 1,
                    cellOne = 0,
                    cellTwo = 1;


                var footerText = 'www.sunvalleybronze.com  706 South Main Street, Bellevue, Idaho 83313  |  866.788.3631';
                var document = {
                    pageSize: 'letter', //{width: 8 * 72, height: 11.5 * 72},
                    footer: {
                        text: footerText,
                        style: 'footerStyle'
                    },
                    content: [{
                        image: 'images/sv-logo.png',
                        fit: [100, 80],
                        alignment: 'center'
                    }, {
                        margin: [0, 10, 0, 0],
                        image: 'images/finishes.jpg',
                        alignment: 'center',
                        fit: [500, 30]
                    }
                    ],
                    styles: {
                        titleStyle: {
                            font: 'Bodoni',
                            color: '#585d64',
                            fontSize: 14,
                            margin: [0, 0, 0, 8]
                        },
                        itemIdStyle: {
                            font: 'Orator',
                            color: '#585d64',
                            fontSize: 10,
                            margin: [0, 0, 0, 3]
                        },
                        itemStyle: {
                            width: '10',
                            fontSize: 9,
                            color: '#585d64',
                            font: 'Calluna',

                            margin: [0, 0, 0, 2]
                        },
                        footerStyle: {
                            fontSize: 9,
                            color: '#585d64',
                            font: 'Calluna',
                            alignment: 'center'
                        }
                    }
                };


                var table = {
                    layout: 'noBorders',

                    table: {

                        widths: [firstColumnWidth, secondColumnWidth],
                        body: [
                            [
                                {
                                    margin: [20, 20, 20, 20],
                                    stack: [
                                        {
                                            text: itemId,
                                            style: 'itemIdStyle'
                                        },
                                        {
                                            text: title,
                                            style: 'titleStyle'
                                        }
                                    ]
                                }, {
                                stack: []
                            }
                            ], [  // Begin Row 2
                                { // Begin cell 0
                                    margin: [0, 20, 0, 0],
                                    colSpan: 2,
                                    stack: [{
                                        image: assetData,
                                        fit: assetFit,
                                        alignment: 'center'
                                    }]
                                }

                            ] // End Row 2
                        ] // End Body
                    }
                };


                document.content.push(table);
                renderSeries();

                renderBody();
                renderSecondaryImage();


                function renderSecondaryImage() {
                    if (secondaryData)
                        document.content[document.content.length - 1].table.body[secondaryRow][secondaryCell].stack.push({
                            image: secondaryData,
                            margin: secondaryMargin,
                            fit: secondaryFit,
                            width: '100%',
                            alignment: 'right'
                        });
                }


                function renderBody() {

                    textItems.forEach(function (item) {
                        document.content[document.content.length - 1].table.body[rowOne][cellOne].stack.push({
                            width: firstColumnWidth,
                            text: item,
                            style: 'itemStyle'
                        });
                    });
                }

                function renderSeries() {
                    if (series) {

                        var seriesContent = {
                            columnGap: 5,
                            columns: [],
                            margin: [0, 0, 0, 10]
                        };

                        _.each(series, function (item) {
                            seriesContent.columns.push({
                                width: 'auto',
                                table: {

                                    body: [
                                        [{
                                            text: item.toUpperCase(),
                                            margin: [3, 3, 3, 3],
                                            fontSize: 7,
                                            font: 'Orator',
                                            color: '#585d64'
                                        }]
                                    ]
                                }
                            });
                        });

                        document.content[document.content.length - 1].table.body[rowOne][cellOne].stack.unshift(seriesContent);
                    }
                }


                return {
                    doc: document,
                    fileName: fileName

                };
            })
            .then(function (results) {
                var printer = new PdfPrinter(fonts);
                var doc = printer.createPdfKitDocument(results.doc);

                var chunks = [];
                var result;

                doc.on('data', function (chunk) {
                    chunks.push(chunk);
                });
                doc.on('end', function () {
                    result = Buffer.concat(chunks);

                    var p = 'public/tearsheets/tearsheet_' + results.fileName + '.pdf';
                    var s3Path = common.toS3Path(p);
                    var putOptions = {
                        ACL: 'public-read',
                        Bucket: bucketName,
                        Key: s3Path,
                        Body: result,
                        ContentDisposition: 'inline; filename=' + path.basename(p),
                        ContentType: mime.lookup(p) || 'application/octet-stream'
                    };

                    console.log('uploading to s3: ' + s3Path);
                    const s3 = new common.aws.S3();
                    s3.putObject(putOptions, function (err, data) {
                        callback(err, s3Path);
                    });
                });
                doc.end();

            });

}
module.exports = tearSheetGenerator;
