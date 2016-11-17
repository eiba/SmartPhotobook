var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('search', {
        title: 'Search',
        images:null,                        //no requested images or search if this url is requested without parameters
        search:null
    });
});
module.exports = router;