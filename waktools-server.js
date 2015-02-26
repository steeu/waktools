
/**
 * @author stefan eugster
 */

var WAKTOOLS = WAKTOOLS || {};

/**
 *	data url maker
 */

WAKTOOLS.dataUriEncode = function ( path ) {
    var file = File(path);
    var mime = {png: 'png', jpg:'jpeg'};
    var result = 'data:image/' + mime[file.extension] + ';base64,' + file.toBuffer().toString('base64');

    return result;  
}


/**
 * trim string endings
 */

WAKTOOLS.trim = function(str) {
    // remove white spaces
    var str = str || '';
    
    str = str.replace(/^\s+/g, '').replace(/\s+$/g, '');
    return str;   
};


/**
 * basic auth
 */

WAKTOOLS.basicAuth = function(user, password) {
    var credentials = user + ':' + password,
        credentials_hash,
        basic_auth;
       
    // base64 hash
    credentials_hash = new Buffer(credentials).toString('base64');
    // basic auth string
    basic_auth = "Basic " + credentials_hash;
    
    return basic_auth;
};


/**
 * create thumbnail from image
 *
 * @param source (String)  source image file path
 * @param target (String)  target image file path
 * @param size   (Number)  max image size (length or heigth) in pixel
 * @param crop   (Boolean) crop image to specified size if true
 * @return result {Object} imagemagick result object
 */

WAKTOOLS.thumbnail = function (source, target, size, crop) {
    try {
        var im = require('image-magick'),
            imCommand = '',
            size = size || __CONFIG.IMAGE_SIZE_THUMBNAIL,
            result;

        // command
        if (crop) {
            imCommand = '"' + source + '" -thumbnail ' + size + 'x' + size + '^> -gravity center -crop ' + size + 'x' + size + ' +0+0 +repage "jpg:' + target + '"';    
        } else {
            imCommand = '"' + source + '" -thumbnail ' + size + 'x' + size + '> "jpg:' + target + '"';
        }
        // convert image
        result = im.convert(imCommand);
        // error log
//        if (result.console && result.console.stdErr) {
//            console.error('[IMAGE-MAGICK] ' + result.console.stdErr);     
//        }

        return result;
    } catch (e) {
       WAKTOOLS.log(e);
       return e;
    }
}


/**
 * create thumbnail from pdf
 *
 * @param source (String)  source pdf file path
 * @param target (String)  target image file path
 * @param size   (Number)  max image size (length or heigth) in pixel
 * @return result {Object} imagemagick result object
 */

WAKTOOLS.thumbnailPDF = function (source, target, size) {
    try {
        var im = require('image-magick'),
            imCommand = '',
            size = size || __CONFIG.IMAGE_SIZE_THUMBNAIL,
            result;

        // command
        imCommand = '"' + source + '[0]" -density 150 -thumbnail ' + size + 'x' + size + '> -flatten "jpg:' + target + '"';
        //imCommand = '"' + source + '[0]" -density 150 -thumbnail ' + size + 'x' + size + ' -background white -alpha remove "jpg:' + target + '"';
        // convert pdf
        result = im.convert(imCommand);
        // error log
//        if (result.console && result.console.stdErr) {
//            console.error('[IMAGE-MAGICK] ' + result.console.stdErr);     
//        }

        return result;
    } catch (e) {
       WAKTOOLS.log(e);
       return e;
    }
}


/**
 * convert image size
 *
 * @param source  {String} source image file path
 * @param target  {String} target image file path
 * @param size    {Number} max image size (length or heigth) in pixel
 * @return result {Object} imagemagick result object
 */

WAKTOOLS.resize = function(source, target, size) {
    try {
        var im = require('image-magick'),
            imCommand = '',
            size = size || __CONFIG.IMAGE_SIZE_LARGE,
            result;

        // command     
        imCommand = '"' + source + '" -resize ' + size + 'x' + size + '\> "' + target + '"';
        // convert image
        result = im.convert(imCommand);
        // error log
        if (result.console && result.console.stdErr) {
            console.error('[IMAGE-MAGICK] ' + result.console.stdErr);     
        }
             
       return result;
    } catch (e) {
       WAKTOOLS.log(e);
       return e;     
    }
}


