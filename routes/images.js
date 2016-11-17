var express = require('express');
var router = express.Router();
var cloudinary = require('cloudinary');


router.get('/', function(req, res, next) {

    var images = [];        //image url array to return
    cloudinary.api.resources(function(result){
        var imageId = 0;    //image id to be used for different parts of the modal

        for(var i=0;i<result.resources.length;i++){
            var modalImg = imageId.toString()+'m';          //create the different ids
            var modalId = imageId.toString()+'i';
            var captionId = imageId.toString()+'c';
            var sliderId = imageId.toString()+'s';
            var image = {                           //add tge different ids and parameters to the image object to be passed to the view
                url:result.resources[i].url,
                modalId:modalId,
                modalImg:modalImg,
                imageId:imageId,
                captionId:captionId,
                sliderId:sliderId,
                publicId:result.resources[i].public_id,
                id: result.resources[i].public_id +'.'+result.resources[i].format
            };
            image.Jstring = JSON.stringify(image);  //stringify the image object as json string
            images[i] = image;                      //image added to array
            imageId +=1;                            //image id increment
        }
        res.render('images', {                      //render view with images
            title: 'Images',
            images:images
        });
    }, { type: 'upload',
         max_results:500        //max number of images to display
        });


});

module.exports = router;