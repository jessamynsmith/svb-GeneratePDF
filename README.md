# SunValleyBronze.com AWS Lambda GeneratePDF

This repository is uploaded to the AWS Lambda function GeneratePDF.

It runs in Node 18.

The functionality is accessed from the squarespace site. Both catalog-collection.item
and swatch-collection.item have a .generateTearSheet class with a click listener that
makes an ajax call to the tearsheetUrl.

The Amazon tearsheetUrl is: https://7kscbhlqn1.execute-api.us-west-2.amazonaws.com/prod/GeneratePDF


### Local testing

1. Copy example-secrets.json into secrets.json and edit it to contain your AWS credentials.
1. In terminal:

    npm install
    npm install -g nodemon
    
1. Run the server:

    nodemon server.js
    
1. Generating a PDF for a given item URL:

    BROKEN TEARSHEET: https://www.sunvalleybronze.com/catalog/door-hardware/handle-entry-sets/cs-wh1618-vertical-inlay-handle-x-lever-mortise-lock-door-entry-set
    WORKING TEARSHEET: https://www.sunvalleybronze.com/catalog/door-hardware/handle-entry-sets/ts-kyo2175-kyoto-handle-x-lever-door-entry-set

    Spec:
    curl -vk -X POST -H "Content-Type: application/json" --data '{"itemUrl": "https://www.sunvalleybronze.com/catalog/door-hardware/handle-entry-sets/cs-wh1618-vertical-inlay-handle-x-lever-mortise-lock-door-entry-set"}' http://127.0.0.1:5001/GeneratePDF

    Tags testing:
    curl -vk -X POST -H "Content-Type: application/json" --data '{"itemUrl": "https://www.sunvalleybronze.com/catalog/door-hardware/levers/l-106-square-lever"}' http://127.0.0.1:5000/GeneratePDF
    curl -vk -X POST -H "Content-Type: application/json" --data '{"itemUrl": "https://www.sunvalleybronze.com/catalog/door-hardware/interior-sets/cs-n2065-8iml-pr-novus-saddle-privacy-set"}' http://127.0.0.1:5000/GeneratePDF
    curl -vk -X POST -H "Content-Type: application/json" --data '{"itemUrl": "https://www.sunvalleybronze.com/catalog/door-hardware/lever-knob-entry-sets/cs-m100-ml-minimalist-mortise-lock-door-entry-set"}' http://127.0.0.1:5000/GeneratePDF
    curl -vk -X POST -H "Content-Type: application/json" --data '{"itemUrl": "https://www.sunvalleybronze.com/catalog/cabinet-hardware/pulls/ck-722-twig-cabinet-pull"}' http://127.0.0.1:5000/GeneratePDF
    
    curl -X POST -H "Content-Type: application/json" --data '{"itemUrl": "https://www.sunvalleybronze.com/catalog/door-hardware/handle-entry-sets/ts-kyo2175-kyoto-handle-x-lever-door-entry-set"}' http://127.0.0.1:5000/GeneratePDF
    
    curl -X POST -H "Content-Type: application/json" --data '{"itemUrl": "https://www.sunvalleybronze.com/catalog/door-hardware/knobs/k-201-mushroom-door-knob"}' http://127.0.0.1:5000/GeneratePDF
    
    curl -X POST -H "Content-Type: application/json" --data '{"itemUrl": "https://www.sunvalleybronze.com/catalog/kitchen-and-bath/faucets-and-fixtures/ts-shr-900-/-ts-shr-901hh-1-rnd-exposed-wall-mount-thermostatic-shower-set-with-hand-held-shower-and-round-escutcheons"}' http://127.0.0.1:5000/GeneratePDF
    
    Swatch:
    curl -X POST -H "Content-Type: application/json" --data '{"itemUrl": "https://www.sunvalleybronze.com/finishes/s"}' http://127.0.0.1:5000/GeneratePDF
    
    curl -X POST -H "Content-Type: application/json" --data '{"itemUrl": "http://www.sunvalleybronze.com/catalog/door-hardware/grip-handles/dh-6-d-handle"}' http://127.0.0.1:5000/GeneratePDF
    curl -X POST -H "Content-Type: application/json" --data '{"itemUrl": "https://www.sunvalleybronze.com/catalog/hospitality/card-readers/ts-f424ml-pf"}' http://127.0.0.1:5000/GeneratePDF

### Updating on Amazon 

1. Create a new zip using the script:

    sh scripts/create_deployment_zip.sh
    
1. Log in to the SVB Amazon console.
1. Ensure region is Oregon (Lambda functions are only available in Oregon, and the region must be set *before* you go to Lambda).
1. Go to Lambda section.
1. Select GeneratePDF function.
1. Under the Code tab, click Function Package and select the zip you made (it will be in the dist directory).
1. Click the Save button.
1. Verify the new code is working by going to sunvalleybronze.com and clicking a Tearsheet button.