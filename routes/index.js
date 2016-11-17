var express = require('express');
var router = express.Router();

var fs = require('fs');
var util = require('util');
var mime = require('mime');
var multer = require('multer');
var upload = multer({dest: 'uploads/'});
var cloudinary = require('cloudinary');
var imgur = require('imgur');

var gcloud = require('google-cloud')({              //configures the google cloud vision api
    keyFilename: './MyProject-40b116021b11.json',
    projectId: 'celestial-digit-130223'
});

var vision = gcloud.vision();

router.get('/', function(req, res, next) {         //return the home page
  res.render('index', {
    title: 'Home'});

});

router.get('/search', function(req, res, next) {       //when the search get function is called

    var search = req.query.search;                     //get the search string from search form in view
    var images = [];                                   //image array to be returned
    if(search != null && search != ''){                 //if search is not null or just an empty string, proceed
    var tags = search.split(',');                       //split the string on comma and make an array out of the resulting words
    var count = 0;                                      //number of tags we've been through
    var urlCount = 0;                                   //number of urls in url list
    var imageId = 0;
    var imgCount = 0;

    if(tags.length>10){                                 //if there are more than 10 tags specified, return view with error
        res.render('search', {
            title: 'Search',
            search:search,
            images:images,
            error:'Too many tags specified. Max 10 allowed.'});
    }
    for(var n=0;n<tags.length;n++){                     //iterate through the tags

        cloudinary.api.resources_by_tag(tags[n], function (result) {    //get the recourses by that tag

            count +=1;                                                  //we've gotten through a tag, increase tag count
            urls = [];                                                  //urls from this tag
            for (var i = 0; i < result.resources.length; i++) {         //iterate through results
                var url = result.resources[i].url;
                if(urls.indexOf(url) === -1){                           //if image is not already in url array, add it

                    urls[urlCount] = url;                               //add url
                    urlCount += 1;

                    var modalImg = imageId.toString()+'m';              //create ids for images
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
                    };                                                  //make image object with needed variables
                    image.Jstring = JSON.stringify(image);              //create json string of image object
                    images[imgCount] = image;                           //add image to images
                    imgCount += 1;                                      //one more imag is added
                    imageId +=1;                                        //increase imageId for use in next iteration
                }
            }

        },{max_results:500});                                           //max displayed results are 500
    }
   var interval = setInterval(function () {                             //with 500 milliseconds interval check if we've iterated and gotten results for all tags, if we have render view with images
        if(count==tags.length){
            res.render('search', {
                title: 'Search',
                search:search,
                images:images,
                error:null});
            clearInterval(interval);
        }
    },500);
}else{                                          //search is null or empty string
        res.render('search', {
            title: 'Search',
            search:search,
            images:images,
            error:'Invalid search'});
    }
});

//upload function
router.post('/upload', upload.array('images'), function(req, res, next) {

    var types = ['labels','landmarks','faces','logos','text']; //what different types the google cloud api should detect
    var images = [];                                            //image array
    for(var i=0;i< req.files.length;i++){                       //add all image urls to the image array
        images[i] = req.files[i].path;
    }
    if(images.length > 2){                                      //if there are more images than two the API does not work for some reason, so reply with error
        res.render('upload', {
            title: 'Upload',
            images:null,
            error:"Only a maximum of 2 pictures are allowed at a time"});
        return;
    }

    vision.detect(images, types, function(err, detections, apiResponse) {   //sends images to the google servers for detection
        if (err) {
            res.render('upload', {                                          //error returned, render view with error message
                title: 'Upload',
                images:null,
                error:"Cloud vision error"});
        } else {

            var img = [];
            if(images.length === 1){        //if there is only one image it needs to be handeled seperately because of the API
                var tags = getTags(detections);     //get the tags for the detections
                var baseImg =base64Image(images[0]);    //make the image base64 format
                img[0] ={tags:tags,image:baseImg};      //make image object with the tags and the image
                cloudinary.uploader.upload(images[0], function(result) {    //upload the image to cloudinary
                    },{
                        tags:tags                                           //set the tags
                    }
                );
                fs.unlinkSync(images[0].toString());                        //delete the local copy of image when we're done with it

            }else{

                for(var m =0;m<detections.length;m++){      //more than one image, do same as before just in a loop
                    var tags = getTags(detections[m]);
                    var baseImg =base64Image(images[m]);
                    img[m] ={tags:tags,image:baseImg};
                    cloudinary.uploader.upload(images[m], function(result) {
                        },{
                            tags:tags
                        }
                    );
                    fs.unlinkSync(images[m].toString());
                }
            }

            res.render('upload', {                  //render view with the images
                title: 'Upload',
                images:img});


        }
    });
});

//detection parsing method. Because the face detection section of the google api response is a little wierdly made, we need a whole function for this, returning a list with the tags
function getTags(detections){
    var count = 0;
    var faces = [];
    if(detections.faces.length > 0){
    if(detections.faces[0].confidence > 50.0){
        faces[count] = 'confident';
        count +=1;
    }
    if(detections.faces[0].dark){
        faces[count] = 'dark';
        count +=1;
    }
    if(detections.faces[0].happy){
        faces[count] = 'happy';
        count +=1;
    }
    if(detections.faces[0].hat){
        faces[count] = 'hat';
        count +=1;
    }
    if(detections.faces[0].mad){
        faces[count] = 'mad';
        count +=1;
    }
    if(detections.faces[0].sad){
        faces[count] = 'sad';
        count +=1;
    }
    if(detections.faces[0].surprised){
        faces[count] = 'surprised';
        count +=1;
    }
    }
    var tags = detections.labels.concat(faces).concat(detections.landmarks).concat(detections.logos).concat(detections.text);
    return tags;
}

//edit method for the images
router.get('/edit', function(req, res){
    var image = req.query.image;        //get image url from request
    var action = req.query.action.toString();   //get the action from request to be taken on image
    var resImg = null;                          //image to send in response
    if(action==''){                             //if no action is take, return basic image
        resImg = cloudinary.image(image);
    }else{                                      //else return image with desiered effect
        resImg = cloudinary.image(image, {effect: action});
    }
    res.send(resImg);
});

//delete method to delete images from the cloud
router.get('/delete', function(req, res){
    var image = req.query.imageId;

    cloudinary.api.delete_resources([image],        //delete request to the API
        function(result){
            res.send(result);
        });
});

//publish method for single images
router.get('/publish', function(req, res){
    var url = req.query.url;

    imgur.uploadUrl(url)        //upload to imgur
        .then(function (json) {
            var imgUrl ='http://www.imgur.com/'+ json.data.id;  //create the imgur url and send it back
            res.send(imgUrl);
        })
        .catch(function (err) {
            res.send('error');     //error occurred
        });

});

//publish an album
router.get('/publishalbum', function(req, res){
    var AlbumList = req.query.imgList;  //get list of image urls

    imgur.uploadAlbum(AlbumList,'Url')      //publish to imgur
        .then(function(album) {
            var albumUrl ='http://www.imgur.com/a/'+album.data.id;  //create album link
            res.send(albumUrl);
        })
        .catch(function (err) {         //error occurred
            res.send('error');
        });

});

//login with imgur
router.get('/login', function(req, res){
    var email = req.query.email;            //get email and password from request
    var password = req.query.password;

    imgur.setCredentials(email, password, '9ac3ab4bea0c50a');       //set the credidentials

    res.send(null);

});

// Turn image into Base64 format for easy display
function base64Image(src) {
    var data = fs.readFileSync(src).toString('base64');
    return util.format('data:%s;base64,%s', mime.lookup(src), data);
}

module.exports = router;
