var express = require('express');
var router = express.Router();
var fs = require('fs');



router.get('/imageview', function (req, res, next) {
    const path = decodeURIComponent(req.path);
    console.log(path);
    var bookcover;


    res.render('imageview', {
        images : bookcover
      });

});

module.exports = router;