/**
 * load file icon
 *
 * @param dropzoneFile {Object} dropzone file object
 * @return image       {Image}  thumbnail image object
 */

WAKTOOLS.icon = function(dropzoneFile) {
    try {
        var orgFile = File(ds.getDataFolder().path + 'tmp/' + dropzoneFile.name),
            tmpFile = File(ds.getDataFolder().path + 'tmp/tmp_' + generateUUID()),
            result;

        // check if image
        if(['image/jpeg', 'image/gif', 'image/png', 'image/bmp'].indexOf(dropzoneFile.type) !== -1) {
            // create thumbnail
            WAKTOOLS.thumbnail(orgFile.path, tmpFile.path);    
            result = loadImage(tmpFile);  
            // remove thumb file
            tmpFile.remove();
        } else if (['application/pdf'].indexOf(dropzoneFile.type) !== -1) {
            // create thumbnail
            WAKTOOLS.thumbnailPDF(orgFile.path, tmpFile.path);    
            result = loadImage(tmpFile);  
            // remove thumb file
            tmpFile.remove();          
        }else {
            var icon = 'default.png';

            if(['doc', 'docx'].indexOf(orgFile.extension) !== -1) {
                icon = 'word.png';
            } else if (['xls', 'xlsx'].indexOf(orgFile.extension) !== -1) {
                icon = 'excel.png';
            } else if (['ppt', 'pptx', 'pps', 'ppsx'].indexOf(orgFile.extension) !== -1) {
                icon = 'powerpoint.png';
            } else if (['wmv', 'mov', 'avi', 'mp3', 'mp4', 'm4a', 'm4v'].indexOf(orgFile.extension) !== -1) {
                icon = 'media.png';
            } else if (['txt', 'csv', 'xml'].indexOf(orgFile.extension) !== -1) {
                icon = 'document.png';
            }
            result = loadImage(ds.getModelFolder().path + 'Libs/waktools/icons/' + icon);
        }
       
        return result;
    } catch (e) {
        WAKTOOLS.log(e);
        return e;     
    }
}


/**
 * sync web folder
 */

WAKTOOLS.sync = function() {
    try {
        if (os.isLinux) {
            var worker = new SystemWorker(__CONFIG.SCRIPT_WWW_SYNC);
         
            // terminate worker after sincronisation
            worker.onterminated = function () {        
                exitWait(); 
            };
            // terminate system worker after 10 seconds if not responding
            setTimeout(function() {
                worker.terminate();
            }, 10000);
            wait();
             
            return true;
        }     
    } catch (e) {
        WAKTOOLS.log(e);
        return e; 
    }
};


/**
 * convert string to slug
 */

WAKTOOLS.convertToSlug = function(str) {
    try {
        str = str.replace(/^\s+|\s+$/g, ''); // trim
        str = str.toLowerCase();

        // remove accents, swap ñ for n, etc
        var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
        var to   = "aaaaeeeeiiiioooouuuunc------";
        for (var i=0, l=from.length ; i<l ; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }

        str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-'); // collapse dashes

        return str;      
    } catch (e) {
        WAKTOOLS.log(e);
        return e; 
    }
};


/**
 * error handler
 */

WAKTOOLS.log = function(error) {
    try {
        // log error
        console.error('[SOURCE] ' + error.sourceURL + ' [LINE] ' + error.line + ' [MESSAGE] ' + error.message);
       
        return;     
    } catch (e) {
        console.error('WAKTOOLS.log() ' + e);
    }
};


/**
 * get path
 */

