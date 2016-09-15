var express = require('express');
var router = express.Router();
var cloudinary = require('cloudinary');


router.get('/', function(req, res, next) {

    var images = [];
    cloudinary.api.resources(function(result){
        console.log(result);
        var imageId = 0;

        for(var i=0;i<result.resources.length;i++){
            var modalImg = imageId.toString()+'m';
            var modalId = imageId.toString()+'i';
            var captionId = imageId.toString()+'c';
            var sliderId = imageId.toString()+'s';

            var image = {
                url:result.resources[i].url,
                modalId:modalId,
                modalImg:modalImg,
                imageId:imageId,
                captionId:captionId,
                sliderId:sliderId,
                publicId:result.resources[i].public_id,
                id: result.resources[i].public_id +'.'+result.resources[i].format
            };
            image.Jstring = JSON.stringify(image);
            images[i] = image;
            imageId +=1;
        }
        res.render('images', {
            title: 'Images',
            images:images
        });
    }, { type: 'upload',
         max_results:500
        });


});

module.exports = router;