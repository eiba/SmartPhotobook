var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('upload', {
        title: 'Upload',
        images:null,
        error:'No images were uploaded'     //if this page is requested without any sent in form, no images were uploaded
    });
});
module.exports = router;