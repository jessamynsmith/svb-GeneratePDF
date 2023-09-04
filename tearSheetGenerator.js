var _ = require('underscore');

var path = require('path');
var rp = require('request-promise');
var common = require("./common");
var PdfPrinter = require('pdfmake/src/printer');
var fs = require('fs');
var https = require('https');
var url = require('url');
var mime = require('mime-types');
var cheerio = require('cheerio');
var q = require('q');
var fonts = require('./fonts');

function tearSheetGenerator(event, context, callback) {
  
    // Global variables and functions used for flexibly retrieving images
    // from squarespace, including following any redirects.
    var defer;
    var globalResults;
    var resultsKey = '';

    var getFilenameFromUrl = function(url) {
        var parts = url.split('/');
        var filename = parts[parts.length - 1];
        return filename;
    };

    var createCdnUrl = function(systemDataId, filename) {
        var url = `https://images.squarespace-cdn.com/content/56143f12e4b03f677dbf60c7/${systemDataId}/${filename}`;
        return url;
    };
                  
    var createOpts = function(dataUrl) {
      var opts = url.parse(dataUrl);

      opts.headers = {'User-Agent': 'javascript'};
      opts.protocol = "https:";
      
      return opts;
    };

    var followRedirectHttpHandler = function (response) {

      var type = response.headers["content-type"],
          prefix = "data:" + type + ";base64,",
          body = "";

      response.setEncoding('binary');

      response.on('data', function (chunk) {
          if (response.statusCode === 200) {
            body += chunk;
          }
      });
      response.on('end', function () {
        if (response.statusCode === 200) {
          var base64 = new Buffer.from(body, 'binary').toString('base64');
          globalResults[resultsKey] = prefix + base64;
          defer.resolve(globalResults);
        } else if (response.statusCode === 301) {
          // If we get a redirect, follow it and try to get the image from that location
          var opts = createOpts(response.headers.location);
          https.get(opts, followRedirectHttpHandler);
        }
      });
    };
    // End Global variables and functions

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
                    
                    var filterTags = function(tags) {
                        var filteredTags = [];
                        for (var i = 0; i < tags.length; i++) {
                            var value = tags[i];
                            if (value !== 'Specialty' && !value.startsWith('* ')) {
                                filteredTags.push(value);
                            }
                        }
                        return filteredTags;
                    };

                    var filteredTags = filterTags(item.tags);
                    var custom = item.customContent,
                        isSwatchType = custom.customType == 'swatch',
                        fileName = item.title,
                        item_id = custom.itemID || '',
                        itemId = isSwatchType ? 'FINISH ' + item_id : item_id,
                        title = custom.itemTitle.html || '',
                        body = item.body || '',
                        series = filteredTags,
                        $Body = cheerio.load(body.replace(/<br \/>/g, '</p><p>'));
                        $ItemTitle = cheerio.load(title),
                        textItems = [],
                        assetUrl = '',
                        specUrl = '',
                        specUrlSystemDataId = '',
                        swatchUrl = '',
                        swatchUrlSystemDataId = '',
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
                        swatchUrlSystemDataId = custom.secondarySwatch.systemDataId;
                    }

                    if (custom.specImage && custom.specImage.assetUrl) {
                        specUrl = custom.specImage.assetUrl;
                        specUrlSystemDataId = custom.specImage.systemDataId;
                    }

                    if (assetUrl === "") {
                        callback("AssetUrl can not be empty");
                    }
                    var result_data = {
                        assetUrl: assetUrl,
                        isSwatchType: isSwatchType,
                        secondaryUrl: specUrl || swatchUrl,
                        secondarySystemDataId: specUrlSystemDataId || swatchUrlSystemDataId,
                        useLargeSpecImage: useLargeSpecImage,
                        textItems: textItems,
                        itemId: itemId,
                        title: itemTitle,
                        series: series,
                        fileName: fileName,
                        systemDataId: results.item.systemDataId,
                    };
                    return result_data;
                }
            }
        })
            .then(function (results) {
                defer = q.defer();

                if (results.secondaryUrl) { // grabbing
                    globalResults = results;
                    resultsKey = 'secondaryData';

                    var secondaryFilename = getFilenameFromUrl(results.secondaryUrl);
                    var secondaryUrl = createCdnUrl(results.secondarySystemDataId, secondaryFilename);
                    var opts = createOpts(secondaryUrl);
                    https.get(opts, followRedirectHttpHandler);
                } else {
                    defer.resolve(results);
                }
                return defer.promise;
            })
            .then(function (results) {
                defer = q.defer();

                if (results.assetUrl) {
                    globalResults = results;
                    resultsKey = 'assetData';
                    
                    var opts = createOpts(results.assetUrl);
                    https.get(opts, followRedirectHttpHandler);
                } else {
                    callback('Could not convert AssetUrl');
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
                    secondaryFit = useLargeSpecImage ? [200, 200] : isSwatchType ? [100, 100] : [200, 200],
                    assetFit = isSwatchType ? [300, 300] : [300, 300],
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
                                },
                                layout: {
                                    hLineWidth: function (i, node) {
                                        return 0.6;
                                    },
                                    vLineWidth: function (i, node) {
                                        return 0.6;
                                    },
                                    hLineColor: function (i, node) {
                                        return '#cccccc';
                                    },
                                    vLineColor: function (i, node) {
                                        return '#cccccc';
                                    },
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
                    console.log('uploading to s3: ' + s3Path);
                    
                    // Uncomment for debugging
                    // fs.mkdirSync(path.dirname(s3Path), { recursive: true });
                    // fs.writeFileSync(s3Path, result);
                    // callback(null, s3Path);
                    
                    var putOptions = {
                        ACL: 'public-read',
                        Bucket: bucketName,
                        Key: s3Path,
                        Body: result,
                        ContentDisposition: 'inline; filename=' + path.basename(p),
                        ContentType: mime.lookup(p) || 'application/octet-stream'
                    };

                    const s3 = new common.aws.S3();
                    s3.putObject(putOptions, function (err, data) {
                        callback(err, s3Path);
                    });
                });
                doc.end();

            })
        .catch(function(err) {
            console.log(err);
            callback(err);
        });

}
module.exports = tearSheetGenerator;
