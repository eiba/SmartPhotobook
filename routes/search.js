var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('search', {
        title: 'Search',
        images:null,
        search:null
    });
});
module.exports = router;