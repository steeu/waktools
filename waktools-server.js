
/**
 * @author stefan eugster
 */

var WAKTOOLS = WAKTOOLS || {};


/**
 * basic auth
 *
 * @param user     {String} user name
 * @param password {String} password
 * @return result  {String} base64 encoded user:password
 */

WAKTOOLS.basicAuth = function(user, password) {
    try {
        var credentials = user + ':' + password,
            credentials_hash,
            basic_auth;
           
        // base64 hash
        credentials_hash = new Buffer(credentials).toString('base64');
        // basic auth string
        basic_auth = 'Basic ' + credentials_hash;
        
        return basic_auth;	
    } catch (e) {
		WAKTOOLS.log(e);
    	return e;
    }
};


/**
 * execution time in seconds
 *
 * @param date    {Date}   start date object
 * @return result {Object} time in seconds since start date
 */
 
WAKTOOLS.executionTime = function(date) {
	try {
		return (new Date() - date) / 1000;
	} catch (e) {
		WAKTOOLS.log(e);
		return e;
	}
};


/**
 * validate json object
 *
 * @param str     {str}     JSON string
 * @return result {Boolean} true/false
 */
 
WAKTOOLS.isJSON = function(str) {
	try {
        try {
            // try parse
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        
        return true;
	} catch (e) {
		WAKTOOLS.log(e);
		return e;
	}
};


/**
 * validate url
 *
 * @param str {String} url
 * @return    {String} url
 */
 
WAKTOOLS.toURL = function(str) {
    try {
        // validate url
        if (/^(http|https):\/\/|^mailto:/.test(str) == false) {
            str = 'http://' + str;
        }
        
        return str;	
    } catch (e) {
 		WAKTOOLS.log(e);
		return e;   	
    }
};


/**
 * trim string attributes
 *
 * @param entity  {Entity}  entity for trimming stringsGen
 * @return result {Boolean} true
 */
 
WAKTOOLS.trimStringAttributes = function(entity) {
	try {
		var modifiedArr = entity.getModifiedAttributes(),
		    dataClass = entity.getDataClass();

	    if (entity.isNew()) {
	        // loop all attributes
			for (var attrName in dataClass.attributes){
			    // check if string
				if (dataClass[attrName].type === 'string') {
				    // trim or initialize
				    if (entity[attrName] === null) {
   				        entity[attrName] = '';
				    } else {
					    entity[attrName] = (entity[attrName] + '').trim();
				    }
				}
			}	    
	    } else {		
    		// loop modified attributes
    		for (var i = 0; i < modifiedArr.length; i++) {
    		    // check if string
    		    if (dataClass[modifiedArr[i]].type === 'string') {
    		        entity[modifiedArr[i]] = (entity[modifiedArr[i]] + '').trim();
    		    }
    		};
	    }
	    
	    return true;		
	} catch (e) {
		WAKTOOLS.log(e);
		return e;
	}
};


/**
 * move folder
 *
 * @param source {String/Folder} folder object or folder path source
 * @param target {String/Folder} folder object or folder path target
 * @return       {Boolean}       true/false
 */
 
WAKTOOLS.moveFolder = function(source, target, overwrite) {
	try {
	    var source = (Object.prototype.toString.call(source) === '[object Folder]') ? source : Folder(source),
	        target = (Object.prototype.toString.call(target) === '[object Folder]') ? target : Folder(target),
	        overwrite = overwrite || true;
	    
	    // validate path
	    if (source.path !== target.path) {
	        // validate source
    	    if (source.exists) {
        	    // check if target exists 
        	    if (!target.exist) {
        	        target.create();
        	    }
        	    // loop containing files
        	    source.forEachFile(function(file) {
        	        WAKTOOLS.moveFile(file.path, target.path + file.name, overwrite);
        	        //file.moveTo(target.path + file.name, overwrite);
        	    });
        	    // loop containing folders
        	    source.forEachFolder(function(folder) {
        	        WAKTOOLS.moveFolder(folder.path, target.path + folder.name + '/');
        	    });
        	    // remove source folder
        	    source.remove();
    	    } else {
    	        return false;
    	    }
	    }
	    
		return true;
	} catch (e) {
		WAKTOOLS.log(e);
		return e;
	}
};


/**
 * move file
 *
 * @param source {String/File} file object or file path source
 * @param source {String/File} file object or file path target
 * @return       {Boolean}     true/false
 */
 
WAKTOOLS.moveFile = function(source, target, overwrite) {
	try {
	    var source = (Object.prototype.toString.call(source) === '[object File]') ? source : File(source),
	        target = (Object.prototype.toString.call(target) === '[object File]') ? target : File(target),
	        overwrite = overwrite || true;

        // validate sourcs file
        if (source.exists) {
            // validate target foler
            if (!target.parent.exists) {
                // create folder if not existent
                target.parent.create();
            }
            source.moveTo(target, overwrite);
        } else {
            return false;
        }
	        	    
		return true;
	} catch (e) {
		WAKTOOLS.log(e);
		return e;
	}
};


/**
 * export to html
 *
 * @param options {Object} options object
 * @return result {Boolean} true/false
 */
 
WAKTOOLS.exportToHTML = function(params) {
	try {
	    var params = params || {},
	        exportFile;
	
	    params.data.language = params.language ? params.language : 'de';
	    params.data.misc = __TEMPLATE_DATA[params.data.language];

	    // export file
		exportFile = File(params.file);
		exportFile.parent.create();	
		// save file
		saveText(WAKTOOLS.renderHTML(params.data, params.template), exportFile , __CONFIG.EXPORT_CHARSET);
		// sync web directory
		if (params.sync) {
            WAKTOOLS.sync();
        }
	   	    
		return true;
	} catch (e) {
		WAKTOOLS.log(e);
		return e;
	}
};


/**
 * render html
 *
 * @param data    {Object} data object array
 * @param crop    {String} template name
 * @return result {String} html
 */

WAKTOOLS.renderHTML = function(data, template) {
	try {
		var html,
		    source,
		    templateFn;

		// load templates
		source = ds.Template.find('fileName == :1', template).content;
		// check if source exists
		if (source && source.length > 0) {
		    templateFn = Handlebars.compile(source);
    		// apply template
    		html = templateFn(data);			
    		
    		return html;
	    } else {
	        return 'template "' + template + '" not found in wakanda db';
	    }
	} catch (e) {
		WAKTOOLS.log(e);
		return e;
	}
};


/**
 * create thumbnail from image
 *
 * @param source  {String}  source image file path
 * @param target  {String}  target image file path
 * @param size    {Number}  max image size (length or heigth) in pixel
 * @param crop    {Boolean} crop image to specified size if true
 * @return result {Object}  imagemagick result object
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
 * load file icon
 *
 * @param dropzoneFile {Object} dropzone file object
 * @return image       {Image}  thumbnail image object
 */

WAKTOOLS.icon = function(file) {
    try {
        var orgFile = File(ds.getDataFolder().path + 'tmp/' + file.name),
            tmpFile = File(ds.getDataFolder().path + 'tmp/tmp_' + generateUUID()),
            result;

        // check if image
        if(['image/jpeg', 'image/gif', 'image/png', 'image/bmp'].indexOf(file.type) !== -1) {
            // create thumbnail
            WAKTOOLS.thumbnail(orgFile.path, tmpFile.path);    
            result = loadImage(tmpFile);  
            // remove thumb file
            tmpFile.remove();
        } else if (['application/pdf'].indexOf(file.type) !== -1) {
            // create thumbnail
            WAKTOOLS.thumbnailPDF(orgFile.path, tmpFile.path);    
            result = loadImage(tmpFile);  
            // remove thumb file
            tmpFile.remove();          
        }else {
            var icon = 'default.png';

            if(['doc', 'docx', 'docm'].indexOf((orgFile.extension + '').toLowerCase()) !== -1) {
                icon = 'word.png';
            } else if (['xls', 'xlsx', 'xlsm'].indexOf((orgFile.extension + '').toLowerCase()) !== -1) {
                icon = 'excel.png';
            } else if (['ppt', 'pptx', 'pps', 'ppsx'].indexOf((orgFile.extension + '').toLowerCase()) !== -1) {
                icon = 'powerpoint.png';
            } else if (['wmv', 'mov', 'avi', 'mp3', 'mp4', 'm4a', 'm4v'].indexOf((orgFile.extension + '').toLowerCase()) !== -1) {
                icon = 'media.png';
            } else if (['txt', 'csv', 'xml'].indexOf((orgFile.extension + '').toLowerCase()) !== -1) {
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
        if (entity[relationAttribute] && ! entity[relationAttribute][relationAttribute]) {
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
    var str = str.trim();
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
 * get the value from a related entity attribute
 * @param   {object} entity
 * @param   {string} relAttrPath - eg "company.id"
 * @param   {*}      [valIfNot] - value to return if the related entity does not exist (if not passed will return undefined)
 * @returns {*}      val - the value of the related entity attribute
 */

WAKTOOLS.getRelAttrVal = function(object, path, valIfNot) {
	var val,
		attributes,
		attr;
 
	val = object;
	attributes = path.split('.');
	while (typeof val === 'object' && val && attributes.length) {
		attr = attributes.shift();
		val = val[attr];
	}
	if ((typeof val === 'undefined') && (typeof valIfNot !== 'undefined')) {
		val = valIfNot;
	}
 
	return val;
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