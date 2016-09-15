var express = require('express');
var router = express.Router();

var fs = require('fs');
var util = require('util');
var mime = require('mime');
var multer = require('multer');
var upload = multer({dest: 'uploads/'});
var cloudinary = require('cloudinary');
var imgur = require('imgur');

var gcloud = require('google-cloud')({
    keyFilename: './MyProject-40b116021b11.json',
    projectId: 'celestial-digit-130223'
});

var vision = gcloud.vision();

router.get('/', function(req, res, next) {

  res.render('index', {
    title: 'Home'});

});

router.get('/search', function(req, res, next) {

    var search = req.query.search;
    var images = [];
    if(search != null && search != ''){
    var tags = search.split(',');
    console.log(tags);
    var count = 0;
    var urlCount = 0;
    var imageId = 0;
    var imgCount = 0;

    if(tags.length>10){
        res.render('search', {
            title: 'Search',
            search:search,
            images:images,
            error:'Too many tags specified. Max 10 allowed.'});
    }
    for(var n=0;n<tags.length;n++){

        cloudinary.api.resources_by_tag(tags[n], function (result) {
            /*if (error) {
                res.end("error");
            }*/
            console.log(count);
            console.log(result);
            count +=1;
            urls = [];
            for (var i = 0; i < result.resources.length; i++) {
                var url = result.resources[i].url;
                if(urls.indexOf(url) === -1){

                    urls[urlCount] = url;
                    urlCount += 1;

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
                    images[imgCount] = image;
                    imgCount += 1;
                    imageId +=1;
                }
            }

        },{max_results:500});
    }
   var interval = setInterval(function () {
        if(count==tags.length){
            res.render('search', {
                title: 'Search',
                search:search,
                images:images,
                error:null});
            clearInterval(interval);
        }
    },500);
}else{
        res.render('search', {
            title: 'Search',
            search:search,
            images:images,
            error:'Invalid search'});
    }
});

router.post('/upload', upload.array('images'), function(req, res, next) {

    // Choose what the Vision API should detect
    // Choices are: faces, landmarks, labels, logos, properties, safeSearch, text
    var types = ['labels','landmarks','faces','logos','text'];
    console.log(req.files.length);
    var images = [];
    for(var i=0;i< req.files.length;i++){
        images[i] = req.files[i].path;
    }


    // Send the images to the Cloud Vision API
    vision.detect(images, types, function(err, detections, apiResponse) {
        if (err) {
            res.end("Cloud vision error");
            console.log(err);
            console.log(apiResponse);
        } else {

            var img = [];
            if(images.length === 1){
                var tags = getTags(detections);
                var baseImg =base64Image(images[0]);
                img[0] ={tags:tags,image:baseImg};
                cloudinary.uploader.upload(images[0], function(result) {
                    console.log(result);
                    },{
                        tags:tags
                    }
                );
                fs.unlinkSync(images[0].toString());

            }else{

                for(var m =0;m<detections.length;m++){
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

            res.render('upload', {
                title: 'Upload',
                images:img});


            // Delete file
            //fs.unlinkSync(req.file.path);

        }
    });
});

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
    console.log(detections);
    console.log(tags);
    return tags;
}

router.get('/edit', function(req, res){
    var image = req.query.image;
    var action = req.query.action.toString();
    var resImg = null;
    if(action==''){
        resImg = cloudinary.image(image);
    }else{
        resImg = cloudinary.image(image, {effect: action});
    }
    res.send(resImg);
});

router.get('/delete', function(req, res){
    var image = req.query.imageId;

    console.log(image);
    cloudinary.api.delete_resources([image],
        function(result){
        console.log(result);
            res.send(result);
        });
});

router.get('/publish', function(req, res){
    var url = req.query.url;

    console.log(url);
    imgur.uploadUrl(url)
        .then(function (json) {
            console.log(json.data);
            var imgUrl ='http://www.imgur.com/'+ json.data.id;
            console.log(imgUrl);
            res.send(imgUrl);
        })
        .catch(function (err) {
            console.error(err.message);
        });

});

router.get('/publishalbum', function(req, res){
    var AlbumList = req.query.imgList;

    console.log(AlbumList);
    imgur.uploadAlbum(AlbumList,'Url')
        .then(function(album) {
            console.log(album.data);
            var albumUrl ='http://www.imgur.com/a/'+album.data.id;
            res.send(albumUrl);
        })
        .catch(function (err) {
            console.error(err.message);
            res.send('error');
        });

});

router.get('/login', function(req, res){
    var email = req.query.email;
    var password = req.query.password;

    imgur.setCredentials(email, password, '9ac3ab4bea0c50a');

    res.send(null);

});

console.log('Server Started');

// Turn image into Base64 so they can be displayed easily
function base64Image(src) {
    var data = fs.readFileSync(src).toString('base64');
    return util.format('data:%s;base64,%s', mime.lookup(src), data);
}

module.exports = router;