WAKTOOLS.path = function(entity, relationAttribute, pathAttribute) {
    try {
        if (entity[relationAttribute] && entity[relationAttribute][relationAttribute] == null) {
            return entity[pathAttribute];
        } else {
            return WAKTOOLS.path(entity[relationAttribute], relationAttribute, pathAttribute) + '/' + entity[pathAttribute];
        }       
    } catch (e) {
        WAKTOOLS.log(e);
        return e; 
    }
};


/**
 * new line to <br>
 */

WAKTOOLS.nl2br = function(str) {
    var str = WAKTOOLS.trim(str);
    // replace line breaks with br tags
    str = str.replace(/\n/g, '<br>');
    
    return str;
};


/**
 * convert string to HTML char code
 */

WAKTOOLS.toHtmlCharCode = function(str) {
    var resultArr = [];
    for ( var i = 0; i < str.length; ++i ) {
      resultArr.push('&#' + str.charCodeAt(i) + ';');
    }
    
    return resultArr.join('');
}


/**
 * trim string endings
 */

WAKTOOLS.teaserArray = function(datasource, orderByStr, maxItems) {
    
    var resultCollection = datasource.createEntityCollection();
    var orgCollection = datasource.all().orderBy(orderByStr);
    var orderByStr = orderByStr || 'ID';   
    
    for(var i = 0; i < maxItems && i < orgCollection.length; i++) {
       resultCollection.add(orgCollection[i]);
    }
    
    var resultArray = resultCollection.orderBy(orderByStr).toArray('');
    
    // free memory
    orgCollection = null;
    resultCollection = null;
       
    return resultArray;    
};


/**
 * clone wakanda dataclass entity
 */

WAKTOOLS.cloneEntity = function (entity) {
    var dataClass = entity.getDataClass(),
        clone = dataClass.createEntity();   
    
    // clone entity
    for (var i in entity) {
        if (entity.hasOwnProperty(i)) {
            if ((i != 'ID' && dataClass[i].kind == 'storage') || (dataClass[i].kind == 'relatedEntity')) {
                clone[i] = entity[i];
            }
        }
    }
    // save new entity
    clone.save();
    
    return clone;
};


/**
 * backup datastore to backup folder
 */

WAKTOOLS.backup = function() {
    try {
       var backupFolder = Folder(__CONFIG.BACKUP_DESTINATION),
         config,
         options,
         manifest,
         report = '';
       
       // create folder if not existing       
       if (! backupFolder.exists) {
         backupFolder.create();
       }
       // backup config
       var config = {
           useUniqueNames: true,
           maxRetainedBackups: __CONFIG.BACKUP_MAX_RETAINED_BACKUPS,
           destination: backupFolder
       };
       // callback functions
       var callback = {
         addProblem: function(problem) {
          // problem report
             report = report + '[LEVEL] ' + problem.ErrorLevel + ' [NUMBER] ' + problem.ErrorNumber + ' [TEXT] ' + problem.ErrorText + '\n';
           }
       };
       // start backup
       try {
         manifest = ds.backup(config, callback);   
       } catch (e) {
         WAKTOOLS.Error.log(e);
       }
        // return error if result is null
        if ( manifest ) {
           // infomail
           require('email').sendMail({
             subject: application.name + ' Backup erfolgreich [' + __CONFIG.SERVER_NAME + ']', 
             content: moment().format('DD.MM.YYYY HH:mm') + ' - ' + application.name + ' Backup erstellt\n\n' + JSON.stringify(manifest, null, '\t'),
             priority: '1'
           });
           
           return {successMessage: 'Backup erstellt'};
        } else {
           // infomail
           require('email').sendMail({
             subject: application.name + ' Backup fehlgeschlagen [' + __CONFIG.SERVER_NAME + ']',
             content: moment().format('DD.MM.YYYY HH:mm') + ' - ' + application.name + ' Backup auf ' + application.httpServer.ipAddress + ' ist fehlgeschlagen!\n\n' + report,
             priority: '1'
           });
           
           return {errorMessage: 'Backup fehlgeschlagen: ' + report};
        }
    } catch (e) {
       WAKTOOLS.log(e);
       return e;
    }
};
