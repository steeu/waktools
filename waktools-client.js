
/**
 * @author stefan eugster
 */

var WAKTOOLS = WAKTOOLS || {};


/**
 * match
 */
 
WAKTOOLS.match = function(regex, string) {
 	// extract amount
	if ( string && string.match(regex) && string.match(regex).length > 1) {
		return string.match(regex)[1]
	} else {
		return '';
	}
};


/**
 * convert nl into space
 */

WAKTOOLS.nl2space = function( str ) {
    var str = str || '';
    // replace line breaks with br tags
    str = str.replace(/\n/g, ', ');
    return str;
};


/**
 * convert nl into <br />
 */

WAKTOOLS.nl2br = function( str ) {
    var str = str || '';
    // replace line breaks with br tags
    str = str.replace(/\n/g, '<br />');
    return str;
};


/**
 * delay throttle
 */

WAKTOOLS.delay = (function(){
  var timer = 0;
  return function(callback, ms) {
    clearTimeout (timer);
    timer = setTimeout(callback, ms);
  };
})();


/**
 * error handler
 */


WAKTOOLS.Error = {};


/**
 * extract error message from datastore method
 * ex. used for dropzone messages
 *
 * @param  {Object} datastore return value
 * @return {String} error message
 */
 
WAKTOOLS.Error.message = function (event) {
    
    var message = '';

    // get error message
    if (event.result.errorMessage) {
        message = event.result.errorMessage;
    } else if (event.result.messages && event.result.messages.length > 0) {
        message = event.result.messages.join('\n\n');
    }
    
    return message;
};


/**
 * screen handler
 *
 * @param path {String} component path
 */

WAKTOOLS.screen = function(componentPath) {
    // activate navigation item
	$('.mainNavItem').each(function(event) {
	    if ($(this).attr('data-component') == componentPath) {
	        $(this).addClass('activeItem');
	    } else {
	        $(this).removeClass('activeItem');
	    }
	});
    // cache current component path
    localStorage.setItem('componentPath', componentPath);
	// remove component
	//$$('mainScreen').removeComponent();
    // start spinner
	WAKTOOLS.Spinner.spin();
	$$('mainScreen').loadComponent({
		path: componentPath,
		onSuccess: function(event){
			// stop active spinner
			WAKTOOLS.Spinner.stop();
		}
	});
};



/**
 * add navigation to header bar
 */

WAKTOOLS.navigation = function (callbackFn) {
    ds.Component.getNavigation({
		onSuccess: function (event) {
        	var $container = $('#navContainer'),
        		templateSource = $('#navigationTemplate').html(),
        		templateFn = Handlebars.compile(templateSource),
        		data = event.result;

            // apply template
        	$container.html(templateFn(data));
        	// callback function
            callbackFn();
        	// navigation cklick event
        	$container.on('click', '.mainNavItem', function(event) {
        		var $this = $(this),
        		    linkName = $this.text();

        		WAKTOOLS.screen($this.attr('data-component'));
        	});
        	// navigation mouseenter event
        	$container.on('mouseenter', '.mainNavItem', function(event) {
        		$(this).addClass('hoverItem');
        	});
        	// navigation mouseleave event
        	$container.on('mouseleave', '.mainNavItem', function(event) {
        		$(this).removeClass('hoverItem');
        	});			    
		}
	});   
};


/**
 * user login handler
 */

WAKTOOLS.login = function() {
    var componentPath = localStorage.getItem('componentPath');
    
	if ( WAF.directory.currentUser() === null ) {
		$('#mainScreen').addClass('show-login-dialog');
        WAKTOOLS.screen('/components/public-login.waComponent');		
	} else {
	    // add navigation
	    WAKTOOLS.navigation(function(event) {
    	    $('#mainScreen').removeClass('show-login-dialog');
            // add login name to header bar
    		$('#loginName').text(WAF.directory.currentUser().fullName);
    	    // set default page if component path is not set
    	    if (!componentPath || componentPath == '/components/public-login.waComponent') {
    	        WAKTOOLS.screen('/components/public-page.waComponent');
    	    } else {
                // load component
                WAKTOOLS.screen(componentPath);    	    
    	    }	    
	    });
		// idle timer (logout after 10 min inactivity)
		new WAKTOOLS.Idle(1000 * 60 * 10, WAKTOOLS.logout);
	}
};


/**
 * user logout handler
 */

WAKTOOLS.logout = function() {
	WAF.directory.logout({
		onSuccess: function() {
		    // reset component path
		    localStorage.setItem('componentPath', '');
		    // reload window
		    window.location.reload();
		}
	});
};


/**
 * user notifications
 */

