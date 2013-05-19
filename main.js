YUI().use('transition', 'yql', 'io', 'node', 'base', function (Y) {
    var bodyElem = Y.one('body');
    var cWidth = parseInt(bodyElem.getComputedStyle('width'), 10);
    var cHeight = parseInt(bodyElem.getComputedStyle('height'), 10) - 74;
    var WIDTH, HEIGHT; //canvas
    var firstGetPair = true;
    if (cWidth / cHeight > 4/3) { //limit = height
        WIDTH = Math.floor(cHeight / 3 * 4);
        HEIGHT = cHeight;
    } else {
        WIDTH = cWidth;
        HEIGHT = Math.floor(cWidth / 4 * 3);
    }
    var alpha1 = [];
    var FLICKR_TEMPLATE = 'http://farm{farm}.staticflickr.com/{server}/{id}_{secret}_z.jpg';
    //init alpha value
    (function () {
        var i, m = HEIGHT / 2;
        var sgn = function (a) {
            if (a === 0){
                return 0;
            } else if (a > 0) {
                return 1;
            } else {
                return -1;
            }
        }
        for (i = 0; i < HEIGHT; i += 1){
            alpha1[i] = Math.atan(1.2 * sgn(i - m) * Math.pow((i - m)/40, 2))/Math.PI + 0.5;
            alpha1[i] = (alpha1[i] < 0) ? 0 :
                (alpha1[i] > 1) ? 1 : alpha1[i];
        }
    }());
    (function () {
        Y.one('#page').setStyle('width', WIDTH).setStyle('height', HEIGHT);
        Y.Node.create('<canvas>').set('width', WIDTH).set('height', HEIGHT).set('id', 'show').appendTo('#page');
        Y.Node.create('<canvas>').set('width', WIDTH).set('height', HEIGHT).set('id', 'pic1').appendTo('#page').hide();
        Y.Node.create('<canvas>').set('width', WIDTH).set('height', HEIGHT).set('id', 'pic2').appendTo('#page').hide();
    }());

    var getTagPair = function (callback, isDiff) {
        var tag1 = 'landscape', tag2 = 'portrait';
        var tags;
        Y.all('#thumbs > div').show();
        Y.one('#mask-msg').setHTML('Fetching tag pair from server...');
        if ((firstGetPair === true) || (isDiff === true)){
            Y.io('index.php', {
                data: ''
                ,on: {
                    success: function (id, response) {
                        tags = response.responseText.split(',');
                        //tag1 = tags[0];
                        //tag2 = tags[1];
                        firstGetPair = false;
                        console.log(tags);
                        //callback({tag: [tag1, tag2]}, process);
                    }
                    ,failure: function (id, response) {
                        console.log(response.status);
                            Y.one('#mask-msg').setHTML('Masho server busy. <a id="try-again">Reconnect</a>');
                            Y.one('#try-again').on('click', function (e) {
                                e.preventDefault();
                                Y.one('#mask').show({duration: 1.0});
                                Y.one('#mask-msg').setHTML('Fetching tag pair from server...');
                                setTimeout(function(){getTagPair(getPicUrl, false);}, 1000);
                            });
                    }
                }
            });
        }
        callback({tag: [tag1, tag2]}, process);
    };
    var getPicUrl = function (cond, callback) {
        Y.one('#mask-msg').setHTML('Fetching image url from Flickr server...');
        var url1, url2;
        var validPic = function (w, h) {
            if ((w < WIDTH / 3) || (h < HEIGHT / 3)){
                return false;
            }
            if (w / h < 1) {
                return false;
            }
            return true;
        };
        var urlStatus = [false, false];

        var query = 'select source from flickr.photos.sizes where label="Medium 800" and height<"700" and height>"500" and photo_id in (select id from flickr.photos.search(30) where tags="{tag}" and api_key="92bd0de55a63046155c09f1a06876875") and api_key="92bd0de55a63046155c09f1a06876875";';
        var para1 = {tag: cond.tag[0]};
        var para2 = {tag: cond.tag[1]};
        Y.YQL(Y.Lang.sub(query, para1), function (response) {
            var r = response.query.results, p;
            if (r === null) {
                Y.one('#mask-msg').setHTML('Flickr server busy. <a id="try-again">Reconnect</a>');
                Y.one('#try-again').on('click', function (e) {
                    e.preventDefault();
                    Y.one('#mask').show({duration: 1.0});
                    Y.one('#mask-msg').setHTML('Fetching tag pair from server...');
                    setTimeout(function(){getTagPair(getPicUrl, false);}, 1000);

                });
                return;
            }
            p = r.size;
            var random = Math.floor(Math.random() * p.length);
            random = (random >= p.length) ? p.length : random;
            url1 = p[random].source;
            canWeStart(0);
        });
        Y.YQL(Y.Lang.sub(query, para2), function (response) {
            var r = response.query.results, p;
            if (r === null) {
                Y.one('#mask-msg').setHTML('Flickr server busy. <a id="try-again">Reconnect</a>');
                Y.one('#try-again').on('click', function (e) {
                    e.preventDefault();
                    Y.one('#mask').show({duration: 1.0});
                    Y.one('#mask-msg').setHTML('Fetching tag pair from server...');
                    setTimeout(function(){getTagPair(getPicUrl, false);}, 1000);


                });
                return;
            }
            p = r.size;
            var random = Math.floor(Math.random() * p.length);
            random = (random >= p.length) ? p.length : random;
            url2 = p[random].source;
            canWeStart(1);
        });
        var canWeStart = function (n) {
            urlStatus[n] = true;
            if ((urlStatus[0] === true) && (urlStatus[1] === true)) {
                callback(url1, url2);
            }
        };
    };

    var process = function (url1, url2) {
        //url1 = '1.jpg';
        //url2 = '2.jpg';
        url1 = './proxy.php?url=' + encodeURIComponent(url1) + '&mimeType=image/jpeg';
        url2 = './proxy.php?url=' + encodeURIComponent(url2) + '&mimeType=image/jpeg';
        var cc1 = document.getElementById('pic1'),
            cc2 = document.getElementById('pic2'),
            cf = document.getElementById('show');
        var c1 = cc1.getContext('2d'),
            c2 = cc2.getContext('2d'),
            f = cf.getContext('2d');
        var Ic1 = new Image(),
            Ic2 = new Image();
        var fc1, fc2, length, i, r, g, b, a, ff = [];
        var r1, r2, g1, g2, b1, b2, a1, a2, aa, bf = 1, bigA1, bigA2;
        Ic1.onload = function () {
            c1.drawImage(this, 0, 0, this.width, this.height, 0, 0, cc1.width, cc1.height);
            canWeBegin(0);
        };
        Ic2.onload = function () {
            c2.drawImage(this, 0, 0, this.width, this.height, 0, 0, cc2.width, cc2.height);
            canWeBegin(1);
        };
        Ic1.src = url1;
        Ic2.src = url2;
        Y.one('#mask-msg').setHTML('Loading images...');
        var canWeBegin = (function () {
            var h = [false, false];
            return function (n) {
                h[n] = true;
                Y.one('#mask-msg').setHTML('Rendering...');
                if ((h[0] === true) && (h[1] === true)){
                    fc1 = c1.getImageData(0, 0, cc1.width, cc1.height);
                    fc2 = c2.getImageData(0, 0, cc2.width, cc2.height);
                    length = fc1.data.length / 4;
                    for (i = 0; i < length; i += 1){
                        //blending images equation from http://stackoverflow.com/questions/10781953/determine-rgba-colour-received-by-combining-two-colours
                        r1 = fc1.data[i * 4 + 0];
                        g1 = fc1.data[i * 4 + 1];
                        b1 = fc1.data[i * 4 + 2];
                        //bigA1 = 127;
                        //a1 = bigA1 / 255;
                        a1 = alpha1[Math.floor(i / WIDTH)];
//if (i % 10000 === 0) console.log(a1);
                        r2 = fc2.data[i * 4 + 0];
                        g2 = fc2.data[i * 4 + 1];
                        b2 = fc2.data[i * 4 + 2];
                        //bigA2 = 127;
                        //a2 = bigA2 / 255;
                        a2 = 1 - a1;
                        a = a1 + (1 - a1) * a2 * bf;
                        r = (r1 * a1 + r2 * a2 * (1 - a1)) / a;
                        g = (g1 * a1 + g2 * a2 * (1 - a1)) / a;
                        b = (b1 * a1 + b2 * a2 * (1 - a1)) / a;
                        a *= 255;
                        r = (r < 0) ? 0 :
                            (r > 255) ? 255 : r;
                        g = (g < 0) ? 0 :
                            (g > 255) ? 255 : g;
                        b = (b < 0) ? 0 :
                            (b > 255) ? 255 : b;
                        a = (a < 0) ? 0 :
                            (a > 255) ? 255 : a;
                        fc2.data[i * 4 + 0] = Math.round(r);
                        fc2.data[i * 4 + 1] = Math.round(g);
                        fc2.data[i * 4 + 2] = Math.round(b);
                        fc2.data[i * 4 + 3] = Math.round(a);
                    }
                    f.putImageData(fc2, 0, 0);
                    Y.one('#mask').hide({duration: 2.0});
                }
            };
        }());
    };

//onload:
    Y.all('.my-button').show();
    Y.one('#thumbs').show();
    getTagPair(getPicUrl);
    Y.one('#diff').on('click', function (e) {
        e.preventDefault();
        Y.one('#mask').show({duration: 1.0});
        Y.one('#mask-msg').setHTML('Fetching tag pair from server...');
        setTimeout(function(){getTagPair(getPicUrl, true);}, 1000);
    });
    Y.all('.simi').on('click', function (e) {
        e.preventDefault();
        Y.one('#mask').show({duration: 1.0});
        Y.one('#mask-msg').setHTML('Fetching tag pair from server...');
        setTimeout(function(){getTagPair(getPicUrl, false);}, 1000);
    });
/*
    Y.one('header').delegate('click', function (e) {
        e.preventDefault();
        Y.one('#mask').show({duration: 1.0});
        Y.one('#mask-msg').setHTML('Fetching tag pair from server...');
        setTimeout(function(){getTagPair(getPicUrl, (e.target.get('id') === 'simi') ? false : true);}, 1000);
    }, '.my-button');
*/
    Y.one('#thumbs').delegate('click', function (e) {
        e.preventDefault();
        var id = e.target.get('id');
        if (id === 'thumbs-down') {
            Y.one('#thumbs-up').hide(true);
        } else {
            Y.one('#thumbs-down').hide(true);
        }
        Y.io('index.php', {
            data: 'name=' + ((e.target.get('id') === 'thumbs-up') ? 'like' : 'dislike')
        });
    }, 'div');
});



//select * from flickr.photos.interestingness(20) where api_key="92bd0de55a63046155c09f1a06876875";