WAKTOOLS.alert = function(message, options) {
	try {
	    var options = options || {};
	    
	    // default type
	    options.type = options.type || 'success';
		// display message for debugging issues
		console.log(message);	    
	    // toastr default settings
		toastr.options = {
			closeButton: false,
			timeOut: '5000',
  			extendedTimeOut: '1000',
  			positionClass: 'toast-bottom-right'
		};
		// check if message is string
		if (Object.prototype.toString.call(message) === '[object String]' || Object.prototype.toString.call(message) === '[object Boolean]') {
		    // display message
			toastr[options.type]('' + message);		
		} else if (Object.prototype.toString.call(message) === '[object Array]') {
		    // loop array
		    for (var i = 0; i < message.length; i++) {
			    WAKTOOLS.alert(message[i], options);
    		};
		} else {
			if ('result' in message) {
				WAKTOOLS.alert(message.result, options);
			} else if ('message' in message) {
				WAKTOOLS.alert(message.message, options);
			} else if ('error' in message) {
			    options.type = 'error';
			    if (options.onError) {
			        options.onError();
			        options.onError = null;
			    }
				WAKTOOLS.alert(message.error, options);
			} else if ('successMessage' in message) {
			    if (options.onSuccess) {
			        options.onSuccess();
			        options.onSuccess = null;
			    }
				WAKTOOLS.alert(message.successMessage, options);
			} else if ('errorMessage' in message ) {
			    options.type = 'error';
			    if (options.onError) {
			        options.onError();
			        options.onError = null;
			    }
				WAKTOOLS.alert(message.errorMessage, options);
			} else {
				throw new Error('Unknown message object');
			}
		}
	} catch (e) {
		toastr.error('Es ist ein Fehler aufgetreten. Bitte schliessen sie die Anwendung und versuchen Sie es erneut.');
		console.log(e);
	}
};


/**
 * modal component dialog
 */

WAKTOOLS.modal = function(options) {
	try {
		var options = options || {},
			width = options.width || 452,
			height = options.height || 250,
			componentPath = options.componentPath || '/components/modal-confirm.waComponent',
			dialog,
			dialogComponent;

		// dialog size
		switch(options.size) {
			case 'medium':
				width = 1024;
				height = 720;
				break;
			case 'full':
				width = window.innerWidth - 80;
				height = window.innerHeight - 80;
				break;
		}
		// component title
		waf.widgets.txtTitle.setValue(options.title);
		dialog = waf.widgets.modalDialog;
		dialogComponent = waf.widgets.modalDialogComponent;
		// remove component
		dialogComponent.removeComponent();
		// load dialog component
		dialogComponent.loadComponent({
			path: componentPath,
			userData: { 
				onConfirm: options.onConfirm,
				onCancel: options.onCancel,
				message: options.message,
				value: options.value,
				selectedElementID: options.selectedElementID
			}
		});
		// dialog size and position
		dialog.setWidth(width);
		dialog.setHeight(height);
		dialog.setLeft((window.innerWidth - width)/2);
		dialog.setBottom((window.innerHeight - height)/2);
		dialog.displayDialog();		
	} catch (e) {
		console.log(e);
	}	
}


/**
 * spinner
 */

WAKTOOLS.Spinner = WAKTOOLS.Spinner || {};

WAKTOOLS.Spinner.spin = function () {
	if (this.spinner == null) {
		this.spinner = new Spinner({
			lines:  15, // The number of lines to draw
			length: 15, // The length of each line
			width:  3, // The line thickness
			radius: 15, // The radius of the inner circle
			color:  '#000000', // #rbg or #rrggbb
			speed:  1, // Rounds per second
			trail:  10, // Afterglow percentage
			shadow: false // Whether to render a shadow
		});
		this.spinner.spin(document.getElementById('wrapperMain'));
	}
};

WAKTOOLS.Spinner.stop = function () {
	if (this.spinner) {
		this.spinner.stop();
		this.spinner = null;
	}
};


/**
 * idle timer
 * @param  {Number}   time in milliseconds
 * @param  {Function} timeout functions
 */

WAKTOOLS.Idle = function(time, timeoutFn) {
	var _this = this;
		
	// idle time
	_this.idleTime = time;
	// timeout function
	_this.timeoutFn = timeoutFn;
	// add event listeners
    window.addEventListener("mousemove", function(){_this.reset()}, false);
    window.addEventListener("mousedown", function(){_this.reset()}, false);
    window.addEventListener("keypress", function(){_this.reset()}, false);
};

WAKTOOLS.Idle.prototype.startTimer = function() {
	var _this = this;
	
    // set timout function
    _this.timeoutID = window.setTimeout(function(){
    	_this.timeoutFn();
    }, _this.idleTime);
}

WAKTOOLS.Idle.prototype.reset = function() {
	var _this = this;

	// reset timout
    window.clearTimeout(_this.timeoutID);
    // restart timer
    _this.startTimer();		
}